const crypto = require('crypto');
const { command, getJson, setJson } = require('./kv');

const KEY_PATTERN = /^GHST-(?:[A-Z0-9]{4}-){4}[A-Z0-9]{4}$/;
// One key, one Instagram account (enforced below via the atomic SET...NX
// binding). LIFETIME: a key never expires — pay 5€ once, keep it forever.

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase();
}

function validAccountId(value) {
  return /^\d{1,30}$/.test(String(value || ''));
}

function newKey() {
  const chars = crypto.randomBytes(10).toString('hex').toUpperCase();
  return 'GHST-' + chars.match(/.{1,4}/g).join('-');
}

function licenseKey(key) { return 'ghosted:license:' + key; }
/* El indice para recuperar la clave va por HASH del correo, no por el correo
   en claro: asi quien mirara el almacen por encima no se lleva la lista de
   compradores. Es un indice, no un secreto — la ficha guarda el correo igual,
   porque hace falta para volver a escribirle. */
function emailKey(email) {
  const limpio = String(email || '').trim().toLowerCase();
  return 'ghosted:email:' + crypto.createHash('sha256').update(limpio).digest('hex').slice(0, 32);
}
function bindingKey(key) { return 'ghosted:binding:' + key; }

// Una clave libre, y de verdad libre. Son 80 bits al azar, asi que dos
// compradores sacando la misma es practicamente imposible — pero si pasara,
// el segundo heredaria la ficha del primero, ya atada a otra cuenta de
// Instagram, y se quedaria sin producto DESPUES de pagar. El hueco se reclama
// con SET NX, que es atomico: si otro lo cogio antes, se prueba con otra.
async function claimFreeKey() {
  for (let intento = 0; intento < 5; intento++) {
    const key = newKey();
    if (await command(['SET', 'ghosted:keyclaim:' + key, '1', 'NX'])) return key;
  }
  throw new Error('license_key_exhausted');
}

async function issueLicense(session) {
  const sessionKey = 'ghosted:stripe:session:' + session.id;
  let key = await command(['GET', sessionKey]);
  if (!key) {
    key = await claimFreeKey();
    // El webhook de Stripe se reintenta: si otra pasada ya emitio la clave de
    // esta compra, vale la suya y esta se descarta. Una compra, una clave.
    const claimed = await command(['SET', sessionKey, key, 'NX']);
    if (!claimed) key = await command(['GET', sessionKey]);
  }
  const existing = await getJson(licenseKey(key));
  if (!existing) {
    const record = {
      key,
      status: 'active',
      // Which product this key was actually paid for ('pro' 5€ or 'plus'
      // 3.50€) — set from the Checkout Session metadata (checkout.js stamps
      // it). Defaults to 'pro' for any session created before this existed.
      plan: (session.metadata && session.metadata.plan) || 'pro',
      // Idioma en el que se hizo la compra: en ese llega el correo.
      lang: (session.metadata && session.metadata.lang) || 'en',
      createdAt: new Date().toISOString(),
      checkoutSessionId: session.id,
      paymentIntent: session.payment_intent || null,
      customerEmail: (session.customer_details && session.customer_details.email) || null,
      // Opcional: Stripe solo lo trae si el comprador lo dejo. Segunda via
      // para la clave, ver lib/entrega.js.
      customerPhone: (session.customer_details && session.customer_details.phone) || null,
    };
    await setJson(licenseKey(key), record);
    if (record.paymentIntent) await command(['SET', 'ghosted:stripe:payment:' + record.paymentIntent, key]);
    /* Una persona puede comprar Plus y luego Pro, asi que el indice guarda
       lista, no una sola clave. Si falla, la licencia ya esta emitida: como
       mucho se pierde la recuperacion por correo, no la compra. */
    if (record.customerEmail) {
      try {
        const idx = (await getJson(emailKey(record.customerEmail))) || [];
        if (idx.indexOf(key) === -1) { idx.push(key); await setJson(emailKey(record.customerEmail), idx); }
      } catch (e) { console.error('indice_email_fallo', e && e.message); }
    }
  }
  return key;
}

// Deja constancia de por donde salio la clave. La pantalla de gracias lo lee
// para decir la verdad: si el correo no salio, no dice que lo ha mandado.
async function markDelivered(key, sent) {
  const record = await getJson(licenseKey(key));
  if (!record) return null;
  record.sent = Object.assign({}, record.sent, sent, { at: new Date().toISOString() });
  await setJson(licenseKey(key), record);
  return record;
}

/* Todas las licencias compradas con ese correo. Devuelve [] si no hay
   ninguna — quien llama NO debe distinguir "no existe" de "no te lo digo". */
async function porEmail(email) {
  const claves = (await getJson(emailKey(email))) || [];
  const fichas = [];
  for (const k of claves) {
    const r = await getJson(licenseKey(k));
    if (r && r.status === 'active') fichas.push(r);
  }
  return fichas;
}

/* Deja constancia de que alguien intento activar esta clave con OTRA cuenta de
   Instagram. Es lo que pasa cuando un comprador la reparte: la clave no se
   abre —el enganche es a una sola cuenta— pero conviene poder verlo. */
async function apuntarIntento(key, accountId) {
  const record = await getJson(licenseKey(key));
  if (!record) return null;
  const abuso = record.abuse || { veces: 0, cuentas: [] };
  abuso.veces += 1;
  abuso.ultimo = new Date().toISOString();
  const id = String(accountId);
  if (abuso.cuentas.indexOf(id) === -1) abuso.cuentas = abuso.cuentas.concat(id).slice(-10);
  record.abuse = abuso;
  await setJson(licenseKey(key), record);
  return abuso;
}

async function resolve(key) {
  const clean = normalizeKey(key);
  if (!KEY_PATTERN.test(clean)) return { key: clean, record: null };
  return { key: clean, record: await getJson(licenseKey(clean)) };
}

// The 365-day clock starts at first ACTIVATION (not at purchase), so a key
// bought today but installed next week isn't unfairly docked those days.
async function ensureActivationClock(key) {
  const record = await getJson(licenseKey(key));
  if (!record) return null;
  if (!record.activatedAt) {
    record.activatedAt = new Date().toISOString();
    await setJson(licenseKey(key), record);
  }
  return record;
}

// LIFETIME: keys never expire (also un-expires any legacy key that had a date).
function expiryOf(record) {
  return { expired: false, expiresAt: null };
}

// `product` is which extension build is asking ('pro' or 'plus', sent by
// background.js). Checked against the plan actually stamped on the key at
// checkout — without this, a 3.50€ Plus key would silently unlock the full
// 5€ Pro extension too, since both are otherwise just "a valid key". Omit
// `product` (older extension builds that predate this) to skip the check.
function wrongProduct(record, product) {
  return !!product && (record.plan || 'pro') !== product;
}

async function activate(key, accountId, product) {
  const account = String(accountId || '').trim();
  if (!validAccountId(account)) return { valid: false, error: 'account' };
  const found = await resolve(key);
  if (!found.record) return { valid: false, error: 'invalid' };
  if (found.record.status !== 'active') return { valid: false, error: 'revoked', revoked: true };
  if (wrongProduct(found.record, product)) return { valid: false, error: 'wrong_product' };
  const bound = await command(['GET', bindingKey(found.key)]);
  if (bound && bound !== account) {
    try { await apuntarIntento(found.key, account); } catch (e) { /* no bloquea */ }
    return { valid: false, error: 'bound' };
  }
  if (!bound) {
    const set = await command(['SET', bindingKey(found.key), account, 'NX']);
    if (!set) {
      const current = await command(['GET', bindingKey(found.key)]);
      if (current !== account) {
        try { await apuntarIntento(found.key, account); } catch (e) { /* no bloquea */ }
        return { valid: false, error: 'bound' };
      }
    }
  }
  const record = await ensureActivationClock(found.key);
  const expiry = expiryOf(record);
  if (expiry.expired) return { valid: false, error: 'expired', expiresAt: expiry.expiresAt };
  return { valid: true, accountId: account, expiresAt: expiry.expiresAt, plan: record.plan || 'pro' };
}

async function verify(key, accountId, product) {
  const account = String(accountId || '').trim();
  if (!validAccountId(account)) return { valid: false, error: 'account' };
  const found = await resolve(key);
  if (!found.record) return { valid: false, error: 'invalid' };
  if (found.record.status !== 'active') return { valid: false, error: 'revoked', revoked: true };
  if (wrongProduct(found.record, product)) return { valid: false, error: 'wrong_product' };
  const bound = await command(['GET', bindingKey(found.key)]);
  if (!bound) return { valid: false, error: 'unbound' };
  if (bound !== account) return { valid: false, error: 'bound' };
  const expiry = expiryOf(found.record);
  if (expiry.expired) return { valid: false, error: 'expired', expiresAt: expiry.expiresAt };
  return { valid: true, accountId: account, expiresAt: expiry.expiresAt, plan: found.record.plan || 'pro' };
}

async function revokePayment(paymentIntent) {
  if (!paymentIntent) return;
  const key = await command(['GET', 'ghosted:stripe:payment:' + paymentIntent]);
  if (!key) return;
  const record = await getJson(licenseKey(key));
  if (!record) return;
  record.status = 'revoked';
  record.revokedAt = new Date().toISOString();
  await setJson(licenseKey(key), record);
}

module.exports = { activate, apuntarIntento, issueLicense, markDelivered, normalizeKey, porEmail, resolve, revokePayment, verify };

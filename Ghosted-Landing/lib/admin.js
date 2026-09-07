'use strict';
/* La puerta del panel de ventas.
 *
 * Detras hay datos de clientes y botones que anulan claves ya pagadas, asi que
 * la puerta es lo primero: sin ADMIN_TOKEN puesto en Vercel, el panel entero
 * responde 503 y no existe. Preferible a que quede abierto por olvido.
 *
 * El token viaja en la cabecera Authorization, nunca en la URL: las URL se
 * quedan en los registros del servidor, en el historial y en el Referer. */
const crypto = require('crypto');
const { command, getJson } = require('./kv');

function configurado() {
  const t = process.env.ADMIN_TOKEN || '';
  return t.length >= 24;   // por debajo de eso no es un secreto, es una palabra
}

/* Comparacion en tiempo constante: comparar con === filtra por cuanto tarda en
   fallar, y con eso se adivina el token letra a letra. */
function autorizado(req) {
  if (!configurado()) return false;
  const cabecera = String((req.headers && req.headers.authorization) || '');
  const dado = cabecera.replace(/^Bearer\s+/i, '');
  const bueno = process.env.ADMIN_TOKEN;
  const a = Buffer.from(crypto.createHash('sha256').update(dado).digest());
  const b = Buffer.from(crypto.createHash('sha256').update(bueno).digest());
  return crypto.timingSafeEqual(a, b);
}

/* Todas las licencias. Se recorren con SCAN y no con KEYS: KEYS bloquea el
   almacen mientras dura, y aqui puede haber miles de fichas. */
async function licencias(limite = 2000) {
  const fichas = [];
  let cursor = '0';
  do {
    const r = await command(['SCAN', cursor, 'MATCH', 'ghosted:license:*', 'COUNT', '200']);
    cursor = String((r && r[0]) || '0');
    const claves = (r && r[1]) || [];
    for (const c of claves) {
      const f = await getJson(c);
      if (f && f.key) fichas.push(f);
      if (fichas.length >= limite) return { fichas, completo: false };
    }
  } while (cursor !== '0');
  return { fichas, completo: true };
}

/* A que cuenta de Instagram esta atada cada clave. Va en su propia entrada del
   almacen, no dentro de la ficha, asi que hay que pedirla aparte. */
async function atadaA(key) {
  try { return await command(['GET', 'ghosted:binding:' + key]); } catch (e) { return null; }
}

/* Lo que se enseña en el panel. El resumen se calcula aqui y no en el
   navegador para que la pagina no tenga que traerselo todo dos veces. */
function resumen(fichas) {
  const precio = { pro: 7, plus: 5 };
  let ingresos = 0, activas = 0, revocadas = 0, activadas = 0, conAbuso = 0;
  const porPlan = {};
  for (const f of fichas) {
    const plan = f.plan || 'pro';
    porPlan[plan] = (porPlan[plan] || 0) + 1;
    if (f.status === 'active') { activas++; ingresos += precio[plan] || 0; } else revocadas++;
    if (f.activatedAt) activadas++;
    if (f.abuse && f.abuse.veces) conAbuso++;
  }
  return {
    total: fichas.length, activas, revocadas, activadas, conAbuso, porPlan,
    // Bruto y aproximado: no descuenta la comision de Stripe ni el IVA, y da
    // por hecho el precio de HOY. Para cuadrar de verdad, Stripe.
    ingresosBrutos: ingresos,
  };
}

module.exports = { autorizado, configurado, licencias, atadaA, resumen };

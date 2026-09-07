'use strict';
/* La entrega de la clave por correo y por SMS.
 *
 * Lo que se comprueba no es que llegue —eso depende de Resend y de Twilio—
 * sino que NADA de esto pueda tumbar el webhook. Si el webhook devuelve error,
 * Stripe lo reintenta y la compra queda como fallida: el comprador ha pagado y
 * no tiene nada. Por eso cada fallo posible tiene aqui su caso. */
const path = require('path');
const { suite } = require('./lib/probar');

const ENTREGA = path.resolve(__dirname, '..', '..', 'Ghosted-Landing', 'lib', 'entrega.js');

module.exports = async () => {
  const s = suite('entrega de la clave');

  const limpio = { ...process.env };
  const fetchReal = global.fetch;
  /* Cada caso arranca con el modulo recien cargado: lee process.env al vuelo,
     pero el almacen guarda estado entre llamadas. */
  const cargar = () => { delete require.cache[require.resolve(ENTREGA)]; return require(ENTREGA); };

  const ficha = (extra) => ({ key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE', plan: 'pro',
    customerEmail: 'quien@ejemplo.com', customerPhone: '+34600000000', ...extra });

  /* El almacen responde a todo que si, para que markDelivered no estorbe. */
  const espiar = (responder) => {
    const visto = [];
    global.fetch = async (url, opciones) => {
      visto.push(String(url));
      if (String(url).includes('upstash') || String(url).includes('localhost')) {
        return { ok: true, json: async () => ({ result: null }), text: async () => '' };
      }
      return responder(String(url), opciones);
    };
    return visto;
  };
  const ok = async () => ({ ok: true, json: async () => ({}), text: async () => '' });

  process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.local';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'x';

  try {
    // 1 · sin nada configurado no se envia, y sobre todo no revienta
    delete process.env.RESEND_API_KEY; delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN; delete process.env.TWILIO_FROM;
    let visto = espiar(ok);
    let r = await cargar().entregar(ficha());
    s.eq('sin configurar no envia nada', r, { email: false, sms: false });
    s.eq('y no llama a nadie de fuera', visto.filter((u) => /resend|twilio/.test(u)), []);

    // 2 · con Resend puesto, sale el correo
    process.env.RESEND_API_KEY = 're_falsa';
    visto = espiar(ok);
    r = await cargar().entregar(ficha());
    s.eq('con Resend sale el correo', r.email, true);
    s.eq('y solo el correo', r.sms, false);
    s.ok('llama a la api de Resend', visto.some((u) => u.includes('api.resend.com')));

    // 3 · con Twilio puesto, sale tambien el SMS
    process.env.TWILIO_ACCOUNT_SID = 'AC0'; process.env.TWILIO_AUTH_TOKEN = 't';
    process.env.TWILIO_FROM = '+10000000000';
    visto = espiar(ok);
    r = await cargar().entregar(ficha());
    s.eq('con Twilio sale el SMS', r, { email: true, sms: true });
    s.ok('llama a la api de Twilio', visto.some((u) => u.includes('api.twilio.com')));

    // 4 · sin telefono no hay SMS, aunque Twilio este puesto
    espiar(ok);
    r = await cargar().entregar(ficha({ customerPhone: null }));
    s.eq('sin numero no manda SMS', r.sms, false);

    // 5 · si el proveedor devuelve error, se apunta como no enviado y sigue
    espiar(async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => 'boom' }));
    r = await cargar().entregar(ficha());
    s.eq('un proveedor caido no impide seguir', r, { email: false, sms: false });

    // 6 · si el proveedor ni siquiera responde, tampoco se propaga el error
    espiar(async () => { throw new Error('sin red'); });
    r = await cargar().entregar(ficha());
    s.eq('sin red tampoco lanza', r, { email: false, sms: false });

    // 7 · lo ya entregado no se reenvia: un SMS duplicado se cobra dos veces
    const vistoRe = espiar(ok);
    r = await cargar().entregar(ficha({ sent: { email: true, sms: true, at: '2026-09-07T00:00:00.000Z' } }));
    s.eq('no reenvia lo ya entregado', vistoRe.filter((u) => /resend|twilio/.test(u)), []);

    // 8 · si el almacen falla al apuntar, la entrega ya hecha no se pierde
    global.fetch = async (url) => {
      if (String(url).includes('upstash')) throw new Error('almacen caido');
      return { ok: true, json: async () => ({}), text: async () => '' };
    };
    r = await cargar().entregar(ficha());
    s.eq('el almacen caido no tumba la entrega', r, { email: true, sms: true });
  } finally {
    global.fetch = fetchReal;
    process.env = limpio;
    delete require.cache[require.resolve(ENTREGA)];
  }

  return s;
};

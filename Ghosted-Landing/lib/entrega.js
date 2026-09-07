/* Entrega de la clave: correo y SMS.
 *
 * Nada de esto es la fuente de la verdad — la clave sale en pantalla nada mas
 * pagar, y la pagina de gracias la vuelve a pedir sola. Esto es la red por si
 * el comprador cierra la pestaña antes de copiarla, que es el caso en el que
 * se pierde de verdad: con la puerta cerrada, sin clave no hay extension.
 *
 * Por eso NADA de aqui puede tumbar el webhook. Si Resend esta caido, si
 * faltan las variables o si el numero es raro, se traga el error y se sigue:
 * un webhook que devuelve error hace que Stripe lo reintente y, peor, deja la
 * compra como fallida.
 *
 * Variables (todas opcionales; sin ellas simplemente no se envia por ese
 * canal):
 *   RESEND_API_KEY, MAIL_FROM            → correo
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM  → SMS
 */
const { downloadFor } = require('./downloads');
const { markDelivered } = require('./licenses');
const { correoLicencia } = require('./correo');

function sitio() {
  return process.env.SITE_URL || 'https://ghoosted.net';
}

/* El enlace va por clave y no por sesion de pago, para que siga sirviendo
   dentro de un mes y muera en cuanto la clave se anule. */
function enlaceDescarga(record) {
  return sitio() + '/api/download?key=' + encodeURIComponent(record.key);
}

async function porCorreo(record) {
  if (!process.env.RESEND_API_KEY || !record.customerEmail) return false;
  const dl = downloadFor(record.plan || 'pro');
  const carta = correoLicencia({
    key: record.key,
    producto: dl.name,
    lang: record.lang || 'en',
    urlDescarga: enlaceDescarga(record),
    sitio: sitio(),
  });
  // MAIL_FROM tiene que ser una direccion de un dominio verificado en Resend;
  // el remitente de pruebas solo entrega al dueño de la cuenta.
  const from = process.env.MAIL_FROM || 'Ghoosted <onboarding@resend.dev>';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: record.customerEmail,
        // Responder al correo tiene que llegar a un buzon que alguien lee: es
        // lo primero que hace quien se queda atascado instalando.
        reply_to: process.env.MAIL_REPLY_TO || 'hello@ghoosted.net',
        subject: carta.subject,
        html: carta.html,
        text: carta.text,
        // La clave tambien como fichero. Un .txt se abre en cualquier sitio,
        // se guarda en el movil y sobrevive a que se borre el correo.
        attachments: [{
          filename: carta.nombreAdjunto,
          content: Buffer.from(carta.adjunto, 'utf8').toString('base64'),
        }],
      }),
    });
    if (!r.ok) { console.error('resend_failed', r.status, await r.text().catch(() => '')); return false; }
    return true;
  } catch (e) {
    console.error('resend_error', e && e.message);
    return false;
  }
}

async function porSms(record) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !record.customerPhone) return false;
  const dl = downloadFor(record.plan || 'pro');
  /* Corto a proposito: un SMS son 160 caracteres y a partir de ahi se cobra
     como dos. La clave entera cabe; la explicacion larga va en el correo. */
  const texto = dl.name + ': tu clave es ' + record.key
    + '. Guardala. Descarga: ' + enlaceDescarga(record);
  try {
    const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(sid) + '/Messages.json', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(sid + ':' + token).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: record.customerPhone, From: from, Body: texto }).toString(),
    });
    if (!r.ok) { console.error('twilio_failed', r.status, await r.text().catch(() => '')); return false; }
    return true;
  } catch (e) {
    console.error('twilio_error', e && e.message);
    return false;
  }
}

/* Se llama desde el webhook y tambien desde api/license/order.js cuando este
   emite la licencia por su cuenta (webhook perdido). `record.sent` evita
   repetir: un correo duplicado no rompe nada, pero un SMS duplicado se cobra
   dos veces. */
async function entregar(record, opciones) {
  const forzar = !!(opciones && opciones.forzar);
  if (!record || !record.key) return record && record.sent;
  /* Ya entregado no se repite: un correo duplicado no rompe nada, pero un SMS
     duplicado se cobra dos veces. `forzar` es para /api/license/recover, donde
     el comprador esta pidiendo su clave otra vez a proposito. */
  if (!forzar && record.sent && record.sent.at) return record.sent;
  const [email, sms] = await Promise.all([porCorreo(record), porSms(record)]);
  /* Dejar constancia toca el almacen, y el almacen tambien puede fallar. Que
     no se apunte no puede tumbar el webhook: la clave ya esta emitida y ya se
     ha enviado. Como mucho la pantalla de gracias dira que no envio nada. */
  try { await markDelivered(record.key, { email, sms }); } catch (e) {
    console.error('marcar_entrega_fallo', e && e.message);
  }
  return { email, sms };
}

module.exports = { entregar };

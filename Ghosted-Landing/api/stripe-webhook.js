const crypto = require('crypto');
const { json, rawBody } = require('../lib/http');
const { ConfigError } = require('../lib/kv');
const { issueLicense, revokePayment, resolve } = require('../lib/licenses');
const { downloadFor } = require('../lib/downloads');

function signatureValid(raw, header, secret) {
  // Stripe may send several v1 signatures (e.g. during secret rolls); accept
  // if ANY matches, and reject stale timestamps to block replay attacks.
  const parts = String(header || '').split(',').map((p) => p.split('='));
  const t = (parts.find((p) => p[0] === 't') || [])[1];
  const sigs = parts.filter((p) => p[0] === 'v1').map((p) => p[1]);
  if (!t || !sigs.length || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5 min tolerance
  const expected = crypto.createHmac('sha256', secret).update(t + '.' + raw.toString('utf8')).digest('hex');
  const a = Buffer.from(expected, 'hex');
  return sigs.some((s) => {
    let b; try { b = Buffer.from(String(s), 'hex'); } catch (e) { return false; }
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

// Best-effort only: the license key already shows on success.html regardless.
// This is just a safety net for the "closed the tab too fast" case, so a
// missing/invalid RESEND_API_KEY or a Resend outage must never fail the webhook.
async function sendLicenseEmail(record) {
  if (!process.env.RESEND_API_KEY || !record || !record.customerEmail) return;
  const dl = downloadFor(record.plan || 'pro');
  const site = process.env.SITE_URL || 'https://ghoosted.net';
  // Keyed (not session-based) so the link in this email keeps working for
  // re-downloads later, and dies the moment the key is revoked.
  const dlUrl = site + '/api/download?key=' + encodeURIComponent(record.key);
  // MAIL_FROM must be an address on a domain verified in Resend — the
  // onboarding@resend.dev sandbox sender only delivers to the account owner.
  const from = process.env.MAIL_FROM || 'Ghoosted <onboarding@resend.dev>';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from,
        to: record.customerEmail,
        subject: 'Tu clave de ' + dl.name,
        html: '<p>Gracias por tu compra de <b>' + dl.name + '</b>.</p>'
          + '<p>Tu clave de licencia (guárdala, la necesitarás para activar la extensión):</p>'
          + '<p style="font:700 18px monospace;letter-spacing:1px">' + record.key + '</p>'
          + '<p><a href="' + dlUrl + '">Descargar ' + dl.name + ' (.zip)</a></p>'
          + '<p>Descomprime el .zip, abre chrome://extensions, activa el Modo de desarrollador y pulsa "Cargar descomprimida".</p>'
          + '<p style="color:#888;font-size:12px">Al comprar solicitaste la entrega inmediata del contenido digital y '
          + 'aceptaste perder el derecho de desistimiento de 14 días una vez entregada la clave '
          + '(art. 103.m TRLGDCU / art. 16.m Directiva 2011/83/UE). Tus garantías legales de conformidad no se ven afectadas.</p>',
      }),
    });
    if (!r.ok) console.error('resend_failed', r.status, await r.text().catch(() => ''));
  } catch (e) { /* swallow: email delivery is not the source of truth */ }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  const raw = await rawBody(req);
  if (!signatureValid(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
    return json(res, 400, { error: 'invalid_signature' });
  }
  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch (e) { return json(res, 400, { error: 'invalid_payload' }); }
  try {
    if (event.type === 'checkout.session.completed' && event.data && event.data.object && event.data.object.payment_status === 'paid') {
      const key = await issueLicense(event.data.object);
      const { record } = await resolve(key);
      await sendLicenseEmail(record);
    }
    // Only a FULL refund revokes the key — charge.refunded also fires for
    // partial refunds (object.refunded is true only when fully refunded).
    if (event.type === 'charge.refunded' && event.data && event.data.object && event.data.object.refunded === true) {
      await revokePayment(event.data.object.payment_intent);
    }
    return json(res, 200, { received: true });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500, { error: error instanceof ConfigError ? 'license_service_not_configured' : 'webhook_error' });
  }
};

module.exports.config = { api: { bodyParser: false } };

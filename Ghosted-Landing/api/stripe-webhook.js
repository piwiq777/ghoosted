const crypto = require('crypto');
const { json, rawBody } = require('../lib/http');
const { ConfigError } = require('../lib/kv');
const { issueLicense, revokePayment, resolve } = require('../lib/licenses');
const { entregar } = require('../lib/entrega');

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
      await entregar(record);
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

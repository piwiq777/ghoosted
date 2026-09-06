const { json, options } = require('../../lib/http');
const { ConfigError, command, getJson } = require('../../lib/kv');
const { downloadFor } = require('../../lib/downloads');
const { issueLicense } = require('../../lib/licenses');

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const sessionId = String(req.query.session_id || '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json(res, 400, { error: 'invalid_session' });
  try {
    const key = await command(['GET', 'ghosted:stripe:session:' + sessionId]);
    let record = key && await getJson('ghosted:license:' + key);
    // Self-heal a missed/delayed webhook: ask Stripe directly whether this
    // session is paid, and if so issue the license here. Safe to race with
    // the webhook — issueLicense is idempotent (SET NX on the session key).
    if (!record && process.env.STRIPE_SECRET_KEY) {
      const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + sessionId, {
        headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
      });
      const session = await r.json().catch(() => null);
      if (r.ok && session && session.payment_status === 'paid') {
        const k = await issueLicense(session);
        record = await getJson('ghosted:license:' + k);
      }
    }
    if (!record || record.status !== 'active') return json(res, 404, { error: 'key_pending' });
    const plan = record.plan || 'pro';
    const dl = downloadFor(plan);
    // Gated URL, not the raw file: api/download re-checks the licence before
    // handing anything over. downloadFile is sent separately so the success
    // page can still name the saved file properly.
    return json(res, 200, {
      key: record.key,
      plan,
      downloadUrl: 'api/download?session_id=' + encodeURIComponent(sessionId),
      downloadName: dl.name,
      downloadFile: dl.file,
    });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500, { error: error instanceof ConfigError ? 'license_service_not_configured' : 'license_service_error' });
  }
};

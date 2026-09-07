const { json, options } = require('../../lib/http');
const { frenar } = require('../../lib/freno');
const { ConfigError, command, getJson } = require('../../lib/kv');
const { downloadFor } = require('../../lib/downloads');
const { issueLicense } = require('../../lib/licenses');
const { entregar } = require('../../lib/entrega');

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  /* Este endpoint es el unico sin clave que, cuando no encuentra la licencia,
     LLAMA A STRIPE. Sin freno, cualquiera puede dispararle sesiones inventadas
     y gastarnos la cuota de la API de Stripe desde fuera. La pantalla de
     gracias sondea cada 2-5 s durante unos minutos, asi que 120 por cuarto de
     hora le sobra a un comprador de verdad. */
  const freno = await frenar(req, 'pedido', 120, 900);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });

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
        /* Si se emite aqui es que el webhook no llego, asi que tampoco salio
           el correo ni el SMS. entregar() se protege sola contra repetir. */
        if (record) await entregar(record);
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
      /* Por donde salio de verdad. La pantalla de gracias lo dice tal cual:
         prometer un correo que no se envio es como se pierde una clave. */
      sent: { email: !!(record.sent && record.sent.email), sms: !!(record.sent && record.sent.sms) },
    });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500, { error: error instanceof ConfigError ? 'license_service_not_configured' : 'license_service_error' });
  }
};

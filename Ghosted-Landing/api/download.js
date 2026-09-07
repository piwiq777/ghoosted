const fs = require('fs');
const { json, options } = require('../lib/http');
const { ConfigError, command, getJson } = require('../lib/kv');
const { downloadFor, filePath } = require('../lib/downloads');
const { normalizeKey } = require('../lib/licenses');
const { marcar } = require('../lib/marcar');

// The only way to get the extension zip. Proof of purchase is either:
//   ?session_id=cs_...   — straight off the Stripe success page
//   ?key=GHST-...        — from the licence email, so re-downloads keep working
// Whichever is used, the plan recorded on the licence decides WHICH zip you
// get: a 3.50€ Plus buyer cannot pull the 5€ Pro build by editing the URL.
const KEY_PATTERN = /^GHST-(?:[A-Z0-9]{4}-){4}[A-Z0-9]{4}$/;
const SESSION_PATTERN = /^cs_[A-Za-z0-9_]+$/;

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const key = normalizeKey((req.query && req.query.key) || '');
  const sessionId = String((req.query && req.query.session_id) || '');

  try {
    let record = null;
    if (KEY_PATTERN.test(key)) {
      record = await getJson('ghosted:license:' + key);
    } else if (SESSION_PATTERN.test(sessionId)) {
      const issued = await command(['GET', 'ghosted:stripe:session:' + sessionId]);
      record = issued && (await getJson('ghosted:license:' + issued));
    } else {
      return json(res, 400, { error: 'missing_proof' });
    }

    // Same 404 for "never existed" and "wrong key" so this can't be used to
    // probe which keys are real.
    if (!record) return json(res, 404, { error: 'not_found' });
    // A refunded/charged-back key stops being a download link too, not just a
    // licence — otherwise a refund still leaves the buyer with the product.
    if (record.status !== 'active') return json(res, 403, { error: 'revoked' });

    /* Tope de descargas por clave. La clave se ata a UNA cuenta de Instagram,
       asi que repartirla no da acceso a nadie — pero el enlace de descarga si
       sirve para cualquiera que lo tenga, y sin tope una sola clave puede
       acabar de espejo publico del ZIP de pago. Quince al dia es de sobra
       para reinstalar en varios ordenadores y corto para repartir.
       Falla ABIERTO, como el resto de frenos. */
    try {
      const cubo = 'ghosted:freno:descargas:' + record.key;
      const n = Number(await command(['INCR', cubo])) || 1;
      if (n === 1) await command(['EXPIRE', cubo, '86400']);
      if (n > 15) return json(res, 429, { error: 'demasiadas_descargas' });
    } catch (e) { /* si el almacen no responde, se deja descargar */ }

    const plan = record.plan || 'pro';
    const dl = downloadFor(plan);
    const file = filePath(plan);
    if (!file) {
      console.error('download_file_missing', plan, dl.file);
      return json(res, 500, { error: 'file_unavailable' });
    }

    let buf;
    try {
      buf = await fs.promises.readFile(file);
    } catch (e) {
      console.error('download_read_failed', file, e && e.message);
      return json(res, 500, { error: 'file_unavailable' });
    }

    /* Cada descarga sale marcada con la clave de quien la pide: si el ZIP
       aparece por ahi, se sabe de que compra salio y esa clave se revoca. No
       impide copiarlo — impide copiarlo en anonimo. Si el marcado fallara,
       devuelve el original: antes entregar sin marca que no entregar. */
    const zip = marcar(buf, {
      key: record.key,
      plan,
      producto: dl.name,
      comprada: record.createdAt || null,
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="' + dl.file + '"');
    res.setHeader('Content-Length', String(zip.length));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(200).end(zip);
  } catch (error) {
    return json(
      res,
      error instanceof ConfigError ? 503 : 500,
      { error: error instanceof ConfigError ? 'license_service_not_configured' : 'download_error' }
    );
  }
};

const { json, options, readJson } = require('../../lib/http');
const { frenar } = require('../../lib/freno');
const { ConfigError } = require('../../lib/kv');
const { verify } = require('../../lib/licenses');

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { valid: false, error: 'method_not_allowed' });
  // Freno por IP: 60 intentos cada 10 minutos.
  const freno = await frenar(req, 'verificar', 60, 600);
  if (!freno.permitido) return json(res, 429, { valid: false, error: 'demasiados_intentos' });
  try {
    const body = await readJson(req);
    const result = await verify(body.key, body.accountId, body.product);
    return json(res, result.valid ? 200 : 403, result);
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500, { valid: false, error: error instanceof ConfigError ? 'license_service_not_configured' : 'license_service_error' });
  }
};

const { json, options, readJson } = require('../../lib/http');
const { ConfigError } = require('../../lib/kv');
const { activate } = require('../../lib/licenses');

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { valid: false, error: 'method_not_allowed' });
  try {
    const body = await readJson(req);
    const result = await activate(body.key, body.accountId, body.product);
    return json(res, result.valid ? 200 : 403, result);
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500, { valid: false, error: error instanceof ConfigError ? 'license_service_not_configured' : 'license_service_error' });
  }
};

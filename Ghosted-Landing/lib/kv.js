class ConfigError extends Error {
  constructor(message) { super(message); this.name = 'ConfigError'; }
}

// Accept both naming schemes: the manual UPSTASH_REDIS_REST_* names and the
// KV_REST_API_* names that Vercel's Upstash/Redis integration injects.
function restUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}
function restToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function isConfigured() {
  return Boolean(restUrl() && restToken());
}

async function command(args) {
  if (!isConfigured()) throw new ConfigError('license_store_not_configured');
  const response = await fetch(restUrl(), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + restToken(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error(payload.error || 'license_store_error');
  return payload.result;
}

async function getJson(key) {
  const value = await command(['GET', key]);
  if (!value) return null;
  try { return JSON.parse(value); } catch (e) { return null; }
}

async function setJson(key, value) {
  return command(['SET', key, JSON.stringify(value)]);
}

module.exports = { ConfigError, isConfigured, command, getJson, setJson };

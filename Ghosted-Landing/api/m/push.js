const { json, options, readJson } = require('../../lib/http');
const { ConfigError, command } = require('../../lib/kv');

// Mobile companion — the PC extension pushes an END-TO-END ENCRYPTED snapshot
// here. The server only ever stores an opaque channel id and a ciphertext blob;
// the AES key never leaves the two devices (it rides in the QR's URL fragment
// and lives in the extension locally), so this relay cannot read the data.
const CHANNEL_RE = /^[A-Za-z0-9_-]{16,64}$/;
const MAX_BLOB = 400000; // ~300KB of plaintext once base64-decoded
const TTL_SECONDS = 7 * 24 * 60 * 60; // a stale phone view expires after a week

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' });
  try {
    const body = await readJson(req);
    const channel = String(body.channel || '');
    const blob = String(body.blob || '');
    if (!CHANNEL_RE.test(channel)) return json(res, 400, { ok: false, error: 'bad_channel' });
    if (!blob || blob.length > MAX_BLOB) return json(res, 400, { ok: false, error: 'bad_blob' });
    await command(['SET', 'm:' + channel, blob, 'EX', String(TTL_SECONDS)]);
    return json(res, 200, { ok: true });
  } catch (error) {
    const cfg = error instanceof ConfigError;
    return json(res, cfg ? 503 : 500, { ok: false, error: cfg ? 'store_not_configured' : 'store_error' });
  }
};

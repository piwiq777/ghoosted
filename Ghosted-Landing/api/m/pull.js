const { json, options } = require('../../lib/http');
const { ConfigError, command } = require('../../lib/kv');

// Mobile companion — the phone pulls the latest ENCRYPTED snapshot for its
// channel and decrypts it locally with the key from the QR fragment. The server
// returns ciphertext only; it never sees the key or the plaintext.
const CHANNEL_RE = /^[A-Za-z0-9_-]{16,64}$/;

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'method_not_allowed' });
  try {
    const channel = String((req.query && req.query.channel) || '');
    if (!CHANNEL_RE.test(channel)) return json(res, 400, { ok: false, error: 'bad_channel' });
    const blob = await command(['GET', 'm:' + channel]);
    return json(res, 200, { ok: true, blob: blob || null });
  } catch (error) {
    const cfg = error instanceof ConfigError;
    return json(res, cfg ? 503 : 500, { ok: false, error: cfg ? 'store_not_configured' : 'store_error' });
  }
};

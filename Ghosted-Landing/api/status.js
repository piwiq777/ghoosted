const fs = require('fs');
const path = require('path');
const { json, options } = require('../lib/http');

/* Canal de avisos hacia las extensiones ya instaladas.
 *
 * Se cargan en modo desarrollador, así que Chrome nunca las actualiza solo:
 * `update_url` no hace nada con una extensión descomprimida. Lo único que se
 * puede hacer es que ella pregunte y avise al usuario. Este endpoint es esa
 * pregunta.
 *
 * `minimum` es el corte: por debajo de esa versión la extensión avisa de que
 * está rota de verdad, no de que hay una nueva. Sirve como interruptor cuando
 * Instagram cambia algo y las versiones viejas dejan de funcionar. */
const RUTAS = ['lib/status.json', '../lib/status.json', '/var/task/lib/status.json'];

function leerEstado() {
  for (const r of RUTAS) {
    const p = path.isAbsolute(r) ? r : path.join(process.cwd(), r);
    try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* siguiente */ }
  }
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lib', 'status.json'), 'utf8')); } catch (e) { return null; }
}

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const estado = leerEstado();
  if (!estado) return json(res, 503, { error: 'status_unavailable' });
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  return json(res, 200, {
    latest: String(estado.latest || ''),
    minimum: String(estado.minimum || ''),
    notice: estado.notice && estado.notice.id ? {
      id: String(estado.notice.id),
      level: estado.notice.level === 'warn' ? 'warn' : 'info',
      text: estado.notice.text && typeof estado.notice.text === 'object' ? estado.notice.text : {},
    } : null,
  });
};

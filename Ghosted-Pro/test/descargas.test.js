'use strict';
/* El zip que se vende no se genera en el servidor: Vercel CLONA el repositorio
 * y api/download.js lee el fichero del disco. Si el zip no esta versionado, o
 * si lib/downloads.js nombra una version que ya no existe, el cliente paga y
 * recibe un 500. Ha pasado ya una vez (Plus servia la version de julio), asi
 * que esto se comprueba en cada pasada. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const RAIZ = path.resolve(__dirname, '..', '..');
const PRIVADO = path.join(RAIZ, 'Ghosted-Landing', 'api', '_private');

module.exports = () => {
  const s = suite('descargas');

  const downloads = fs.readFileSync(path.join(RAIZ, 'Ghosted-Landing', 'lib', 'downloads.js'), 'utf8');
  const nombres = {};
  for (const m of downloads.matchAll(/(\w+):\s*\{\s*file:\s*'([^']+)'/g)) nombres[m[1]] = m[2];

  s.eq('lib/downloads.js nombra los dos planes', Object.keys(nombres).sort(), ['plus', 'pro']);

  /* Lo que git tiene es exactamente lo que llega al servidor. */
  let versionados = [];
  try {
    versionados = execFileSync('git', ['ls-files', 'Ghosted-Landing/api/_private'], { cwd: RAIZ, encoding: 'utf8' })
      .split('\n').filter(Boolean).map((f) => path.basename(f));
  } catch (e) { /* fuera de un repositorio: se comprueba solo el disco */ }
  const enRepo = versionados.length > 0;

  for (const [plan, fichero] of Object.entries(nombres)) {
    s.ok(`${plan}: el zip existe en api/_private`, fs.existsSync(path.join(PRIVADO, fichero)));
    if (enRepo) s.ok(`${plan}: el zip esta versionado, o no viaja a Vercel`, versionados.includes(fichero));
  }

  /* La version del manifiesto y la del nombre del zip tienen que coincidir, o
   * se sirve un build viejo con el nombre nuevo. */
  const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8')).version;
  s.eq('el zip de Pro es la version del manifiesto', nombres.pro, `Ghoosted-Pro-v${version}.zip`);
  s.eq('el zip de Plus es la version del manifiesto', nombres.plus, `Ghoosted-Plus-v${version}.zip`);

  /* Versiones viejas olvidadas: pesan en el repositorio y confunden. */
  const sobran = fs.readdirSync(PRIVADO)
    .filter((f) => f.endsWith('.zip') && !Object.values(nombres).includes(f));
  s.eq('no quedan zip de versiones anteriores', sobran, []);

  /* status.json le dice a la extension instalada que hay version nueva. */
  const estado = JSON.parse(fs.readFileSync(path.join(RAIZ, 'Ghosted-Landing', 'lib', 'status.json'), 'utf8'));
  s.eq('status.json anuncia la version que se sirve', estado.latest, version);

  return s;
};

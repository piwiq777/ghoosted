'use strict';
/* Las versiones de cache de la web.
 *
 * El navegador se queda con styles.css y con los ficheros de idioma hasta que
 * cambia el ?v=. Traducir algo nuevo y no subir el numero significa que quien
 * ya habia entrado sigue viendo el texto viejo, en ingles y con la maqueta
 * antigua — y desde fuera parece que la web esta rota. Paso una vez.
 *
 * Esta comprobacion falla si el contenido cambio y el sello no. Se arregla
 * con: node Ghosted-Landing/tools/sellar-cache.js */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

const GRUPOS = {
  'styles.css': ['styles.css'],
  'legal.css': ['legal.css'],
  'i18n.js': ['i18n.js'],
  'app.js': ['app.js'],
  'legal-i18n.js': ['legal-i18n.js'],
  locales: fs.readdirSync(path.join(WEB, 'locales')).sort().map((f) => 'locales/' + f),
};

module.exports = () => {
  const s = suite('cache de la web');
  const sello = JSON.parse(leer('lib/cache.json'));

  for (const [nombre, ficheros] of Object.entries(GRUPOS)) {
    const h = crypto.createHash('sha256');
    for (const f of ficheros) h.update(fs.readFileSync(path.join(WEB, f)));
    const actual = h.digest('hex').slice(0, 16);
    const guardado = sello[nombre];
    if (!guardado) { s.ok(nombre + ': sellado', false); continue; }
    s.eq(nombre + ': el sello coincide con el contenido', actual, guardado.hash);
  }

  /* Y que el numero sellado sea el que de verdad se sirve en las paginas. */
  const index = leer('index.html');
  s.ok('index.html pide styles.css con la version sellada',
    index.indexOf('styles.css?v=' + sello['styles.css'].v) !== -1);
  s.ok('index.html pide app.js con la version sellada',
    index.indexOf('app.js?v=' + sello['app.js'].v) !== -1);
  s.ok('i18n.js pide los idiomas con la version sellada',
    leer('i18n.js').indexOf(".json?v=" + sello.locales.v) !== -1);
  for (const p of ['success.html', 'recuperar.html']) {
    s.ok(p + ' pide los idiomas con la version sellada',
      leer(p).indexOf('.json?v=' + sello.locales.v) !== -1);
  }

  return s;
};

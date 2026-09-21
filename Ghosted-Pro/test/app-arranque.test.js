'use strict';
/* LO QUE SE VE ANTES DE QUE HAYA APP.
 * Tres agujeros que se notaban justo en los peores momentos:
 *  - Al abrir, unos segundos de pantalla vacia mientras el navegador lee los
 *    guiones. Parece que la app no ha abierto.
 *  - Si uno de esos guiones revienta, no hay app NI aviso: te quedas
 *    mirando la nada sin saber por que.
 *  - Y el aviso flotante iba en vidrio: sobre una foto o sobre el degradado
 *    no se leia, justo cuando es lo unico que te explica lo que ha pasado. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.join(__dirname, '..', '..', 'Ghosted-App', 'web');

module.exports = () => {
  const s = suite('arranque, errores y avisos · app');
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(WEB, 'app.css'), 'utf8');
  const app = fs.readFileSync(path.join(WEB, 'app.js'), 'utf8');

  /* 1 · El arranque tiene que pintarse SIN codigo. */
  s.ok('hay pantalla de arranque', /<div id="arranque">/.test(html));
  s.ok('  y va en el HTML, antes de los guiones',
    html.indexOf('id="arranque"') < html.indexOf('<script src="demo.js">'));
  s.ok('  con su propio CSS, sin depender de nada', /#arranque\{/.test(css) && /\.ar-icono\{/.test(css));
  s.ok('se quita cuando ya hay algo pintado', /function quitarArranque/.test(app)
    && /classList\.add\('fuera'\)/.test(app));
  s.ok('  y despues del primer pintar, no antes',
    app.lastIndexOf('pintar();') < app.indexOf('quitarArranque'));

  /* 2 · El ultimo recurso. Tiene que ir ANTES que los guiones que pueden
     reventar, o no se entera de que han reventado. */
  s.ok('se capturan los errores de arranque', /addEventListener\('error'/.test(html));
  s.ok('  y las promesas que nadie recoge', /addEventListener\('unhandledrejection'/.test(html));
  s.ok('  el vigilante va antes que demo.js',
    html.indexOf("addEventListener('error'") < html.indexOf('<script src="demo.js">'));
  s.ok('  una imagen rota no es la app rota', /tagName === 'IMG'\) return/.test(html));
  s.ok('  y si no arranca en 20 s, tambien se avisa', /la app no ha llegado a arrancar/.test(html));
  s.ok('la pantalla de error deja reintentar', /location\.reload\(\)/.test(html)
    && /\.ar-e-b\{/.test(css));
  s.ok('  y dice el motivo de verdad, no "error"', /class="ar-e-m"/.test(html) && /\.ar-e-m\{/.test(css));
  s.ok('  con el motivo escapado, que viene de fuera', /replace\(\/\[<>&\]\/g, ' '\)/.test(html));

  /* 3 · El aviso flotante se lee SIEMPRE. El vidrio deja pasar lo de
     debajo; aqui hace falta contraste, no bonito. */
  const toast = css.slice(css.indexOf('.toast{'), css.indexOf('.toast.ver'));
  s.ok('el aviso es opaco', /background:var\(--ink\)!important/.test(toast));
  s.ok('  y al reves que la pantalla, para que contraste',
    /color:var\(--bg\)!important/.test(toast));
  s.ok('  sin desenfoque, que es lo que se lo comia',
    /backdrop-filter:none!important/.test(toast));
  s.ok('  y cabe en varias lineas si el mensaje es largo', /text-wrap:balance/.test(toast));

  return s;
};

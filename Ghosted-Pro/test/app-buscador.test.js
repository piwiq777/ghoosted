'use strict';
/* EL BUSCADOR DE ACTIVIDAD.
 * En la extension buscabas y salian sugerencias. En la app habia que acertar
 * el @ exacto de memoria — y encima el campo se VACIABA solo: la pantalla se
 * repinta cada vez que llega algo (la sesion, el reloj, un cambio), el input
 * no llevaba `value`, y lo escrito desaparecia antes de pulsar Vigilar. De
 * ahi "pongo un nombre y no va". */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const APP = path.join(__dirname, '..', '..', 'Ghosted-App', 'web');

module.exports = () => {
  const s = suite('buscador de Actividad · app');
  const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');
  const motor = fs.readFileSync(path.join(APP, 'motor.js'), 'utf8');
  const css = fs.readFileSync(path.join(APP, 'app.css'), 'utf8');
  const puente = fs.readFileSync(path.join(APP, '..', 'ig', 'puente-ig.js'), 'utf8');

  /* Lo escrito no se puede perder al repintar. */
  s.ok('el campo conserva lo escrito', /id="vigilar"[^>]*value="' \+ esc\(U\.vig/.test(app));
  s.ok('  y lo guarda al teclear', /U\.vig = ev\.target\.value/.test(app));
  s.ok('  y Vigilar lee eso', /var n = U\.vig \|\| valor\('vigilar'\)/.test(app));

  /* Sugerencias mientras escribes. */
  s.ok('hay buscador de gente en el motor', /async function buscarGente/.test(motor));
  s.ok('  y el puente lo permite', /searchUsers: 1/.test(puente));
  s.ok('  se pintan las sugerencias', /function sugerencias/.test(app) && /\.sug-fila\{/.test(css));
  s.ok('  y al tocar una se vigila a esa persona', /'elegir-sug': function/.test(app));

  /* Pero sin freir a Instagram: cada busqueda es una peticion. */
  s.ok('no se busca por cada tecla: se espera a que pares',
    /sugT = setTimeout\(/.test(app) && /\}, 600\);/.test(app));
  s.ok('  y se limpia la espera anterior', /clearTimeout\(sugT\)/.test(app));
  s.ok('no se busca con menos de 3 letras',
    /if \(q\.length < 3\)/.test(app) && /if \(q\.length < 3\) return \[\];/.test(motor));
  s.ok('lo ya buscado no se vuelve a pedir', /cacheBusca\[q\]/.test(motor));
  s.ok('  pero no se guarda para siempre', /delete cacheBusca\[q\]/.test(motor));

  /* Una respuesta que llega tarde no puede pisar lo que se esta buscando. */
  s.ok('una respuesta atrasada no pisa la busqueda nueva',
    /if \(!U\.sug \|\| U\.sug\.q !== q\) return;/.test(app));

  /* Y si el nombre no existe, se dice. */
  s.ok('si no existe esa cuenta, se avisa', /k === 'no_existe'/.test(app));

  return s;
};

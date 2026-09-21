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

  /* DESDE LA PRIMERA LETRA, y gastando MENOS que antes: tus seguidores y a
     quien sigues ya estan en el telefono, asi que se buscan ahi primero y
     sin una sola peticion. A Instagram solo se le pregunta por gente que no
     es tuya, y cuando has parado de escribir. */
  s.ok('se busca en tu propia gente', /function buscarLocal/.test(motor));
  s.ok('  mirando seguidores, seguidos y vigilados',
    /\(S\.followers \|\| \{\}\)\.users, \(S\.following \|\| \{\}\)\.users, S\.watch/.test(motor));
  s.ok('  primero los que EMPIEZAN por lo escrito', /empiezan\.concat\(dentro\)/.test(motor));
  s.ok('con una sola letra ya salen sugerencias, sin pedir nada',
    /var locales = M\.buscarLocal\(q\);/.test(app) && /var fuera = q\.length >= 3;/.test(app));
  s.ok('  con una o dos letras NO se pregunta a Instagram', /if \(!fuera\) \{/.test(app));

  /* Y a partir de TRES letras se busca fuera SIEMPRE. Antes solo se
     preguntaba si tu gente no llenaba la lista: quien tenia muchos
     seguidores que encajaban no veia nunca a nadie de fuera, y si escribes
     tres letras es que buscas a alguien concreto. */
  s.ok('con tres letras se busca en Instagram aunque tu gente llene la lista',
    !/locales\.length >= 8\) return;/.test(app));
  s.ok('  dejando sitio para las dos cosas', /locales\.slice\(0, 5\)/.test(app)
    && /\.slice\(0, 5\);/.test(app));
  s.ok('  y separadas, para que se sepa quien es quien',
    /sug-cab">En Instagram/.test(app) && /\.sug-cab\{/.test(css));

  /* Y lo de fuera, con freno: cada busqueda es una peticion. */
  s.ok('no se busca por cada tecla: se espera a que pares',
    /sugT = setTimeout\(/.test(app) && /\}, 500\);/.test(app));
  s.ok('  y se limpia la espera anterior', /clearTimeout\(sugT\)/.test(app));

  s.ok('lo ya buscado no se vuelve a pedir', /cacheBusca\[q\]/.test(motor));
  s.ok('  pero no se guarda para siempre', /delete cacheBusca\[q\]/.test(motor));
  s.ok('lo de fuera se añade a lo tuyo, no lo sustituye', /mios\.concat\(otros\)/.test(app));
  s.ok('  y mientras llega no tapa lo que ya se ve',
    /if \(!g\.lista\.length\) return/.test(app));

  /* Una respuesta que llega tarde no puede pisar lo que se esta buscando. */
  s.ok('una respuesta atrasada no pisa la busqueda nueva',
    /if \(!U\.sug \|\| U\.sug\.q !== q\) return;/.test(app));

  /* Y si el nombre no existe, se dice. */
  s.ok('si no existe esa cuenta, se avisa', /k === 'no_existe'/.test(app));

  return s;
};

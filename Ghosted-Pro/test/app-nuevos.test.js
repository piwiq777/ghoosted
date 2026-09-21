'use strict';
/* EL PRIMER SEGUIDOR.
 * Una cuenta recien hecha empieza con cero seguidores. El primero que llega
 * es, con diferencia, el momento en que la app tiene que funcionar — y era
 * justo el que no salia: la lista de antes estaba vacia, `[].length` es 0, y
 * el `if` que decidia si comparar la daba por "todavia no hay nada con que
 * comparar". Resultado: la portada decia 1 seguidor y "Nuevos" decia 0.
 *
 * Se comprueba sobre el codigo de verdad de motor.js, no sobre una copia. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const MOTOR = path.join(__dirname, '..', '..', 'Ghosted-App', 'web', 'motor.js');

module.exports = () => {
  const s = suite('el primer seguidor · app');
  const src = fs.readFileSync(MOTOR, 'utf8');

  /* Se extrae tal cual el trozo que compara la lista de antes con la de
     ahora, y se le pasan los casos. Si alguien vuelve a poner ahi un
     `ant.length`, esto se pone rojo. */
  const bloque = src.slice(src.indexOf('var se = [], llegan = [];'), src.indexOf('S.followers = { ts: ahora'));
  const comparar = new Function('ant', 'nuevos', bloque + '\nreturn { se: se, llegan: llegan };');

  const A = { pk: '1', username: 'ana' };
  const B = { pk: '2', username: 'beto' };

  const nunca = comparar(null, [A, B]);
  s.eq('sin haber revisado nunca no se anuncia nada', nunca.llegan.length, 0);
  s.eq('  (ni se inventa que se ha ido alguien)', nunca.se.length, 0);

  const primero = comparar([], [A]);
  s.eq('de 0 a 1 seguidor: UN nuevo', primero.llegan.length, 1);
  s.eq('  y se sabe quien es', (primero.llegan[0] || {}).username, 'ana');

  s.eq('de 0 a 0 no pasa nada', comparar([], []).llegan.length, 0);
  s.eq('de 1 a 2: un nuevo', comparar([A], [A, B]).llegan.length, 1);
  s.eq('de 2 a 1: uno que se fue', comparar([A, B], [A]).se.length, 1);
  s.eq('  y el que sigue ahi no cuenta como nuevo', comparar([A, B], [A]).llegan.length, 0);

  /* Y la reparacion de quien ya se comio el fallo: su primer seguidor no
     dejo evento y la siguiente revision comparara 1 con 1 sin ver cambio. */
  const rep = src.slice(src.indexOf('function repararNuevos'), src.indexOf('var guardarT = 0;'));
  s.ok('existe la reparacion para quien ya lo sufrio', /function repararNuevos/.test(rep));
  s.ok('y se ejecuta al arrancar', /^\s*repararNuevos\(\);/m.test(src));
  s.ok('solo toca a quien no tiene ni un evento', /\(S\.events \|\| \[\]\)\.length\) return/.test(rep));
  s.ok('y solo si el historial empieza en cero',
    /S\.history\[0\]\.followers !== 0\) return/.test(rep));
  s.ok('no inventa la fecha: usa la de la lista guardada', /S\.followers\.ts \|\| Date\.now\(\)/.test(rep));

  return s;
};

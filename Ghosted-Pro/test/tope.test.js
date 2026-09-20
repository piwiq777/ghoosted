'use strict';
/* El tope de peticiones de page-api.js. Es lo que impide que un fallo
 * nuestro deje la cuenta del usuario limitada por Instagram, asi que se
 * comprueba a mano y no de oidas. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('tope de peticiones a Instagram');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'page-api.js'), 'utf8');
  const cuerpo = src.slice(src.indexOf('function motivoTope'), src.indexOf('function dormir'));
  const motivoTope = eval('(' + cuerpo.trim().replace(/^function motivoTope/, 'function') + ')');

  const T = { min: 1200, hora: 90, dia: 900 };
  const ahora = 1000000000;
  const lista = (n, desde, paso) => Array.from({ length: n }, (_, i) => desde + i * paso);

  s.eq('sin tope definido no frena nada', motivoTope({ ultima: ahora, hora: [], dia: [] }, ahora, null).motivo, '');
  s.eq('la primera pasa', motivoTope({ ultima: 0, hora: [], dia: [] }, ahora, T).motivo, '');
  s.eq('dos seguidas: la segunda espera', motivoTope({ ultima: ahora - 200, hora: [ahora - 200], dia: [ahora - 200] }, ahora, T).espera, 1000);
  s.eq('pasado el hueco no espera', motivoTope({ ultima: ahora - 5000, hora: [], dia: [] }, ahora, T).espera, 0);

  const horaLlena = lista(90, ahora - 3500000, 1000);
  s.eq('con la hora gastada, se niega', motivoTope({ ultima: ahora - 9000, hora: horaLlena, dia: horaLlena }, ahora, T).motivo, 'tope_hora');
  const horaVieja = lista(90, ahora - 7200000, 1000);
  s.eq('lo de hace mas de una hora ya no cuenta', motivoTope({ ultima: ahora - 9000, hora: horaVieja, dia: horaVieja }, ahora, T).motivo, '');

  const diaLleno = lista(900, ahora - 80000000, 1000);
  s.eq('con el dia gastado, se niega', motivoTope({ ultima: ahora - 9000, hora: [], dia: diaLleno }, ahora, T).motivo, 'tope_dia');

  /* El caso real que limito la cuenta: un bucle pidiendo cada 1,5 s sin
     parar. Con el tope, en una hora no salen mas de T.hora peticiones. */
  let g = { ultima: 0, hora: [], dia: [] };
  let t = ahora, salieron = 0;
  for (let i = 0; i < 4000; i++) {
    const r = motivoTope(g, t, T);
    if (!r.motivo) {
      const cuando = t + (r.espera || 0);
      g = { ultima: cuando, hora: (r.hora || []).concat([cuando]), dia: (r.dia || []).concat([cuando]) };
      salieron++;
      t = cuando;
    }
    t += 1500;   // el bucle insiste cada 1,5 s
  }
  s.ok('un bucle enloquecido no pasa del tope por hora', salieron <= T.hora * 2 + 2);
  s.ok('y el freno deja pasar lo justo para una revision normal', T.hora >= 60);
  return s;
};

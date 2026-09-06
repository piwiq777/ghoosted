'use strict';
/* "¿Se siguen?" — la pregunta tiene DOS puertas.
 *
 * "¿A sigue a B?" se responde leyendo a quién sigue A. Pero si A es privada y
 * no la sigues, esa lista está cerrada. La misma respuesta está en los
 * SEGUIDORES de B, que sí se leen cuando B es pública o la sigues.
 *
 * Antes se rendía en el primer intento y contestaba "no se puede comprobar"
 * aunque la respuesta estuviera a la vista por el otro lado. */
const { leer, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('¿se siguen? · las dos puertas');
  // El código asigna a la variable M del módulo. montar() pasa las
  // dependencias como parámetros, y asignar a un parámetro no sale fuera, así
  // que se reescribe M por una caja que sí podemos leer desde aquí.
  const codigo = tramo(leer('content.js'), 'async function t7(){', 'function t8(){')
    .replace(/\bM = /g, 'caja.M = ');

  /* alcanzable: a qué perfiles se les puede leer la lista (t6).
     sigue:      "A>B" -> true/false/null, leído desde la lista de A.
     seguidoPor: "B>A" -> true/false/null, leído desde los seguidores de B. */
  const correr = async ({ a, b, alcanzable, sigue = {}, seguidoPor = {}, ocupado = false }) => {
    const log = { directas: 0, inversas: 0, estados: [] };
    const caja = { M: null };
    const api = montar(codigo, {
      i: '@' + a.username, f: '@' + b.username,
      caja,
      d: false, l: ocupado,
      t6: (u) => alcanzable.includes(u.username),
      k: {
        fetchUserByUsername: async (u) => (u === a.username ? a : b),
        checkFollows: async (pk, user) => {
          log.directas++;
          const r = sigue[pk + '>' + user];
          if (r === 'rate') { const e = new Error('r'); e.kind = 'rate'; throw e; }
          if (r === 'error') throw new Error('boom');
          return { follows: r === true, complete: r !== null };
        },
        checkFollowedBy: async (pk, user) => {
          log.inversas++;
          const r = seguidoPor[pk + '>' + user];
          if (r === 'rate') { const e = new Error('r'); e.kind = 'rate'; throw e; }
          if (r === 'error') throw new Error('boom');
          return { follows: r === true, complete: r !== null };
        },
      },
      G: (t) => log.estados.push(t),
      Y: (k) => k, B: () => '', g: { get: () => 0 }, J: {},
      g5: () => {}, ghdLoadShow: () => {}, ghdLoadHide: () => {},
      ghdPairPerson: (pk, u) => ({ pk, username: u }),
    }, '{t7}');
    await api.t7();
    return { M: caja.M, log };
  };

  const ana = { pk: '1', username: 'ana' };
  const bea = { pk: '2', username: 'bea' };

  return (async () => {
    // 1. Caso normal: las dos listas se leen, no hace falta la puerta de atrás.
    let r = await correr({
      a: ana, b: bea, alcanzable: ['ana', 'bea'],
      sigue: { '1>bea': true, '2>ana': false },
    });
    s.eq('lee ambas direcciones por la vía directa', [r.M.aFollowsB, r.M.bFollowsA], [true, false]);
    s.eq('no necesita la vía inversa', r.log.inversas, 0);

    // 2. EL CASO DEL FALLO: bea es privada y no la sigues, pero ana sí se lee.
    //    "¿bea sigue a ana?" se contesta mirando los seguidores de ana.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana'],
      sigue: { '1>bea': true },
      seguidoPor: { '1>bea': true },
    });
    s.eq('ana sigue a bea', r.M.aFollowsB, true);
    s.eq('y resuelve si bea sigue a ana por sus seguidores', r.M.bFollowsA, true);
    s.eq('usó la vía inversa una vez', r.log.inversas, 1);

    // 3. La inversa también sirve para responder que NO.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana'],
      sigue: { '1>bea': false },
      seguidoPor: { '1>bea': false },
    });
    s.eq('responde que no, no se rinde', r.M.bFollowsA, false);

    // 3b. Y cuando la respuesta sale por la puerta de atrás, queda anotado de
    //     dónde salió: un "no sigue" seco sobre una cuenta privada que no
    //     sigues parece inventado si no se dice en qué se basa.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana'],
      sigue: { '1>bea': true },
      seguidoPor: { '1>bea': false },
    });
    s.eq('anota que se resolvió por la lista de seguidores', r.M.bVia.via, 'i');
    s.eq('y de quién era esa lista', r.M.bVia.quien, 'ana');
    s.eq('la vía directa no lleva nota', r.M.aVia.via, 'd');

    // 3c. No arranca encima de la revisión principal: las dos comparten la
    //     pantalla de carga y las dos piden datos a Instagram.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana', 'bea'],
      sigue: { '1>bea': true, '2>ana': true },
      ocupado: true,
    });
    s.ok('no arranca si ya hay una revisión en marcha', !!(r.M && r.M.err));
    s.eq('y no gasta ni una petición', r.log.directas + r.log.inversas, 0);

    // 4. Ninguna de las dos puertas: entonces sí, desconocido.
    r = await correr({ a: ana, b: bea, alcanzable: [] });
    s.eq('sin ninguna lista legible queda en desconocido', [r.M.aFollowsB, r.M.bFollowsA], [null, null]);

    // 5. Si la directa se queda a medias (lista incompleta), prueba la inversa
    //    en vez de dar un "no" que podría ser falso.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana', 'bea'],
      sigue: { '1>bea': null, '2>ana': true },
      seguidoPor: { '2>ana': true },
    });
    s.eq('una lista incompleta no se toma por un no', r.M.aFollowsB, true);

    // 6. El límite de peticiones corta del todo: no se disimula con un null.
    r = await correr({
      a: ana, b: bea, alcanzable: ['ana', 'bea'],
      sigue: { '1>bea': 'rate' },
    });
    s.ok('el límite de Instagram sale como error, no como desconocido', !!(r.M && r.M.err));

    // 7. Y al revés: la revisión principal cede mientras corre el "¿se siguen?".
    //    Si no, terminaba antes y le quitaba la pantalla de carga a la otra.
    const codigoYL = tramo(leer('content.js'), 'async function YL(', 'function YO(');
    let arrancó = false, avisó = null;
    const yl = montar(codigoYL, {
      v: () => true, Ys: () => {}, l: false, d: true,
      ghdToast: (t) => { avisó = t; },
      Y: (k) => k, G: () => {}, A: null,
      chrome: { runtime: { sendMessage: async () => { arrancó = true; return {}; } } },
    }, '{YL}');
    // Si la guarda desapareciera, YL seguiría adelante y reventaría por falta
    // de dependencias. Se atrapa: lo que importa es si LLEGÓ a arrancar.
    try { await yl.YL(true); } catch (e) { /* nos vale con haberlo visto arrancar */ }
    s.eq('la revisión no arranca si hay un "¿se siguen?" en marcha', arrancó, false);
    s.eq('y avisa al usuario en vez de no hacer nada', avisó, 'busy_other');

    return s;
  })();
};

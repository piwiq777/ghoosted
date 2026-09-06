'use strict';
/* Vigilar si A deja de seguir a B. Lo importante es no dar avisos en falso:
 * la comprobación barata puede equivocarse, así que antes de avisar se paga
 * la cara para confirmarlo. */
const { leer, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('parejas vigiladas');
  const codigo = tramo(leer('content.js'), 'function ghdPairs(){', 'async function t7(){');

  const montarCon = ({ pares, rapido, lento = {} }) => {
    const almacen = { pairWatch: JSON.parse(JSON.stringify(pares)), activity: [] };
    const log = { rapidas: 0, lentas: 0, eventos: [], avisos: [] };
    const api = montar(codigo, {
      g: { get: (k, d) => (almacen[k] !== undefined ? almacen[k] : d), set: (k, v) => { almacen[k] = v; } },
      J: { pairWatch: 'pairWatch', activity: 'activity' },
      k: {
        checkFollowsFast: async (a, b) => { log.rapidas++; const r = rapido[a + '>' + b];
          if (r === 'rate') { const e = new Error('r'); e.kind = 'rate'; throw e; } return { follows: r }; },
        checkFollows: async (a, b) => { log.lentas++; const r = lento[a + '>' + b];
          if (r === 'rate') { const e = new Error('r'); e.kind = 'rate'; throw e; }
          return { follows: r === true, complete: r !== null }; },
      },
      Yt: (e) => { log.eventos.push(e); return true; },
      I: (t) => log.avisos.push(t),
      F: { notify: true },
      Y: (k, a) => k + (a ? ':' + [].concat(a).join(',') : ''),
      ghdToast: () => {}, g5: () => {},
      setTimeout: (fn) => global.setTimeout(fn, 0),
    }, '{ghdPairScan,ghdPairs}');
    return { api, log, almacen };
  };
  const P = (a, b, follows) => ({ id: a + '>' + b, a: { pk: a, username: 'a' + a }, b: { pk: b, username: 'b' + b }, follows, ts: 1 });

  return (async () => {
    { const { api, log } = montarCon({ pares: [P('1', '2', true)], rapido: { '1>b2': true } });
      await api.ghdPairScan();
      s.eq('si sigue igual, ni evento ni aviso', [log.eventos.length, log.avisos.length], [0, 0]);
      s.eq('y sólo gasta la comprobación barata', [log.rapidas, log.lentas], [1, 0]); }

    { const { api, log, almacen } = montarCon({ pares: [P('1', '2', true)], rapido: { '1>b2': false }, lento: { '1>b2': false } });
      await api.ghdPairScan();
      s.eq('una baja real se confirma antes de avisar', log.lentas, 1);
      s.eq('genera el evento', log.eventos.map((e) => [e.type, e.follows]), [['pair', false]]);
      s.eq('y notifica', log.avisos, ['notif_pair_unfollow:@a1,@b2']);
      s.eq('guarda el nuevo estado', almacen.pairWatch[0].follows, false); }

    { const { api, log, almacen } = montarCon({ pares: [P('1', '2', true)], rapido: { '1>b2': false }, lento: { '1>b2': true } });
      await api.ghdPairScan();
      s.eq('si la barata se equivoca, NO avisa', [log.eventos.length, log.avisos.length], [0, 0]);
      s.eq('y mantiene el estado anterior', almacen.pairWatch[0].follows, true); }

    { const { api, log } = montarCon({ pares: [P('1', '2', false)], rapido: { '1>b2': true } });
      await api.ghdPairScan();
      s.eq('si vuelve a seguir, avisa', log.avisos, ['notif_pair_follow:@a1,@b2']);
      s.eq('sin gastar la cara', log.lentas, 0); }

    { const { api, log, almacen } = montarCon({ pares: [P('1', '2', null)], rapido: { '1>b2': true } });
      await api.ghdPairScan();
      s.eq('la primera lectura no avisa', log.avisos.length, 0);
      s.eq('sólo guarda el estado', almacen.pairWatch[0].follows, true); }

    { const { api, log, almacen } = montarCon({ pares: [P('1', '2', true), P('3', '4', true)], rapido: { '1>b2': 'rate' } });
      await api.ghdPairScan();
      s.eq('si Instagram limita, no avisa', log.avisos.length, 0);
      s.eq('no sigue con el resto', log.rapidas, 1);
      s.eq('y no altera lo guardado', almacen.pairWatch[0].follows, true); }
    return s;
  })();
};

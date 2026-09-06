'use strict';
/* Aprobar solicitudes en bloque. Lo delicado es que nunca rechace por su
 * cuenta y que no arrase: aprobar 60 de golpe es lo que Instagram marca. */
const { leer, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('solicitudes de seguimiento');
  const codigo = tramo(leer('content.js'), 'let ghdReqList=null', 'function ghdReqBlock(gq){');

  const montarCon = ({ pendientes, sigo = [], fallaEn = 0 }) => {
    const almacen = { reqRule: 'manual', following: { users: sigo.map((pk) => ({ pk })) }, activity: [] };
    const log = { aprobadas: [], rechazadas: [], esperas: [], pantalla: [] };
    const k = {
      pendingRequests: async () => ({ users: pendientes.slice() }),
      approveRequest: async (pk) => {
        if (fallaEn && log.aprobadas.length === fallaEn) { const e = new Error('r'); e.kind = 'rate'; throw e; }
        log.aprobadas.push(String(pk)); return { status: 'ok' };
      },
      ignoreRequest: async (pk) => { log.rechazadas.push(String(pk)); return { status: 'ok' }; },
      rateLeftMs: () => 0,
    };
    const api = montar(codigo, {
      g: { get: (kk, d) => (almacen[kk] !== undefined ? almacen[kk] : d), set: (kk, v) => { almacen[kk] = v; } },
      J: { reqRule: 'reqRule', following: 'following', activity: 'activity' },
      k,
      Yt: (e) => { almacen.activity.push(e); return true; },
      Y: (kk, a) => kk + (a ? ':' + a : ''),
      ghdToast: () => {}, g5: () => {},
      setTimeout: (fn, ms) => { log.esperas.push(ms); return global.setTimeout(fn, 0); },
      ghdLoadShow: (n, t, l) => log.pantalla.push([n, t, l]),
      ghdLoadHide: () => log.pantalla.push('oculta'),
    }, '{ghdReqRun,ghdReqOne,ghdReqRule,ghdReqLoad,lista:()=>ghdReqList}');
    return { api, log, almacen };
  };

  const P = (pk, u) => ({ pk, username: u, full_name: u });
  const LISTA = [P('1', 'ana'), P('2', 'bea'), P('3', 'cris'), P('4', 'dani')];

  return (async () => {
    { const { api, log } = montarCon({ pendientes: LISTA, sigo: ['2', '4'] });
      s.eq('"solo a quien sigo" acepta a los correctos', await api.ghdReqRun('following') && log.aprobadas, ['2', '4']);
      s.eq('y no rechaza a nadie por su cuenta', log.rechazadas, []); }

    { const { api, log, almacen } = montarCon({ pendientes: LISTA });
      await api.ghdReqRun('all');
      s.eq('"todas" acepta a los cuatro', log.aprobadas, ['1', '2', '3', '4']);
      s.eq('deja constancia en la actividad', almacen.activity.map((e) => e.type), ['req_ok', 'req_ok', 'req_ok', 'req_ok']);
      s.eq('espera entre una y otra', log.esperas.filter((m) => m === 2500).length, 4); }

    { const { api } = montarCon({ pendientes: LISTA });
      s.eq('de fábrica no aprueba nada', api.ghdReqRule(), 'manual'); }

    { const { api, log } = montarCon({ pendientes: LISTA, fallaEn: 2 });
      s.eq('ante un límite se para donde iba', await api.ghdReqRun('all') && log.aprobadas, ['1', '2']); }

    { const muchas = Array.from({ length: 40 }, (_, i) => P(String(i), 'u' + i));
      const { api, log } = montarCon({ pendientes: muchas });
      await api.ghdReqRun('all');
      s.eq('tope de 20 por pasada', log.aprobadas.length, 20); }

    { const { api, log } = montarCon({ pendientes: LISTA });
      await api.ghdReqLoad(true);
      await api.ghdReqOne(P('3', 'cris'), true);
      await api.ghdReqOne(P('1', 'ana'), false);
      s.eq('acepta la elegida', log.aprobadas, ['3']);
      s.eq('rechaza la elegida', log.rechazadas, ['1']);
      s.eq('y las saca de la lista', api.lista().map((u) => u.pk), ['2', '4']); }

    { const { api, log } = montarCon({ pendientes: LISTA, sigo: ['2', '4'] });
      await api.ghdReqRun('following', true);
      s.eq('la pasada manual enseña la pantalla', log.pantalla[0], [0, 0, 'load_approving']);
      s.eq('y dice cuántas va a hacer', log.pantalla[1], [0, 2, 'load_approving']);
      s.eq('y la cierra al terminar', log.pantalla[log.pantalla.length - 1], 'oculta'); }

    { const { api, log } = montarCon({ pendientes: LISTA, sigo: ['2'] });
      await api.ghdReqRun('following');
      s.eq('la ronda automática no tapa el panel', log.pantalla, []); }
    return s;
  })();
};

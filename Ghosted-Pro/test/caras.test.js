'use strict';
/* Recuperar la foto de quien ya salió con una letra porque su URL caducó.
 * De una en una y con pausa: son cientos de filas. */
const { leer, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('recuperación de caras');
  const codigo = tramo(leer('content.js'), 'const ghdFaceQ=[]', 'function YT(gq,YTnoRec){');
  const elem = () => ({ textContent: 'X', isConnected: true, hijos: [], appendChild(c) { this.hijos.push(c); } });

  const montarCon = ({ fallar = 0 } = {}) => {
    const log = { pedidos: [], archivadas: [], esperas: [] };
    let restan = fallar;
    const api = montar(codigo, {
      k: { fetchUserProfile: async (pk) => { log.pedidos.push(pk);
            if (restan-- > 0) { const e = new Error('r'); e.kind = 'rate'; throw e; }
            return { username: 'u' + pk, pic: 'p' + pk + '.jpg', picHd: 'hd' + pk + '.jpg' }; },
           rateLeftMs: () => 50 },
      tc: async (pk, url, kind) => { log.archivadas.push({ pk, url, kind }); return { dataUrl: 'data:' + pk }; },
      document: { createElement: () => ({}) },
      setTimeout: (fn, ms) => { log.esperas.push(ms); return global.setTimeout(fn, 1); },
    }, '{ghdFaceWant,pendientes:()=>ghdFaceQ.length}');
    return { api, log };
  };

  return (async () => {
    { const { api, log } = montarCon();
      const e1 = elem(), e2 = elem();
      api.ghdFaceWant('111', e1); api.ghdFaceWant('222', e2); api.ghdFaceWant('111', e1);
      s.eq('no encola dos veces a la misma persona', api.pendientes(), 2);
      await new Promise((r) => setTimeout(r, 250));
      s.eq('pide una vez por persona', log.pedidos, ['111', '222']);
      s.eq('archiva la versión en alta', log.archivadas.map((a) => a.url), ['hd111.jpg', 'hd222.jpg']);
      s.eq('la marca como avatar', log.archivadas[0].kind, 'avatar');
      s.eq('cambia la letra por la foto', [e1.textContent, e1.hijos.length], ['', 1]);
      s.ok('deja pausa entre peticiones', log.esperas.filter((m) => m === 2000).length >= 2); }

    { const { api, log } = montarCon({ fallar: 2 });
      api.ghdFaceWant('333', elem());
      await new Promise((r) => setTimeout(r, 350));
      s.eq('ante un límite reintenta en vez de rendirse', log.pedidos, ['333', '333', '333']);
      s.eq('y acaba archivando', log.archivadas.length, 1); }
    return s;
  })();
};

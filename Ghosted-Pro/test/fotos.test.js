'use strict';
/* Las URL de foto de Instagram caducan, así que la imagen se guarda antes de
 * que cambie. Y el antes/después tira de lo archivado, no de la URL muerta. */
const { leer, funcion, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('fotos de perfil · archivo y comparador');
  const src = leer('content.js');
  const T = 1000000;

  // --- resolver el antes y el después ---
  const pair = montar(funcion(src, 'ghdPhotoPair'), {
    g: { get: (k, d) => (k === 'photoArchive' ? ARCHIVO : d) }, J: { photoArchive: 'photoArchive' },
  }, 'ghdPhotoPair');
  let ARCHIVO = {};
  const conArchivo = (a) => { ARCHIVO = a; return pair; };

  s.eq('manda lo archivado sobre la URL del evento',
    conArchivo({ 9: [{ ts: T - 5e5, kind: 'avatar', dataUrl: 'data:VIEJA' }, { ts: T + 5e4, kind: 'avatar', dataUrl: 'data:NUEVA' }] })
      ({ pk: '9', ts: T, before: 'caducada1.jpg', after: 'caducada2.jpg' }),
    { antes: 'data:VIEJA', ahora: 'data:NUEVA' });
  s.eq('sin archivo tira de las URL del evento',
    conArchivo({})({ pk: '9', ts: T, before: 'v.jpg', after: 'n.jpg' }), { antes: 'v.jpg', ahora: 'n.jpg' });
  s.eq('sólo hay la anterior: deja el hueco',
    conArchivo({ 9: [{ ts: T - 5e5, kind: 'avatar', dataUrl: 'data:A' }] })({ pk: '9', ts: T }), { antes: 'data:A', ahora: '' });
  s.eq('ignora lo que no es un avatar',
    conArchivo({ 9: [{ ts: T - 9, kind: 'post', dataUrl: 'data:P' }] })({ pk: '9', ts: T }), { antes: '', ahora: '' });

  // --- el archivo no vuelve a descargar lo que ya tiene ---
  const codigoTc = funcion(src, 'tc');
  const montarTc = (inicial) => {
    const almacen = { photoArchive: JSON.parse(JSON.stringify(inicial)) };
    const log = { descargas: [] };
    const tc = montar(codigoTc, {
      g: { get: (k, d) => (almacen[k] !== undefined ? almacen[k] : d), set: (k, v) => { almacen[k] = v; } },
      J: { photoArchive: 'photoArchive' },
      k: { mediaSig: (u) => String(u).split('/').pop().split('?')[0] },
      chrome: { runtime: { sendMessage: async (m) => { log.descargas.push(m.url); return { dataUrl: 'data:' + m.url }; } } },
    }, 'tc');
    return { tc, log, almacen };
  };

  return (async () => {
    const { tc, log, almacen } = montarTc({});
    await tc('9', 'https://cdn/foto_A.jpg', 'avatar', '@lau');
    s.eq('la primera vez la descarga', log.descargas.length, 1);
    await tc('9', 'https://cdn/foto_A.jpg', 'avatar', '@lau');
    s.eq('la misma foto NO se vuelve a descargar', log.descargas.length, 1);
    await tc('9', 'https://cdn/foto_B.jpg', 'avatar', '@lau');
    s.eq('una foto nueva sí', log.descargas.length, 2);
    s.eq('y quedan las dos guardadas', almacen.photoArchive['9'].map((e) => e.sig), ['foto_A.jpg', 'foto_B.jpg']);
    s.eq('sin datos no hace nada', await montarTc({}).tc('', 'x.jpg'), { ok: false, dataUrl: '' });
    return s;
  })();
};

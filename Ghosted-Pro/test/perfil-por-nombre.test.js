'use strict';
/* Buscar a alguien por su @: tres vías. Antes se rendía en la primera si
 * Instagram la tenía limitada, aunque el buscador siguiera respondiendo. */
const { leer, funciones, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('perfil por nombre · las tres vías');
  const src = leer('ig-api.js');
  const codigo = [
    require('./lib/extraer').tramo(src, 'class x extends Error', 'function z('),
    funciones(src, ['l', 'c', 'S', 'b', 'C']),
  ].join('\n');

  const montarCon = (rutas) => {
    const pedidas = [];
    const J = async (u) => {
      pedidas.push(u.replace('https://www.instagram.com/api/v1/', ''));
      const clave = Object.keys(rutas).find((k) => u.includes(k));
      const r = rutas[clave];
      if (r === '429') { const e = new Error('rate'); e.kind = 'rate'; e.status = 429; throw e; }
      if (r === undefined) { const e = new Error('404'); e.kind = 'http'; e.status = 404; throw e; }
      return r;
    };
    return { C: montar(codigo, { J }, 'C'), pedidas };
  };

  const BUSCA = { users: [{ user: { pk: '77', username: 'marrtaferrer', full_name: 'MARTA', profile_pic_url: 'm.jpg', is_private: true } }] };
  const FICHA = { user: { pk: '77', username: 'marrtaferrer', full_name: 'MARTA', profile_pic_url: 'm.jpg', is_private: true, biography: 'bio' } };
  const via = (u) => u.includes('web_profile_info') ? 'perfil por nombre' : u.includes('topsearch') ? 'buscador' : u.includes('/info/') ? 'ficha por id' : u;

  return (async () => {
    { // el caso real: el perfil limitado y el buscador funcionando
      const { C, pedidas } = montarCon({ web_profile_info: '429', topsearch: BUSCA, '/info/': FICHA });
      let r = null, err = null;
      try { r = await C('marrtaferrer'); } catch (e) { err = e && e.kind; }
      s.eq('lo encuentra por el buscador', r && r.username, 'marrtaferrer');
      s.eq('no se rinde en el primer límite', err, null);
      s.eq('recorre las tres vías en orden', pedidas.map(via), ['perfil por nombre', 'buscador', 'ficha por id']); }

    { const { C } = montarCon({ web_profile_info: '429', topsearch: BUSCA, '/info/': '429' });
      let r = null; try { r = await C('marrtaferrer'); } catch (e) { /* */ }
      s.eq('si la tercera también falla, se queda con lo del buscador',
        r && [r.username, r.is_private], ['marrtaferrer', true]); }

    { const { C, pedidas } = montarCon({ web_profile_info: { data: { user: FICHA.user } } });
      const r = await C('marrtaferrer');
      s.eq('sin límites basta una petición', pedidas.length, 1);
      s.eq('y devuelve el perfil', r.username, 'marrtaferrer'); }

    { const { C } = montarCon({ web_profile_info: '429', topsearch: { users: [] } });
      let err = null; try { await C('nadieasi'); } catch (e) { err = e.kind; }
      s.eq('si de verdad no existe, informa del fallo', err, 'rate'); }
    return s;
  })();
};

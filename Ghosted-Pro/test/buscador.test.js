'use strict';
/* Los nombres de Instagram van llenos de tildes y alfabetos decorativos.
 * Poner en minúsculas no basta: hay que reducirlos antes a letras normales. */
const { leer, funciones, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('buscador · tildes y letras decorativas');
  const api = montar(funciones(leer('content.js'), ['ghdNorm', 'ghdMatch']), {}, '{ghdNorm,ghdMatch}');

  const LISTA = [
    { username: 'maria.virel', full_name: '𝓜𝓪𝓻𝓲𝓪 🎀' },
    { username: 'marianaagelvis', full_name: 'Mariana Mia' },
    { username: 'mariaa_lpz', full_name: 'María López' },
    { username: 'm4ria_g', full_name: 'ＭＡＲＩＡ ＧＩＬ' },
    { username: 'sofia.idzk', full_name: 'Sofía' },
    { username: 'martaferrer', full_name: '𝐌𝐀𝐑𝐓𝐀' },
    { username: 'ainxhaa', full_name: 'Ａｉｎ０ｈａ' },
  ];
  const buscar = (t) => { const q = api.ghdNorm(t); return LISTA.filter((p) => api.ghdMatch(p, q)).map((p) => p.username).sort(); };

  s.eq('"maria" encuentra tildes y letras decorativas', buscar('maria'),
    ['m4ria_g', 'maria.virel', 'mariaa_lpz', 'marianaagelvis']);
  s.eq('no arrastra a Marta', buscar('maria').includes('martaferrer'), false);
  s.eq('buscar con tilde da lo mismo', buscar('maría'), buscar('maria'));
  s.eq('"sofia" sin tilde encuentra Sofía', buscar('sofia'), ['sofia.idzk']);
  s.eq('"marta" en negrita decorativa', buscar('marta'), ['martaferrer']);
  s.eq('ancho completo también', buscar('ain0ha'), ['ainxhaa']);
  s.eq('las mayúsculas dan igual', buscar('MARÍA').length, 4);
  s.eq('sin texto devuelve todo', buscar('').length, LISTA.length);
  s.eq('un nombre que no existe no devuelve nada', buscar('zzzz'), []);
  s.eq('reduce el texto suelto', api.ghdNorm('𝓜𝓪𝓻𝓲𝓪'), 'maria');
  s.eq('aguanta valores vacíos', [api.ghdNorm(null), api.ghdMatch(null, 'x')], ['', false]);
  return s;
};

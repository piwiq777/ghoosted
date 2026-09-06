'use strict';
/* Traduce la respuesta de Instagram a un motivo: límite, sesión, reto o error.
 * Y el corte por endpoint, que impide insistir donde ya nos han parado. */
const { leer, funcion, funciones, tramo, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('clasificador de respuestas y corte por endpoint');
  const src = leer('ig-api.js');
  const codigo = [
    tramo(src, 'class x extends Error', 'function z('),
    funciones(src, ['z', 'F']),
    tramo(src, 'const RLm = new Map', 'function O(o, N, v)'),
    funcion(src, 'L'),
  ].join('\n');
  const api = montar(codigo, {}, '{L,RLchk,RLset,RLleft}');

  const clase = (st, cuerpo) => { try { api.L(st, 'application/json', cuerpo, {}); } catch (e) { return e.kind; } return '(ninguno)'; };

  s.eq('429 es un límite', clase(429, '{}'), 'rate');
  s.eq('429 con texto en español también', clase(429, '{"message":"Espera unos minutos"}'), 'rate');
  s.eq('el 401 real de Instagram pide esperar', clase(401, '{"message":"Espera unos minutos","require_login":true}'), 'rate');
  s.eq('un 401 seco es sesión', clase(401, '{"message":"login_required"}'), 'auth');
  s.eq('feedback_required es límite aunque venga con 200', clase(200, '{"message":"feedback_required"}'), 'rate');
  s.eq('demasiadas peticiones', clase(400, '{"message":"Too many requests"}'), 'rate');
  s.eq('404 es un error normal', clase(404, '{"message":"Not Found"}'), 'http');
  s.eq('checkpoint es un reto', clase(400, '{"message":"challenge_required"}'), 'challenge');
  // el falso positivo que arrastraba: las biografías viajan en la respuesta
  s.eq('una bio con "grateful" no es un límite', clase(200, '{"data":{"user":{"biography":"grateful"}}}'), '(ninguno)');
  s.eq('ni una con "corporate"', clase(200, '{"data":{"user":{"biography":"corporate girl"}}}'), '(ninguno)');
  s.eq('ni una con "unos minutos"', clase(200, '{"data":{"user":{"biography":"dame unos minutos"}}}'), '(ninguno)');
  s.eq('una respuesta buena pasa', clase(200, '{"data":{"user":{"username":"lau"}}}'), '(ninguno)');

  const PERFIL = 'https://www.instagram.com/api/v1/users/web_profile_info/?username=x';
  const BUSCA = 'https://www.instagram.com/api/v1/web/search/topsearch/?query=x';
  const corte = (u) => { try { api.RLchk(u); } catch (e) { return e.kind; } return '(pasa)'; };
  s.eq('al principio pasa todo', [corte(PERFIL), corte(BUSCA)], ['(pasa)', '(pasa)']);
  api.RLset(PERFIL);
  s.eq('el endpoint limitado se corta', corte(PERFIL), 'rate');
  s.eq('el buscador sigue abierto', corte(BUSCA), '(pasa)');
  s.eq('otro nombre en el mismo endpoint también se corta',
    corte('https://www.instagram.com/api/v1/users/web_profile_info/?username=otra'), 'rate');
  s.eq('la espera se informa en minutos', Math.ceil(api.RLleft() / 60000), 5);
  return s;
};

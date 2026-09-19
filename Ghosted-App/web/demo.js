/* Ghoosted — datos de ejemplo para ver el diseño en un navegador, sin
 * telefono ni Instagram. Solo se usa cuando no hay puente nativo. Los nombres
 * son los del lienzo. */
window.Demo = (function () {
  'use strict';
  var H = 36e5, ahora = Date.now();
  function u(pk, username, full_name, extra) { return Object.assign({ pk: String(pk), username: username, full_name: full_name || '', pic: '', is_private: false, is_verified: false }, extra || {}); }
  var base = [];
  for (var i = 0; i < 470; i++) base.push(u(1000 + i, 'seguidor_' + i, ''));
  var diaye = u(7, 'diaayee_', 'Diaye');
  var sigo = [u(1, 'braedencarterrr', 'Braeden Carter', { is_verified: true }), u(2, 'danieldrh_', 'danieldrh_'), u(3, 'evaeliades', 'Eva 💋'), u(4, 'p.aaquiiless', 'p.aaquiiless', { is_private: true })]
    .concat(base.slice(0, 288));
  var vuelta = 0;
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function ig(m, a, prog) {
    await espera(250);
    if (m === 'fetchList') {
      var lista = a[0] === 'followers' ? (vuelta++ === 0 ? base.concat([diaye]) : base.concat([u(9, 'sofi.palms', 'sofi 🌴')])) : sigo;
      for (var k = 0; k <= lista.length; k += 120) { if (prog) prog(Math.min(k, lista.length)); await espera(180); }
      return { users: lista.slice(), complete: true };
    }
    if (m === 'fetchProfileCounts') return { followers: 475, following: 292 };
    if (m === 'rateLeftMs') return 0;
    if (m === 'fetchReelsTray') return ['luke.tattooer', 'cornelia.rn', 'alvaro.carrillloo', 'david_epila_04', 'jr.fisiru_07', 'samixprivxd', 'braedencarterrr', 'isaac__ba', '_sara_p.f', 'marcc__10', 'fresh_izzy', 'aitorrrhdz']
      .map(function (n, i) { return Object.assign(u(200 + i, n, ''), { reelId: String(200 + i), count: [6, 1, 3, 1, 1, 1, 3, 1, 1, 1, 1, 1][i], latestTs: ahora - i * H, unseen: i % 3 !== 2 }); });
    if (m === 'fetchStoriesMany') { var o = {}; a[0].forEach(function (id) { o[id] = []; }); return o; }
    if (m === 'pendingRequests') return { users: [u(301, 'rihab.mzn_', 'rihab'), u(302, 'adriiana_nieves', 'adriana'), u(303, 'elvispresleyyy_', 'elvispresleyyy_')] };
    if (m === 'approveRequest' || m === 'ignoreRequest' || m === 'unfollow') return { status: 'ok' };
    if (m === 'fetchUserByUsername' || m === 'fetchUserProfile') return u(400 + String(a[0]).length, String(a[0]).replace(/^@/, ''), String(a[0]).replace(/^@/, ''));
    if (m === 'checkFollows') return { follows: Math.random() > .5, complete: true };
    if (m === 'getMyStoryItems') return [];
    if (m === 'fetchUserPosts') return [];
    return null;
  }
  async function nativo(orden, datos) {
    if (orden === 'mostrarInstagram') {
      // En el navegador no hay Instagram: se hace como si hubieras entrado.
      setTimeout(function () { Puente.recibir({ tipo: 'sesion', conectado: true, yo: '123', listo: true }); }, 400);
    }
    if (orden === 'abrir') window.open(datos.url, '_blank', 'noopener');
    if (orden === 'post') return { status: 403, json: { valid: false, error: 'demo' } };
    if (orden === 'cerrarSesion') Puente.recibir({ tipo: 'sesion', conectado: false, yo: null });
    return null;
  }
  return { ig: ig, nativo: nativo };
})();

/* Ghoosted — datos de ejemplo para ver el diseño en un navegador, sin
 * telefono ni Instagram. Solo se usa cuando no hay puente nativo. Los nombres
 * son los del lienzo. */
window.Demo = (function () {
  'use strict';
  var H = 36e5, ahora = Date.now();
  function u(pk, username, full_name, extra) { return Object.assign({ pk: String(pk), username: username, full_name: full_name || '', pic: '', is_private: false, is_verified: false }, extra || {}); }
  var base = [];
  var NOMS = ['Lucía', 'Marta', 'Pablo', 'Sara', 'Hugo', 'Carla', 'Álvaro', 'Paula', 'Daniel', 'Laura', 'Irene', 'Javi', 'Nerea', 'Marcos', 'memes.diarios', 'Alba'];
  for (var i = 0; i < 470; i++) base.push(u(1000 + i, 'seguidor_' + i, NOMS[i % NOMS.length] + ' ' + (i % 7 ? '' : '✨')));
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
    /* Historias de mentira, pero de verdad: con esto vacio no se podia
       probar el visor en el navegador y un fallo suyo no se veia hasta
       tenerlo en el movil. Son cuadros de color, sin pedir nada fuera. */
    if (m === 'fetchStoriesMany') {
      var o = {};
      a[0].forEach(function (id, j) {
        var n = 1 + (Number(id) % 3);
        o[id] = [];
        for (var q = 0; q < n; q++) {
          var c = ['%23FF9A3D', '%23D62976', '%236E4BE0', '%23F0507A'][(Number(id) + q) % 4];
          var img = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="405" height="720">' +
            '<rect width="405" height="720" fill="' + c + '"/></svg>';
          o[id].push({ mediaId: id + '_' + q, url: img, img: img, isVideo: false, takenAt: ahora - q * H });   // en ms, como los de verdad
        }
      });
      return o;
    }
    if (m === 'pendingRequests') return { users: [u(301, 'rihab.mzn_', 'rihab'), u(302, 'adriiana_nieves', 'adriana'), u(303, 'elvispresleyyy_', 'elvispresleyyy_')] };
    if (m === 'approveRequest' || m === 'ignoreRequest' || m === 'unfollow') return { status: 'ok' };
    if (m === 'fetchHighlightStories') return [0,1,2].map(function (i) {
      var c = ['%236E4BE0','%23FF9A3D','%23D62976'][i];
      var img = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="405" height="720"><rect width="405" height="720" fill="' + c + '"/></svg>';
      return { mediaId: 'd' + i, url: img, img: img, isVideo: false, takenAt: ahora - i * 86400000 };
    });
    if (m === 'fetchFollowersOf') return { users: base.slice(0, 40), complete: false };
    if (m === 'fetchHighlights') return [0,1,2,3].map(function (i) {
      return { id: 'h' + i, mediaId: 'm' + i, title: ['Viajes','Gym','2024','Amigos'][i], covers: [], full: '', count: 3 + i };
    });
    if (m === 'fetchDossier') {
      var n = String(a[1] || a[0] || 'alguien').replace(/^@/, '');
      return { pk: String(a[0] || 400), username: n, full_name: n, bio: 'Bio de mentira para el navegador.\nSegunda linea.',
        bio_links: [], external_url: 'https://ejemplo.com',
        pic: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="%23D62976"/></svg>',
        pic_hd: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="%23D62976"/></svg>',
        followers: 1234, following: 567, posts: 89, is_private: false, is_verified: true,
        is_business: false, is_pro: false, category: '', has_highlights: true, public_email: 'hola@ejemplo.com', public_phone: '' };
    }
    if (m === 'guardarMedia') return { ok: false, error: 'en el navegador no se guarda' };
    if (m === 'searchUsers') {
      var q = String(a[0] || '').toLowerCase();
      return base.filter(function (x) { return (x.username + ' ' + x.full_name).toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
    }
    if (m === 'fetchUserByUsername' || m === 'fetchUserProfile') return u(400 + String(a[0]).length, String(a[0]).replace(/^@/, ''), String(a[0]).replace(/^@/, ''));
    if (m === 'checkFollows') return { follows: Math.random() > .5, complete: true };
    if (m === 'fetchFollowingOf') { var k = Math.floor(Date.now() / 1000) % 3; return { users: base.slice(k, k + 40), complete: true }; }
    if (m === 'getMyStoryItems') return [];
    if (m === 'fetchUserPosts') return [0,1,2,3,4,5,6,7,8].map(function (i) {
      var c = ['%23FF9A3D','%23D62976','%236E4BE0','%23F0507A'][i % 4];
      var img = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="' + c + '"/></svg>';
      return { id: 'p' + i, code: 'C' + i, thumb: img, full: img, isVideo: i % 3 === 0,
        likes: 120 + i * 37, comments: 4 + i, likesHidden: false, ts: ahora - i * 86400000,
        multi: i % 4 === 2, slides: i % 4 === 2 ? 3 : 1 };
    });
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

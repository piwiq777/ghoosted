/* Ghoosted — lado de Instagram de la app.
 *
 * La app tiene dos vistas web. Una es instagram.com de verdad: ahi inicias
 * sesion en la pagina oficial (la contraseña va a Instagram y a nadie mas) y
 * ahi corren, tal cual, los mismos page-api.js e ig-api.js de la extension.
 * La otra es el diseño de Ghoosted. Este archivo es la puerta entre las dos:
 * recibe "llama a fetchList('followers')", la ejecuta con GhostedIG y
 * devuelve el resultado.
 *
 * Solo pasan los metodos de la lista METODOS. Cualquier otro nombre se
 * rechaza, asi que la vista del diseño no puede usar la sesion para nada que
 * no haga ya la extension. */
(function () {
  'use strict';
  if (window.__ghdPuenteIG) return;
  window.__ghdPuenteIG = true;

  // ig-api.js intenta primero el puente de page-api.js (misma pagina) y solo
  // si falla pide al service worker de la extension. Aqui no hay service
  // worker: se contesta que no, y se queda con el camino de la pagina.
  window.chrome = window.chrome || {};
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.runtime.sendMessage = function () { return Promise.resolve({ error: 'sin_fondo' }); };

  function aApp(obj) {
    var s = JSON.stringify(obj);
    try {
      if (window.GhdNativoIG && window.GhdNativoIG.aApp) window.GhdNativoIG.aApp(s);
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ghdig) window.webkit.messageHandlers.ghdig.postMessage(s);
    } catch (e) { /* sin nativo: nada que hacer */ }
  }

  function ig() { return window.GhostedIG; }
  function galleta(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Con progreso: el ultimo argumento de estas funciones es un callback.
  var CON_PROGRESO = { fetchList: 1, getStoryViewers: 1 };
  var METODOS = {
    fetchList: 1, fetchProfileCounts: 1, fetchUserProfile: 1, fetchUserByUsername: 1,
    getMyStoryItems: 1, getStoryViewers: 1, fetchReelsTray: 1, fetchStoriesMany: 1, fetchStories: 1,
    pendingRequests: 1, approveRequest: 1, ignoreRequest: 1, unfollow: 1,
    checkFollows: 1, checkFollowedBy: 1, searchUsers: 1,
    fetchUserPosts: 1, fetchPostLikers: 1, fetchPostComments: 1, rateLeftMs: 1, fetchFollowingOf: 1
  };

  function errorPlano(e) {
    return {
      kind: (e && e.kind) || 'other', status: (e && e.status) || 0,
      reason: String((e && e.reason) || ''), message: String((e && e.message) || e || '')
    };
  }

  window.GhdIGRecibir = async function (s) {
    var m;
    try { m = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
    if (!m || m.tipo !== 'llamar') return;
    var id = m.id, metodo = String(m.metodo || '');
    if (metodo === 'sesion') return aApp(Object.assign({ tipo: 'resultado', id: id, ok: true }, { valor: sesion() }));
    if (metodo === 'gasto') return aApp({ tipo: 'resultado', id: id, ok: true, valor: gasto() });
    if (metodo === 'probar') return window.GhdElegirId().then(function (v) { aApp({ tipo: 'resultado', id: id, ok: true, valor: v }); });
    if (!METODOS[metodo]) return aApp({ tipo: 'resultado', id: id, ok: false, error: { kind: 'other', message: 'metodo_no_permitido' } });
    var api = ig();
    if (!api || typeof api[metodo] !== 'function') return aApp({ tipo: 'resultado', id: id, ok: false, error: { kind: 'transport', message: 'ig_no_listo' } });
    var args = Array.isArray(m.args) ? m.args.slice() : [];
    if (CON_PROGRESO[metodo]) {
      var ultimo = 0;
      args.push(function (n) {
        var ahora = Date.now();
        if (ahora - ultimo < 250) return;
        ultimo = ahora;
        aApp({ tipo: 'progreso', id: id, n: Number(n) || 0 });
      });
    }
    try {
      var valor = await api[metodo].apply(api, args);
      aApp({ tipo: 'resultado', id: id, ok: true, valor: valor === undefined ? null : valor });
    } catch (e) {
      aApp({ tipo: 'resultado', id: id, ok: false, error: errorPlano(e) });
    }
  };

  /* Diagnostico: una sola peticion a la lista de seguidores, con el id de
     la web del movil y con el de la de ordenador, y lo que contesta
     Instagram en cada caso. Es lo que hay que mirar cuando "no carga". */
  function una(url, appId) {
    return new Promise(function (ok) {
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.withCredentials = true;
      x.timeout = 15000;
      x.setRequestHeader('x-ig-app-id', appId);
      x.setRequestHeader('x-asbd-id', '359341');
      x.setRequestHeader('x-requested-with', 'XMLHttpRequest');
      x.onload = function () {
        var n = null;
        try { var j = JSON.parse(x.responseText); n = Array.isArray(j.users) ? j.users.length : null; } catch (e) {}
        ok({ app: appId, status: x.status, usuarios: n, texto: String(x.responseText || '').slice(0, 160) });
      };
      x.onerror = function () { ok({ app: appId, status: 0, texto: 'error de red' }); };
      x.ontimeout = function () { ok({ app: appId, status: 0, texto: 'tiempo agotado' }); };
      x.send();
    });
  }
  async function probar() {
    var yo = galleta('ds_user_id');
    if (!yo) return { yo: null };
    var base = 'https://www.instagram.com/api/v1/friendships/' + yo + '/followers/?';
    var movil = await una(base + 'count=12&search_surface=follow_list_page', '1217981644879628');
    var pc = await una(base + 'count=12&search_surface=follow_list_page', '936619743392459');
    var movil2 = await una(base + 'count=12', '1217981644879628');
    var pc2 = await una(base + 'count=12', '936619743392459');
    return { yo: yo, ua: navigator.userAgent.slice(0, 80), usado: window.__ghdAppId || 'pc', movil: movil, pc: pc, movil2: movil2, pc2: pc2,
             listo: !!window.GhostedIG, ruta: location.pathname };
  }

  /* Cuantas peticiones se le han hecho a Instagram. El tope vive en
     page-api.js; esto solo lo cuenta para poder enseñarlo. */
  function gasto() {
    var g = { ultima: 0, hora: [], dia: [] };
    try { g = JSON.parse(localStorage.getItem('ghosted_gasto') || 'null') || g; } catch (e) {}
    var ahora = Date.now(), t = window.__ghdTope || {};
    return {
      hora: (g.hora || []).filter(function (x) { return ahora - x < 3600000; }).length,
      dia: (g.dia || []).filter(function (x) { return ahora - x < 86400000; }).length,
      topeHora: t.hora || 0, topeDia: t.dia || 0, ultima: g.ultima || 0
    };
  }

  function sesion() {
    var yo = galleta('ds_user_id');
    // sessionid es HttpOnly y no se ve desde aqui; ds_user_id si, y solo
    // existe con la sesion abierta.
    return { conectado: !!yo, yo: yo || null, listo: !!ig(), ruta: location.pathname };
  }
  // Nada mas cargar, y cada vez que Instagram cambia de pagina por dentro,
  // se avisa de si hay sesion: es lo que decide si se enseña el login.
  var anterior = '';
  function avisar() {
    var s = sesion(), k = JSON.stringify(s);
    if (k === anterior) return;
    anterior = k;
    aApp(Object.assign({ tipo: 'sesion' }, s));
  }
  /* Ya no se prueba nada por cuenta propia. Esa prueba automatica (cuatro
     peticiones, y repetida cuando fallaba) es lo que hizo que Instagram
     limitara la cuenta. El id se elige cuando TU pulsas "Probar" en Ajustes,
     y si no, se usa el de la web del movil. */
  async function elegirId() {
    try {
      var g = localStorage.getItem('ghd_app_id');
      if (g) window.__ghdAppId = g;
    } catch (e) {}
  }
  window.GhdElegirId = async function () {
    var r = await probar();
    function bien(x) { return x && x.status === 200 && x.usuarios > 0; }
    var id = bien(r.movil) || bien(r.movil2) ? '1217981644879628' : bien(r.pc) || bien(r.pc2) ? '936619743392459' : null;
    if (id) { window.__ghdAppId = id; try { localStorage.setItem('ghd_app_id', id); } catch (e) {} }
    return Object.assign({ elegido: id }, r);
  };

  avisar();
  elegirId();
  // Mirar una cookie no le pide nada a Instagram; esto se puede repetir.
  setInterval(avisar, 1500);
})();

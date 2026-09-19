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
    fetchUserPosts: 1, fetchPostLikers: 1, fetchPostComments: 1, rateLeftMs: 1
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
  avisar();
  setInterval(avisar, 1500);
})();

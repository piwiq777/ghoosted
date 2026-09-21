/* Ghosted — page-context request bridge (runs in the MAIN world, before
 * Instagram's own scripts, so it can see the same cookies/session IG's own
 * app uses). The isolated-world content script (ig-api.js) can't issue these
 * requests itself with the right headers, so it posts a message here and
 * this file does the actual fetch and posts the result back.
 *
 * Rewritten from the minified original with identical behaviour, PLUS one
 * fix: requests were missing `x-asbd-id` and `x-ig-www-claim`, two headers
 * Instagram's own web client always sends. Reads mostly still went through
 * without them, but write calls — unfollow above all — got silently
 * rejected or soft-blocked far more often without them. That's the "dejar
 * de seguir" / story failures this file fixes.
 *
 * x-ig-www-claim in particular is not a fixed value: Instagram hands one out
 * on the FIRST response (header `x-ig-set-www-claim`) and expects every
 * later request to echo it back via `x-ig-www-claim`. So we capture it once
 * per session and reuse it — sessionStorage, not a module variable, so it
 * survives the content script being re-injected on every Instagram page
 * navigation (Instagram is an SPA; the tab reloads far less than the page
 * changes). */
(function () {
  'use strict';

  // El id de la web de ordenador. La app del movil pone el de la web del
  // movil en window.__ghdAppId: Instagram compara este id con el navegador
  // que hace la peticion, y si no casan contesta "useragent mismatch" y las
  // listas de seguidores salen vacias o a medias.
  var APP_ID = window.__ghdAppId || '936619743392459';
  var ASBD_ID = '359341';
  var CLAIM_STORAGE_KEY = 'ghosted_www_claim';
  var IN = 'ghosted-content-fetch'; // messages coming FROM the content script
  var OUT = 'ghosted-page-fetch'; // messages going back TO the content script
  var XHR = window.XMLHttpRequest;
  var inFlight = new Set(); // dedupe by request id — a stray double-post shouldn't fire twice

  function getClaim() {
    try {
      return sessionStorage.getItem(CLAIM_STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setClaim(value) {
    if (!value) return;
    try {
      sessionStorage.setItem(CLAIM_STORAGE_KEY, value);
    } catch (e) {
      /* private-mode / storage disabled — just skip persisting it */
    }
  }

  // Instagram firma cada POST con dos valores que salen de su propio runtime:
  // `jazoest` (SprinkleConfig) y `fb_dtsg` (DTSG). Sin ellos el servidor no
  // reconoce la petición como suya y contesta con la página web en lugar de
  // datos — que es exactamente lo que rompía dejar de seguir y aprobar. Vivimos
  // en el mismo contexto que su código, así que se los pedimos a él.
  function igModule(name) {
    try { return typeof window.require === 'function' ? window.require(name) : null; } catch (e) { return null; }
  }
  function signBody(body) {
    var out = String(body || '');
    try {
      var cfg = igModule('PolarisConfig');
      var sprinkleCfg = igModule('SprinkleConfig');
      var param = sprinkleCfg && sprinkleCfg.param_name;
      var token = cfg && typeof cfg.getSprinkleToken === 'function' ? cfg.getSprinkleToken() : null;
      if (param && token != null && out.indexOf(param + '=') === -1) {
        out += (out ? '&' : '') + encodeURIComponent(param) + '=' + encodeURIComponent(token);
      }
    } catch (e) { /* sin sprinkle: se envía igual, puede que baste */ }
    try {
      var dtsg = igModule('DTSG');
      var value = dtsg && typeof dtsg.getToken === 'function' ? dtsg.getToken() : null;
      if (value && out.indexOf('fb_dtsg=') === -1) {
        out += (out ? '&' : '') + 'fb_dtsg=' + encodeURIComponent(value);
      }
    } catch (e) { /* idem */ }
    return out;
  }
  // El claim que Instagram tiene vivo es mejor que el que hayamos cazado al
  // vuelo: el suyo está siempre al día.
  function liveClaim() {
    try {
      var m = igModule('PolarisWWWClaim');
      var v = m && typeof m.getWWWClaim === 'function' ? m.getWWWClaim() : null;
      return v ? String(v) : '';
    } catch (e) { return ''; }
  }

  function postResult(payload) {
    window.postMessage(payload, location.origin);
    document.dispatchEvent(new CustomEvent('ghosted:page-result', { detail: payload }));
  }

  // Instagram answers some blocked/expired requests with a 200 + an HTML
  // page instead of JSON. Sniff which kind of page it is so the caller can
  // tell "you're logged out" apart from "you're rate-limited".
  function classifyHtml(text, url) {
    var body = String(text || '').slice(0, 4000).toLowerCase();
    var finalUrl = String(url || '').toLowerCase();
    if (finalUrl.includes('/accounts/login') || body.includes('loginform')) return 'login';
    if (finalUrl.includes('/challenge') || finalUrl.includes('/checkpoint') || body.includes('checkpoint')) return 'challenge';
    return 'shell';
  }

  // Only ever proxy the exact requests Ghosted needs: any GET under
  // /api/v1/ or /graphql/query/, and POST only to the friendships mutation
  // endpoints the app actually uses. Everything else is refused, so a
  // compromised page can't abuse this bridge as an open fetch proxy.
  // approve/ignore back the follow-request screen; leaving them out of this
  // list is why those calls hung until the caller's timeout.
  var GET_ALLOWED = /^https:\/\/www\.instagram\.com\/(api\/v1|graphql\/query)\//;
  // Dos familias de rutas, ambas de Instagram: create/destroy siguen el
  // esquema antiguo, y aprobar/rechazar solicitudes viven bajo /web/.
  // Arranca sin permitir NADA. En Plus se queda asi: el puente es de solo
  // lectura y cualquier POST se rechaza, no por una bandera sino porque no
  // hay ninguna ruta en la lista. Pro la amplia justo debajo.
  var POST_ALLOWED = /(?!)/;
//#plus-off escritura: solo Pro puede seguir, dejar de seguir y aprobar
  POST_ALLOWED = /^https:\/\/www\.instagram\.com\/api\/v1\/(friendships\/(create|destroy)\/\d+|web\/friendships\/\d+\/(approve|ignore))\/?$/;
//#plus-on

  /* ------------------------------------------------------------------
     TOPE DE PETICIONES

     Todo lo que Ghoosted le pide a Instagram pasa por aqui, asi que aqui
     es donde se le pone un techo. La app del movil define window.__ghdTope
     ({min, hora, dia}); en la extension no existe y nada cambia.

     Esto no es una optimizacion: es lo que impide que un fallo nuestro
     —un bucle que reintenta -- acabe con la cuenta del usuario limitada
     por Instagram. Aunque el codigo de arriba se vuelva loco, de aqui no
     salen mas peticiones de las que caben en el tope.
     ------------------------------------------------------------------ */
  var GASTO_KEY = 'ghosted_gasto';
  var gasto = null;

  function leerGasto() {
    if (gasto) return gasto;
    gasto = { ultima: 0, hora: [], dia: [] };
    try {
      var g = JSON.parse(localStorage.getItem(GASTO_KEY) || 'null');
      if (g && Array.isArray(g.hora) && Array.isArray(g.dia)) gasto = { ultima: Number(g.ultima) || 0, hora: g.hora, dia: g.dia };
    } catch (e) { /* sin almacen: solo esta sesion */ }
    return gasto;
  }
  function guardarGasto() {
    try { localStorage.setItem(GASTO_KEY, JSON.stringify(gasto)); } catch (e) { /* da igual */ }
  }

  /* Pura a proposito: recibe el gasto y devuelve cuanto hay que esperar y
     si hay que negarse. Asi se puede comprobar con pruebas. */
  function motivoTope(g, ahora, t) {
    if (!t) return { espera: 0, motivo: '' };
    var hora = (g.hora || []).filter(function (x) { return ahora - x < 3600000; });
    var dia = (g.dia || []).filter(function (x) { return ahora - x < 86400000; });
    if (t.dia && dia.length >= t.dia) return { espera: 0, motivo: 'tope_dia' };
    if (t.hora && hora.length >= t.hora) return { espera: 0, motivo: 'tope_hora' };
    var falta = (t.min || 0) - (ahora - (g.ultima || 0));
    return { espera: falta > 0 ? falta : 0, motivo: '', hora: hora, dia: dia };
  }

  function dormir(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Las peticiones van de una en una: sin esto, veinte llamadas a la vez se
  // saltarian la separacion minima entre peticiones.
  var cola = Promise.resolve();
  function pedirTurno() {
    var t = window.__ghdTope;
    if (!t) return Promise.resolve('');
    var siguiente = cola.then(async function () {
      var g = leerGasto();
      var r = motivoTope(g, Date.now(), t);
      if (r.motivo) return r.motivo;
      if (r.espera) await dormir(r.espera);
      var ahora = Date.now();
      g.ultima = ahora;
      g.hora = (r.hora || []).concat([ahora]);
      g.dia = (r.dia || []).concat([ahora]);
      guardarGasto();
      return '';
    });
    cola = siguiente.catch(function () {});
    return siguiente;
  }

  async function handleFetch(req) {
    if (!req || !req.id || inFlight.has(req.id)) return;
    var url = String(req.url || '');
    var method = req.method === 'POST' ? 'POST' : 'GET';
    var allowed = method === 'GET' ? GET_ALLOWED.test(url) : POST_ALLOWED.test(url);
    // Answer the refusal instead of staying silent: a dropped message left the
    // caller waiting for its 18 s timeout and then blaming the network, which
    // hid the real cause completely.
    if (!allowed) {
      postResult({ source: OUT, id: req.id, error: 'blocked_by_bridge' });
      return;
    }

    inFlight.add(req.id);
    setTimeout(function () { inFlight.delete(req.id); }, 30000);

    // El tope manda: si se ha gastado, se contesta que no en vez de pedirlo.
    var frenado = await pedirTurno();
    if (frenado) {
      postResult({ source: OUT, id: req.id, error: frenado });
      return;
    }

    try {
      var headers = {
        'x-ig-app-id': window.__ghdAppId || APP_ID,
        'x-asbd-id': ASBD_ID,
        'x-requested-with': 'XMLHttpRequest',
      };
      var claim = liveClaim() || getClaim();
      if (claim) headers['x-ig-www-claim'] = claim;
      if (method === 'POST') {
        headers['content-type'] = 'application/x-www-form-urlencoded';
        if (req.csrf) headers['x-csrftoken'] = String(req.csrf);
      }

      var res = await new Promise(function (resolve, reject) {
        var xhr = new XHR();
        xhr.open(method, url, true);
        xhr.withCredentials = true;
        xhr.timeout = 15000;
        Object.keys(headers).forEach(function (name) { xhr.setRequestHeader(name, headers[name]); });
        xhr.onload = function () {
          var newClaim = xhr.getResponseHeader('x-ig-set-www-claim');
          if (newClaim) setClaim(newClaim);
          resolve({
            status: xhr.status,
            contentType: xhr.getResponseHeader('content-type') || '',
            text: xhr.responseText || '',
            finalUrl: xhr.responseURL || url,
          });
        };
        xhr.onerror = function () { reject(new Error('network')); };
        xhr.ontimeout = function () { reject(new Error('timeout')); };
        xhr.send(method === 'POST' ? signBody(req.body) : undefined);
      });

      var isJson = res.contentType.toLowerCase().includes('application/json') || /^\s*[[{]/.test(res.text);
      postResult({
        source: OUT,
        id: req.id,
        status: res.status,
        contentType: res.contentType,
        text: isJson ? res.text : '',
        finalUrl: res.finalUrl,
        htmlClass: isJson ? '' : classifyHtml(res.text, res.finalUrl),
      });
    } catch (e) {
      postResult({ source: OUT, id: req.id, error: 'network' });
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (event.source !== window || !data || data.source !== IN) return;
    handleFetch(data);
  });
  document.addEventListener('ghosted:page-fetch', function (event) { handleFetch(event.detail); });
})();

/* Ghoosted — el motor de la app.
 *
 * Hace lo mismo que la extension en revisar() (content.js, YL): pide tus
 * seguidores, los compara con la foto anterior y apunta quien se fue y quien
 * llego. Todo se refresca una vez al dia, ni a mano mas veces. Si
 * la lista vuelve a medias (Instagram corta a veces) NO se compara: sin ese
 * freno, una lista cortada sacaba a medio mundo como "te dejo de seguir".
 *
 * Todo se guarda en el telefono (localStorage de la vista del diseño). Nada
 * sale de aqui salvo la clave de licencia, que se comprueba en ghoosted.net. */
window.Motor = (function () {
  'use strict';
  var CLAVE = 'ghd_app_v1';
  /* Cada cuanto se le pide algo a Instagram. Al principio era cada 30 min
     como decia el diseño, y con eso (mas una prueba automatica que se repetia
     sola) Instagram limito la cuenta. Ahora: una revision al dia como
     mucho, y solo con la app abierta. */
  /* UNA VEZ AL DIA. Ni a mano.
     Instagram no mide lo que pides, mide cada cuanto lo pides desde el mismo
     sitio. Una cuenta que baja su lista de seguidores cuatro veces al dia no
     se parece a nadie, y eso es lo que acabo con la cuenta de pruebas. Una vez
     al dia si se parece a mirar el movil por la mañana.
     Ademas los datos no dan para mas: quien te dejo de seguir hoy sigue siendo
     el mismo dentro de dos horas. Revisar mas a menudo no enseña nada nuevo;
     solo gasta el margen que tenemos con Instagram. */
  var CADA = 24 * 3600000;
  var SEGUIDOS_CADA = 24 * 3600000;
  var HISTORIAS_CADA = 24 * 3600000;
  var LIBRE = 3;                    // "Ves las 3 primeras de cada lista"
  // Con www: ghoosted.net redirige a www, y una peticion con cuerpo JSON no
  // sigue redirecciones desde otra web (el navegador la corta y parece que
  // no hay red).
  var LIC_API = 'https://www.ghoosted.net/api/license/';

  var S = cargar();
  var oyentes = [], ocupado = false, fase = null;

  function cargar() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
    // Quien ya venia frenado por Instagram arranca en pausa: al actualizar
    // no se le pide nada hasta que lo diga.
    if (s && !s.v2) { s.v2 = true; if (s.rate) s.pausa = true; }
    return Object.assign({
      yo: null, followers: null, following: null, counts: null, events: [], history: [],
      watch: [], activity: [], stories: { viewers: {}, items: {}, hist: [], ts: 0 },
      reqRule: 'manual', reqs: null, tray: null, inter: null, lastCheck: 0, nextCheck: 0,
      rate: null, error: null, lic: null, intro: false, parcial: false, log: [], pausa: false, auto: false,
      /* La cata: lo que un usuario sin Pro puede probar de Historias y de
         Actividad. Una historia y una persona, una vez, y luego el muro.
         Va aqui y no en la pantalla porque tiene que sobrevivir a cerrar la
         app; y NO se borra al cambiar de cuenta de Instagram, o bastaria con
         salir y entrar para volver a tener barra libre. */
      cata: { historia: 0, persona: 0 },
      /* Cada vez que se entra en Instagram dentro de la app, Instagram apunta
         una SESION NUEVA. Cerrar sesion aqui borra las cookies, asi que la
         siguiente entrada es una sesion de cero. Repetirlo varias veces en un
         rato es de las cosas que mas rapido hacen saltar una restriccion
         ("no puedes crear varias sesiones"), y no tiene nada que ver con
         cuantos datos pidas. Se llevan las marcas para poder avisar. */
      sesiones: [],
      /* Los expedientes ya pedidos. Se guardan porque cada uno es una
         peticion a Instagram y el perfil de alguien no cambia cada minuto:
         volver a entrar en la misma persona no puede costar otra. */
      exp: {}
    }, s || {});
  }
  /* REPARAR A QUIEN YA SE COMIO EL FALLO DE ARRIBA.
     Su primer seguidor no dejo evento y no hay forma de que aparezca solo:
     la proxima revision comparara 1 con 1 y no vera ningun cambio. Pero no
     hay que inventar nada para arreglarlo — sabemos QUIENES son (la lista
     guardada) y CUANDO nos enteramos (la marca de tiempo de esa lista).
     Se hace una sola vez y solo en el caso exacto del fallo: hay seguidores
     guardados, no hay ni un evento, y el historial empieza en cero. Quien
     instalo la app con seguidores ya tiene su historial empezando en otro
     numero, asi que no le toca nada. */
  function repararNuevos() {
    if (!S.followers || !(S.followers.users || []).length) return;
    if ((S.events || []).length) return;
    if (!(S.history || []).length || S.history[0].followers !== 0) return;
    S.events = S.followers.users.map(function (u) {
      return Object.assign({ type: 'new', ts: S.followers.ts || Date.now() }, u);
    });
    registrar('nuevos rehechos', { message: 'n=' + S.events.length });
    guardar();
  }

  /* DEVOLVER EL PRO A QUIEN SE QUEDO SIN EL.
     Quien abrio la app sin sesion con la clave puesta tiene guardado
     {valid:false, error:'account'} para siempre. Arreglar el fallo no se lo
     devuelve solo: seguiria leyendo ese false. Aqui se borra esa marca y se
     deja que la proxima comprobacion CON sesion decida de verdad. Si la
     clave estuviera mal de verdad (revocada, de otra cuenta, caducada), eso
     se respeta y no se toca. */
  function repararLicencia() {
    var l = S.lic;
    if (!l || !l.key || l.valid !== false) return;
    if (NO_DE_VERDAD[l.error]) return;
    S.lic = Object.assign({}, l, { valid: true, error: null, vts: 0 });
    registrar('licencia rehecha', { message: 'motivo=' + (l.error || '?') });
    guardar();
  }

  var guardarT = 0;
  function guardar() {
    clearTimeout(guardarT);
    guardarT = setTimeout(function () {
      try { localStorage.setItem(CLAVE, JSON.stringify(S)); }
      catch (e) {
        // Lleno: lo que mas ocupa son las listas antiguas de eventos.
        S.events = S.events.slice(0, 800); S.activity = S.activity.slice(0, 300);
        try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e2) {}
      }
    }, 120);
  }
  /* Lo que ha ido pasando, para el diagnostico de Ajustes: sin esto, cuando
     algo "no va" no hay manera de saber que contesto Instagram. */
  function registrar(que, e) {
    S.log = [{ ts: Date.now(), que: que, kind: e && e.kind || '', status: e && e.status || 0,
               msg: String(e && (e.reason || e.message) || (typeof e === 'string' ? e : '')).slice(0, 140) }].concat(S.log || []).slice(0, 40);
    guardar();
  }
  function avisar(extra) { oyentes.forEach(function (f) { try { f(extra || {}); } catch (e) {} }); }
  function on(f) { oyentes.push(f); }
  function ig(m, a, p) { return Puente.ig(m, a, p); }
  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function azar(a, b) { return a + Math.floor(Math.random() * (b - a)); }
  function dia(ts) { var d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function persona(u) {
    return { pk: String(u.pk || ''), username: u.username || '', full_name: u.full_name || '', pic: u.pic || '',
             is_private: !!u.is_private, is_verified: !!u.is_verified };
  }

  /* ---------------- licencia ----------------
     La API de licencias contesta con CORS abierto, asi que se llama desde
     aqui mismo, sin pasar por el telefono. */
  async function post(url, body) {
    if (Puente.demo) return Puente.nativo('post', { url: url, body: body });
    try {
      var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var j = null; try { j = await r.json(); } catch (e) {}
      return { status: r.status, json: j };
    } catch (e) { return null; }
  }
  function esPro() {
    var l = S.lic;
    return !!(l && l.valid && !l.refunded && !l.revoked && (!S.yo || !l.accountId || String(l.accountId) === String(S.yo)));
  }
  async function activar(clave) {
    clave = String(clave || '').trim();
    if (!clave) return { valid: false, error: 'vacia' };
    if (!S.yo) return { valid: false, error: 'sin_sesion' };
    var r = await post(LIC_API + 'activate', { key: clave, accountId: S.yo, product: 'pro' });
    var j = r && r.json;
    if (j && j.valid) { S.lic = Object.assign({ key: clave, accountId: S.yo, ts: Date.now() }, j, { valid: true }); guardar(); avisar(); }
    return j || { valid: false, error: (r && r.status === 429) ? 'demasiados_intentos' : 'red' };
  }
  /* Motivos por los que el servidor dice que NO y hay que hacerle caso: son
     cosas de la clave. Cualquier otra respuesta negativa habla de nosotros
     (no hay sesion, no hay red, demasiados intentos, el servidor caido) y NO
     puede quitarle el Pro a quien ha pagado. */
  var NO_DE_VERDAD = { invalid: 1, revoked: 1, bound: 1, expired: 1, wrong_product: 1 };

  async function reverificar() {
    var l = S.lic;
    if (!l || !l.key || Date.now() - (l.vts || 0) < 24 * 3600000) return;
    /* AQUI ESTABA EL FALLO QUE DEJABA SIN PRO A QUIEN HABIA PAGADO.
       Esto se llama cada vez que llega el estado de la sesion — tambien
       cuando llega "desconectado", que es lo primero que llega al abrir la
       app y justo lo que llega al cerrar sesion. Entonces S.yo es null, se
       preguntaba por la clave SIN cuenta, el servidor contestaba
       {valid:false, error:'account'} (su comprobacion exige un id numerico),
       y esa respuesta se guardaba tal cual: la clave quedaba marcada como
       invalida PARA SIEMPRE. Al volver a entrar en la misma cuenta de la que
       se compro, ya no habia Pro. Y como se acababa de sellar vts, no se
       volvia a preguntar en 24 h.
       Sin sesion no se pregunta nada. */
    if (!S.yo) return;
    var r = await post(LIC_API + 'verify', { key: l.key, accountId: S.yo, product: 'pro' });
    var j = r && r.json;
    if (!j || typeof j.valid !== 'boolean') return;          // sin red: como estaba
    if (!j.valid && !NO_DE_VERDAD[j.error]) return;          // el problema no es la clave
    S.lic = Object.assign({}, l, j, { vts: Date.now() });
    guardar(); avisar();
  }

  /* ---------------- sesion ---------------- */
  /* Cuantas veces se ha entrado en Instagram en las ultimas 24 h. */
  function sesionesHoy() {
    return (S.sesiones || []).filter(function (t) { return Date.now() - t < 86400000; }).length;
  }

  function sesion(s) {
    if (!s) return;
    var antes = S.yo;
    S.yo = s.conectado ? String(s.yo) : null;
    if (!antes && S.yo) {
      S.sesiones = (S.sesiones || []).filter(function (t) { return Date.now() - t < 7 * 86400000; });
      S.sesiones.push(Date.now());
    }
    // Al salir, lo de la cuenta anterior deja de estar: si luego entra otra,
    // no se mezclan listas de dos cuentas distintas.
    if (antes && !S.yo) {
      ['followers', 'following', 'counts', 'reqs', 'tray', 'inter', 'rate', 'error', 'diag'].forEach(function (k) { S[k] = null; });
      S.events = []; S.activity = []; S.history = []; S.stories = { viewers: {}, items: {}, hist: [], ts: 0 };
      S.pausa = false; S.parcial = false;
    }
    if (antes && S.yo && antes !== S.yo) {
      // Otra cuenta: lo guardado era de la anterior y no se mezcla.
      var lic = S.lic, intro = S.intro;
      S = cargar(); localStorage.removeItem(CLAVE); S = Object.assign(cargar(), { yo: s.yo, lic: lic, intro: intro });
    }
    guardar(); avisar({ sesion: true });
  }

  /* ---------------- la revision ---------------- */
  function progreso(f) { fase = f; avisar({ fase: f }); }

  /* Cuanto falta para poder volver a revisar. 0 = se puede ahora.
     Si la ultima salio a medias o dio error no se hace esperar: el usuario se
     quedaria un dia entero con datos malos y sin poder hacer nada, que es
     peor que la peticion que nos ahorramos. */
  function faltaParaRevisar() {
    if (!S.lastCheck) return 0;
    if (S.parcial || S.error) return 0;
    return Math.max(0, S.lastCheck + CADA - Date.now());
  }

  /* Cuanto queda de la cata de una funcion. 1 = le queda la prueba, 0 = se
     acabo. Con Pro no hay cata que gastar: siempre queda. */
  var CATA = { historia: 1, persona: 1 };
  function cataQueda(que) {
    if (esPro()) return 1;
    return Math.max(0, (CATA[que] || 0) - ((S.cata && S.cata[que]) || 0));
  }
  function gastarCata(que) {
    if (esPro()) return;
    if (!S.cata) S.cata = { historia: 0, persona: 0 };
    S.cata[que] = (S.cata[que] || 0) + 1;
    guardar(); avisar();
  }

  async function revisar(manual) {
    if (ocupado) return;
    if (!S.yo) { avisar({ fin: true, sinSesion: true }); return; }
    // El tope del dia vale tambien para el boton: es justo el boton el que
    // se pulsa diez veces seguidas cuando algo no sale como se esperaba.
    var falta = faltaParaRevisar();
    if (falta > 0) { avisar({ fin: true, hoyYa: true, falta: falta }); return; }
    // En pausa no se le pide nada a Instagram, ni a mano: es el freno de
    // emergencia cuando Instagram ha limitado la cuenta.
    if (S.pausa) { avisar({ fin: true, pausada: true }); return; }
    // Con Instagram pidiendo esperar no se le pide nada, tampoco a mano:
    // insistir es lo que alarga el freno.
    if (S.rate && Date.now() < S.rate.until) { avisar({ fin: true, frenado: true }); return; }
    ocupado = true; S.error = null; S.parcial = false;
    var ahora = Date.now();
    try {
      var tot = (S.counts && S.counts.followers) || 0;
      progreso({ que: 'seguidores', n: 0, total: tot });
      var r = await ig('fetchList', ['followers'], function (n) { progreso({ que: 'seguidores', n: n, total: tot }); });
      var nuevos = (r && r.users || []).map(persona);
      var c = null;
      try { c = await ig('fetchProfileCounts', []); } catch (e) {}
      if (c) S.counts = c;
      var ant = S.followers && S.followers.users;
      var cf = c && Number(c.followers);
      // El mismo freno que la extension (content.js): lista incompleta, vacia
      // cuando el perfil dice que hay gente, o menos de la mitad que la vez
      // anterior. En cualquiera de los tres casos no se compara.
      if (!r || !r.complete || (cf > 0 && nuevos.length === 0) || (ant && ant.length > 20 && nuevos.length < ant.length * 0.5)) {
        S.parcial = true;
        S.parcialInfo = { recibidos: nuevos.length, total: cf || 0, completa: !!(r && r.complete) };
        registrar('lista a medias', { message: 'completa=' + !!(r && r.complete) + ' recibidos=' + nuevos.length + ' perfil=' + (cf || '?') });
        return;
      }
      var se = [], llegan = [];
      /* OJO CON ESTE IF. Antes decia `ant && ant.length`, y ahi estaba el
         fallo: una cuenta que empieza con CERO seguidores guarda una lista
         vacia, y `[].length` es 0, o sea falso. Resultado: el primer
         seguidor de tu vida no generaba evento y "Nuevos" seguia diciendo 0
         mientras la portada ya decia 1. Justo en el momento en que la app
         tiene que funcionar.
         Lo que hay que mirar no es si la lista de antes tenia gente, sino si
         hubo una revision antes. Y eso lo dice S.followers: si es null no
         hemos mirado nunca (y no se compara, o el primer escaneo anunciaria
         a TODOS tus seguidores como nuevos); si es una lista vacia, si
         miramos, y no habia nadie. De 0 a 1 es un seguidor nuevo. */
      if (ant) {
        var hoyM = new Map(nuevos.map(function (u) { return [u.pk, u]; }));
        var antM = new Map(ant.map(function (u) { return [u.pk, u]; }));
        antM.forEach(function (u, pk) { if (!hoyM.has(pk)) se.push(u); });
        hoyM.forEach(function (u, pk) { if (!antM.has(pk)) llegan.push(u); });
      }
      S.followers = { ts: ahora, users: nuevos };
      historia(nuevos.length);
      var evs = [];
      se.forEach(function (u) { evs.push(Object.assign({ type: 'unfollow', ts: ahora }, u)); });
      llegan.forEach(function (u) { evs.push(Object.assign({ type: 'new', ts: ahora }, u)); });
      if (evs.length) S.events = evs.concat(S.events).slice(0, 3000);
      /* El aviso. Solo lo habia de bajas: si alguien te empezaba a seguir no
         se enteraba nadie, y esa es justo la que apetece mirar. */
      if (se.length && esPro()) {
        Puente.nativo('notificar', {
          titulo: se.length === 1 ? '1 persona te dejó de seguir' : se.length + ' personas te dejaron de seguir',
          texto: se.slice(0, 5).map(function (u) { return '@' + u.username; }).join(', ')
        });
      }
      if (llegan.length && esPro()) {
        Puente.nativo('notificar', {
          titulo: llegan.length === 1 ? '@' + llegan[0].username + ' te sigue' : llegan.length + ' personas nuevas te siguen',
          texto: llegan.slice(0, 5).map(function (u) { return '@' + u.username; }).join(', ')
        });
      }

      if (manual || !S.following || ahora - (S.following.ts || 0) > SEGUIDOS_CADA) {
        var tg = (S.counts && S.counts.following) || 0;
        progreso({ que: 'seguidos', n: 0, total: tg });
        var g = await ig('fetchList', ['following'], function (n) { progreso({ que: 'seguidos', n: n, total: tg }); });
        if (g && (g.complete || !S.following)) S.following = { ts: Date.now(), users: (g.users || []).map(persona) };
      }
      progreso({ que: 'guardando' });
      await vigilarTodos().catch(function () {});
      if (esPro() && Date.now() - (S.stories.ts || 0) > HISTORIAS_CADA) await misHistorias().catch(function () {});
      if (S.reqRule !== 'manual' && esPro()) await aplicarRegla().catch(function () {});
      S.lastCheck = Date.now();
      S.rate = null;
    } catch (e) {
      S.error = { kind: e && e.kind, status: e && e.status, ts: Date.now() };
      registrar('revisar', e);
      /* Instagram ha puesto una restriccion o pide confirmar que eres tu. A
         partir de aqui insistir es lo peor que se puede hacer: la app se
         para sola y no vuelve a pedir nada hasta que lo digas tu. */
      if (e && (e.kind === 'challenge' || e.kind === 'auth')) {
        S.pausa = true;
        registrar('pausa automatica', { message: 'motivo=' + e.kind });
      }
      if (e && e.kind === 'rate') {
        var espera0 = 0;
        try { espera0 = await ig('rateLeftMs', []); } catch (x) {}
        var veces = (S.rate && S.rate.veces || 0) + 1;
        // 30 min, 1 h, 2 h... hasta 6 h: cada vez que vuelve a frenar, mas calma.
        S.rate = { status: e.status || 429, veces: veces, until: Date.now() + Math.max(espera0 || 0, Math.min(6, Math.pow(2, veces - 1) * 0.5) * 3600000) };
        // Dos frenos seguidos: Instagram esta limitando la cuenta. Se para
        // del todo y no se vuelve solo: lo decides tu.
        if (veces >= 2) S.pausa = true;
      }
      if (e && e.kind === 'auth') Puente.nativo('mostrarInstagram', {});
    } finally {
      S.nextCheck = Math.max(Date.now() + CADA, S.rate ? S.rate.until : 0);
      ocupado = false; fase = null;
      guardar(); avisar({ fin: true });
    }
  }
  function historia(n) {
    var h = S.history, x = { ts: Date.now(), followers: (S.counts && S.counts.followers) || n, following: S.counts && S.counts.following };
    if (h.length && dia(h[h.length - 1].ts) === dia(x.ts)) h[h.length - 1] = x; else h.push(x);
    S.history = h.slice(-365);
  }

  // Solo a mano, desde Ajustes: son cuatro peticiones.
  async function diagnosticar() {
    try { S.diag = Object.assign({ ts: Date.now() }, await ig('probar', [])); guardar(); avisar(); } catch (e) {}
  }

  /* ---------------- listas ---------------- */
  function unicos(tipo) {
    var vistos = {}, out = [];
    S.events.forEach(function (e) { if (e.type === tipo && !vistos[e.pk]) { vistos[e.pk] = 1; out.push(e); } });
    return out;
  }
  function noTeSiguen() {
    if (!S.following || !S.followers) return null;
    var f = new Set(S.followers.users.map(function (u) { return u.pk; }));
    return S.following.users.filter(function (u) { return !f.has(u.pk); });
  }
  function listas() {
    return { unfollow: unicos('unfollow'), new: unicos('new'), notback: noTeSiguen() };
  }

  /* ---------------- acciones que escriben ----------------
     Despacio y de una en una: Instagram frena a quien deja de seguir en
     rafaga, y el frenazo cae sobre tu cuenta, no sobre la app. */
  async function dejarDeSeguir(pks, cada) {
    if (!esPro()) throw { kind: 'pro' };
    var hechos = [];
    for (var i = 0; i < pks.length; i++) {
      try {
        await ig('unfollow', [pks[i]]);
        hechos.push(pks[i]);
        if (S.following) S.following.users = S.following.users.filter(function (u) { return u.pk !== pks[i]; });
        guardar(); if (cada) cada(i + 1, pks.length);
      } catch (e) {
        if (e && (e.kind === 'rate' || e.kind === 'challenge' || e.kind === 'auth')) { avisar(); throw e; }
      }
      if (i < pks.length - 1) await espera(azar(4000, 8000));
    }
    avisar();
    return hechos;
  }

  async function solicitudes() {
    var r = await ig('pendingRequests', []);
    S.reqs = { ts: Date.now(), users: (r && r.users || []).map(persona) };
    guardar(); avisar();
    return S.reqs.users;
  }
  async function responder(pk, si) {
    if (!esPro()) throw { kind: 'pro' };
    await ig(si ? 'approveRequest' : 'ignoreRequest', [pk]);
    if (S.reqs) S.reqs.users = S.reqs.users.filter(function (u) { return u.pk !== pk; });
    guardar(); avisar();
  }
  async function aceptarVarias(filtro) {
    var us = (S.reqs && S.reqs.users || []).filter(filtro || function () { return true; });
    for (var i = 0; i < us.length; i++) {
      await responder(us[i].pk, true);
      if (i < us.length - 1) await espera(azar(1500, 3500));
    }
  }
  async function aplicarRegla() {
    await solicitudes();
    if (S.reqRule === 'todas') return aceptarVarias();
    if (S.reqRule === 'sigo') {
      var sigo = new Set((S.following && S.following.users || []).map(function (u) { return u.pk; }));
      return aceptarVarias(function (u) { return sigo.has(u.pk); });
    }
  }
  function regla(r) { S.reqRule = r; guardar(); avisar(); if (r !== 'manual' && esPro()) aplicarRegla().catch(function () {}); }

  /* ---------------- vigilar (Actividad) ---------------- */
  function base(url) { return String(url || '').split('?')[0].split('/').pop(); }
  async function vigilar(nombre) {
    var u = await ig('fetchUserByUsername', [String(nombre || '').replace(/^@+/, '').trim()]);
    if (!u || !u.pk) throw { kind: 'no_existe' };
    if (S.watch.some(function (w) { return w.pk === String(u.pk); })) return u;
    if (!esPro() && S.watch.length >= LIBRE) throw { kind: 'pro' };
    S.watch.push({ pk: String(u.pk), username: u.username, full_name: u.full_name, pic: u.pic, bio: u.bio || '', is_private: !!u.is_private, desde: Date.now() });
    guardar(); avisar();
    vigilarTodos().then(function () { guardar(); avisar(); }).catch(function () {});
    return u;
  }
  /* BUSCAR GENTE MIENTRAS SE ESCRIBE.
     La extension lo tenia y la app no: habia que acertar el @ exacto de
     memoria. El metodo ya estaba permitido en el puente, solo faltaba usarlo.
     Se guarda lo ya buscado porque al escribir se repiten mucho los mismos
     principios de palabra, y cada busqueda es una peticion a Instagram. */
  /* DESDE LA PRIMERA LETRA, SIN PEDIR NADA.
     Tus seguidores y a quien sigues ya estan en el telefono: son miles de
     personas que se pueden buscar al instante y sin una sola peticion. Y son
     justo las que vas a querer vigilar. Va por delante de la busqueda de
     Instagram, que solo sirve para encontrar a alguien de fuera.
     Primero los que EMPIEZAN por lo escrito, luego los que lo llevan dentro:
     escribir "mar" tiene que sacar a Marta antes que a Ainmara. */
  function buscarLocal(q) {
    q = String(q || '').replace(/^@+/, '').trim().toLowerCase();
    if (!q) return [];
    var vistos = {}, empiezan = [], dentro = [];
    var fuentes = [(S.followers || {}).users, (S.following || {}).users, S.watch];
    for (var f = 0; f < fuentes.length; f++) {
      var lista = fuentes[f] || [];
      for (var i = 0; i < lista.length; i++) {
        var u = lista[i];
        if (!u || !u.username || vistos[u.pk]) continue;
        var us = String(u.username).toLowerCase();
        var nm = String(u.full_name || '').toLowerCase();
        if (us.indexOf(q) === 0 || nm.indexOf(q) === 0) { vistos[u.pk] = 1; empiezan.push(u); }
        else if (us.indexOf(q) > 0 || nm.indexOf(q) > 0) { vistos[u.pk] = 1; dentro.push(u); }
        if (empiezan.length >= 8) break;
      }
    }
    return empiezan.concat(dentro).slice(0, 8);
  }

  var cacheBusca = {};
  async function buscarGente(q) {
    q = String(q || '').replace(/^@+/, '').trim().toLowerCase();
    // Con una sola letra Instagram devuelve a los famosos del mundo, que no
    // es lo que busca nadie aqui. Lo local ya cubre esa primera letra.
    if (q.length < 2) return [];
    if (cacheBusca[q]) return cacheBusca[q];
    var r = await ig('searchUsers', [q]).catch(function () { return []; });
    var lista = (r || []).slice(0, 8);
    cacheBusca[q] = lista;
    // No se guarda para siempre: la gente cambia de nombre y de foto.
    setTimeout(function () { delete cacheBusca[q]; }, 10 * 60000);
    return lista;
  }

  /* EL EXPEDIENTE DE UNA PERSONA.
     Una sola peticion (la misma que usa la extension) y trae todo: bio,
     enlaces, cuantos sigue, cuantos le siguen, publicaciones, si es privada,
     verificada, de empresa, y el correo o telefono que haya puesto publicos.
     Se guarda 24 h: abrir a la misma persona dos veces no cuesta dos.
     Y hay tope diario, porque abrir perfiles en cadena es de las cosas que
     Instagram mira. */
  var EXP_DIA = 15;
  function expedientesHoy() {
    var n = 0, e = S.exp || {};
    Object.keys(e).forEach(function (k) { if (Date.now() - (e[k].ts || 0) < 86400000) n++; });
    return n;
  }
  function expedienteGuardado(pk) {
    var e = (S.exp || {})[String(pk)];
    return e && Date.now() - e.ts < 86400000 ? e.datos : null;
  }
  async function expediente(pk, username) {
    var ya = expedienteGuardado(pk);
    if (ya) return ya;
    if (expedientesHoy() >= EXP_DIA) throw { kind: 'tope_exp' };
    var d = await ig('fetchDossier', [pk || null, username || null]);
    if (!d || !d.username) throw { kind: 'no_existe' };
    /* Las publicaciones y las destacadas, en el MISMO boton: son dos
       peticiones mas, pero pedirlas por separado significaria que el usuario
       tiene que volver a pulsar y volver a esperar para ver media ficha.
       Con calma entre una y otra, que es lo que las hace parecer humanas.
       Si la cuenta es privada no dan nada, y no pasa nada: se enseña lo que
       haya.
       El "engagement" NO se pide: los me gusta y los comentarios vienen
       dentro de cada publicacion. Sale gratis. */
    var posts = [], destacadas = [];
    if (!d.is_private || (S.following && (S.following.users || []).some(function (u) { return String(u.pk) === String(d.pk); }))) {
      await espera(azar(700, 1400));
      posts = await ig('fetchUserPosts', [String(d.pk), 12]).catch(function () { return []; });
      if (d.has_highlights) {
        await espera(azar(700, 1400));
        destacadas = await ig('fetchHighlights', [String(d.pk)]).catch(function () { return []; });
      }
    }
    d.posts_lista = (posts || []).slice(0, 12);
    d.destacadas = (destacadas || []).slice(0, 10);
    if (!S.exp) S.exp = {};
    S.exp[String(pk || d.pk)] = { ts: Date.now(), datos: d };
    // No se guardan para siempre: se tiran los de mas de dos dias.
    Object.keys(S.exp).forEach(function (k) { if (Date.now() - S.exp[k].ts > 2 * 86400000) delete S.exp[k]; });
    guardar(); avisar();
    return d;
  }

  /* Las historias de una destacada. Una peticion, y se guarda: volver a
     abrir la misma destacada no cuesta otra. */
  var cacheDest = {};
  async function historiasDestacada(id) {
    var k = String(id);
    if (cacheDest[k] && Date.now() - cacheDest[k].ts < 3600000) return cacheDest[k].items;
    var items = await ig('fetchHighlightStories', ['highlight:' + k]).catch(function () { return []; });
    if (!items.length) items = await ig('fetchHighlightStories', [k]).catch(function () { return []; });
    cacheDest[k] = { ts: Date.now(), items: items || [] };
    return items || [];
  }

  /* Sus seguidores o a quien sigue. Una peticion por lista, se guarda una
     hora, y cuenta para el tope del dia: pedir la lista de mucha gente
     seguida es de lo que mas mira Instagram. */
  async function genteDe(pk, cual) {
    var k = cual + ':' + pk;
    if (!S.exp) S.exp = {};
    var g = S.exp[k];
    if (g && Date.now() - g.ts < 3600000) return g.datos;
    if (expedientesHoy() >= EXP_DIA) throw { kind: 'tope_exp' };
    var r = await ig(cual === 'seguidores' ? 'fetchFollowersOf' : 'fetchFollowingOf', [String(pk), null, 60]);
    var lista = (r && r.users || []).slice(0, 60);
    S.exp[k] = { ts: Date.now(), datos: lista };
    guardar(); avisar();
    return lista;
  }

  /* Todo lo que ya sabemos de alguien SIN pedir nada: de donde salio, si te
     sigue, si le sigues, y como se comporta con tus historias. */
  function loQueSe(username) {
    var u = String(username || '').replace(/^@+/, '').toLowerCase();
    function buscar(lista) {
      return (lista || []).filter(function (x) { return x && String(x.username).toLowerCase() === u; })[0];
    }
    var quien = buscar((S.followers || {}).users) || buscar((S.following || {}).users)
      || buscar(S.watch) || buscar(S.events) || buscar(S.activity);
    if (!quien) return null;
    var pk = String(quien.pk);
    var teSigue = !!buscar((S.followers || {}).users);
    var leSigues = !!buscar((S.following || {}).users);
    var vigilada = !!buscar(S.watch);
    var v = (S.stories.viewers || {})[pk] || null;
    var suyos = (S.events || []).filter(function (e) { return String(e.pk) === pk; });
    var cambios = (S.activity || []).filter(function (e) { return String(e.pk) === pk; });
    return {
      user: quien, pk: pk, teSigue: teSigue, leSigues: leSigues, vigilada: vigilada,
      historias: v ? { slides: v.slides, likes: v.likes, dias: (v.dias || []).length } : null,
      eventos: suyos.slice(0, 4), cambios: cambios.slice(0, 5)
    };
  }

  function dejarDeVigilar(pk) { S.watch = S.watch.filter(function (w) { return w.pk !== pk; }); guardar(); avisar(); }
  async function vigilarTodos() {
    for (var i = 0; i < S.watch.length && i < 30; i++) {
      var w = S.watch[i], u;
      try { u = await ig('fetchUserProfile', [w.pk]); } catch (e) { if (e && e.kind === 'rate') throw e; continue; }
      var cambios = [];
      if (u.full_name !== w.full_name) cambios.push({ type: 'name', from: w.full_name, to: u.full_name });
      if (u.username && u.username !== w.username) cambios.push({ type: 'username', from: '@' + w.username, to: '@' + u.username });
      if (base(u.pic) && base(w.pic) && base(u.pic) !== base(w.pic)) cambios.push({ type: 'photo' });
      if ((u.bio || '') !== (w.bio || '')) cambios.push({ type: 'bio' });
      cambios.forEach(function (c) {
        S.activity.unshift(Object.assign({ ts: Date.now(), pk: w.pk, username: u.username, full_name: u.full_name, pic: u.pic, is_private: !!u.is_private }, c));
      });
      Object.assign(w, { username: u.username, full_name: u.full_name, pic: u.pic, bio: u.bio || '', is_private: !!u.is_private });
      await espera(azar(900, 1800));
      /* A quien sigue: una vez al dia, hasta ~1.000 cuentas. Si es privada y no la
         sigues, Instagram no da la lista y simplemente no sale nada. */
      if (Date.now() - (w.sigueTs || 0) > SEGUIDOS_CADA) {
        try {
          var sg = await ig('fetchFollowingOf', [w.pk, null, 20]);
          if (sg && sg.users && sg.users.length && sg.complete) {
            var ahoraSet = {}, antes = w.sigue ? new Set(w.sigue) : null, hoyT = Date.now();
            sg.users.forEach(function (x) { ahoraSet[x.pk] = x; });
            if (antes) {
              sg.users.forEach(function (x) {
                if (!antes.has(String(x.pk))) S.activity.unshift({ ts: hoyT, type: 'follow_add', pk: w.pk, username: w.username, full_name: w.full_name, pic: w.pic, is_private: w.is_private, target: persona(x) });
              });
              antes.forEach(function (pk) {
                if (!ahoraSet[pk]) S.activity.unshift({ ts: hoyT, type: 'follow_rem', pk: w.pk, username: w.username, full_name: w.full_name, pic: w.pic, is_private: w.is_private, target: { pk: pk, username: (w.sigueNom || {})[pk] || pk } });
              });
            }
            w.sigue = sg.users.map(function (x) { return String(x.pk); });
            w.sigueNom = {}; sg.users.forEach(function (x) { w.sigueNom[x.pk] = x.username; });
            w.sigueTs = Date.now();
          }
        } catch (e) { if (e && e.kind === 'rate') throw e; registrar('seguidos de @' + w.username, e); }
        await espera(azar(1500, 3000));
      }
    }
    S.activity = S.activity.slice(0, 1000);
  }

  /* ---------------- historias ---------------- */
  async function bandeja() {
    var t = await ig('fetchReelsTray', []);
    S.tray = { ts: Date.now(), list: (t || []).map(function (x) {
      return Object.assign(persona(x), { reelId: x.reelId, count: x.count, latestTs: x.latestTs, unseen: x.unseen });
    }) };
    guardar(); avisar();
    return S.tray.list;
  }
  async function verHistorias(reelIds) {
    // Leer por la API no marca la historia como vista: no sales en su lista.
    return ig('fetchStoriesMany', [reelIds]);
  }
  async function misHistorias() {
    var items = await ig('getMyStoryItems', []);
    var st = S.stories;
    for (var i = 0; i < (items || []).length; i++) {
      var it = items[i], ya = st.items[it.mediaId];
      var vs = await ig('getStoryViewers', [it.mediaId]);
      vs.forEach(function (v) {
        var p = st.viewers[v.pk] || { user: persona(v), slides: 0, likes: 0, dias: [], media: [], last: 0 };
        p.user = persona(v);
        if (p.media.indexOf(it.mediaId) === -1) { p.media.push(it.mediaId); p.slides++; if (v.hasLiked) p.likes++; }
        var d = dia(it.takenAt); if (p.dias.indexOf(d) === -1) p.dias.push(d);
        p.last = Math.max(p.last, Date.now()); p.media = p.media.slice(-200);
        st.viewers[v.pk] = p;
      });
      st.items[it.mediaId] = { takenAt: it.takenAt, viewers: vs.length, likes: vs.filter(function (v) { return v.hasLiked; }).length, thumb: it.thumbUrl || (ya && ya.thumb) || '' };
      await espera(azar(600, 1200));
    }
    if (items && items.length) {
      var total = Object.keys(st.viewers).length;
      st.hist.push({ ts: Date.now(), viewers: items.reduce(function (a, it) { return Math.max(a, (st.items[it.mediaId] || {}).viewers || 0); }, 0), total: total });
      st.hist = st.hist.slice(-60);
    }
    st.ts = Date.now();
    guardar(); avisar();
    return items || [];
  }
  function ranking() {
    var v = S.stories.viewers;
    return Object.keys(v).map(function (k) { return v[k]; }).sort(function (a, b) {
      return b.slides - a.slides || b.likes - a.likes || b.dias.length - a.dias.length || b.last - a.last;
    });
  }

  /* ---------------- interacciones (Amigos) ---------------- */
  async function interacciones(cada) {
    var posts = await ig('fetchUserPosts', [S.yo, 12]).catch(function () { return []; });
    var likes = new Map, coms = new Map, gente = new Map;
    for (var i = 0; i < posts.length; i++) {
      if (cada) cada(i + 1, posts.length);
      var id = posts[i].id; if (!id) continue;
      try { (await ig('fetchPostLikers', [id])).forEach(function (u) { likes.set(u.pk, (likes.get(u.pk) || 0) + 1); gente.set(u.pk, persona(u)); }); }
      catch (e) { if (e && e.kind === 'rate') break; }
      await espera(350);
      try {
        var una = new Set;
        (await ig('fetchPostComments', [id])).forEach(function (u) { if (una.has(u.pk)) return; una.add(u.pk); coms.set(u.pk, (coms.get(u.pk) || 0) + 1); gente.set(u.pk, persona(u)); });
      } catch (e) { if (e && e.kind === 'rate') break; }
      await espera(350);
    }
    function top(m) { return Array.from(m.entries()).map(function (x) { return { user: gente.get(x[0]), n: x[1] }; })
      .filter(function (x) { return x.user && x.user.pk !== S.yo; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 20); }
    S.inter = { likers: top(likes), commenters: top(coms), posts: posts.length, ts: Date.now() };
    guardar(); avisar();
    return S.inter;
  }

  /* ---------------- ¿se siguen? ---------------- */
  async function seSiguen(a, b) {
    a = String(a || '').replace(/^@+/, '').trim(); b = String(b || '').replace(/^@+/, '').trim();
    var ua = await ig('fetchUserByUsername', [a]), ub = await ig('fetchUserByUsername', [b]);
    var ab = await ig('checkFollows', [ua.pk, ub.username]).catch(function (e) { if (e && e.kind === 'rate') throw e; return null; });
    var ba = await ig('checkFollows', [ub.pk, ua.username]).catch(function (e) { if (e && e.kind === 'rate') throw e; return null; });
    return { a: persona(ua), b: persona(ub), ab: ab, ba: ba };
  }

  // Al arrancar, una sola vez: rehacer los "Nuevos" que se perdio el fallo.
  repararNuevos();
  repararLicencia();

  /* ---------------- reloj ---------------- */
  /* Por defecto la app NO revisa sola: solo cuando tu pulsas. Las revisiones
     automaticas se encienden en Ajustes, y aun encendidas van una vez al dia.
     Es lo que hace que la app no pueda molestar a Instagram por su cuenta. */
  setInterval(function () {
    if (S.auto && S.yo && !ocupado && !S.pausa && Date.now() >= (S.nextCheck || 0)) revisar(false);
  }, 60000);

  return {
    get estado() { return S; }, get ocupado() { return ocupado; }, get fase() { return fase; },
    LIBRE: LIBRE, on: on, registrar: registrar, diagnosticar: diagnosticar,
    automatico: function (v) { S.auto = !!v; guardar(); avisar(); },
    pausar: function (v) { S.pausa = !!v; if (!v) { S.rate = null; S.error = null; } guardar(); avisar(); }, guardar: guardar, avisar: avisar, sesion: sesion,
    esPro: esPro, activar: activar, reverificar: reverificar,
    revisar: revisar, faltaParaRevisar: faltaParaRevisar, CADA: CADA,
    cataQueda: cataQueda, gastarCata: gastarCata, sesionesHoy: sesionesHoy,
    buscarGente: buscarGente, buscarLocal: buscarLocal,
    expediente: expediente, expedienteGuardado: expedienteGuardado, expedientesHoy: expedientesHoy, EXP_DIA: EXP_DIA,
    historiasDestacada: historiasDestacada, genteDe: genteDe,
    loQueSe: loQueSe,
    listas: listas, dejarDeSeguir: dejarDeSeguir,
    solicitudes: solicitudes, responder: responder, aceptarVarias: aceptarVarias, regla: regla,
    vigilar: vigilar, dejarDeVigilar: dejarDeVigilar,
    bandeja: bandeja, verHistorias: verHistorias, misHistorias: misHistorias, ranking: ranking,
    interacciones: interacciones, seSiguen: seSiguen
  };
})();

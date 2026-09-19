/* Ghoosted — el motor de la app.
 *
 * Hace lo mismo que la extension en revisar() (content.js, YL): pide tus
 * seguidores, los compara con la foto anterior y apunta quien se fue y quien
 * llego. La lista de seguidos se refresca cada 6 h o cuando lo pides tu. Si
 * la lista vuelve a medias (Instagram corta a veces) NO se compara: sin ese
 * freno, una lista cortada sacaba a medio mundo como "te dejo de seguir".
 *
 * Todo se guarda en el telefono (localStorage de la vista del diseño). Nada
 * sale de aqui salvo la clave de licencia, que se comprueba en ghoosted.net. */
window.Motor = (function () {
  'use strict';
  var CLAVE = 'ghd_app_v1';
  var CADA = 30 * 60000;            // "Reviso solo cada 30 min"
  var SEGUIDOS_CADA = 6 * 3600000;  // la lista de seguidos pesa: cada 6 h
  var HISTORIAS_CADA = 30 * 60000;
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
    return Object.assign({
      yo: null, followers: null, following: null, counts: null, events: [], history: [],
      watch: [], activity: [], stories: { viewers: {}, items: {}, hist: [], ts: 0 },
      reqRule: 'manual', reqs: null, tray: null, inter: null, lastCheck: 0, nextCheck: 0,
      rate: null, error: null, lic: null, intro: false, parcial: false, log: []
    }, s || {});
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
  async function reverificar() {
    var l = S.lic;
    if (!l || !l.key || Date.now() - (l.vts || 0) < 24 * 3600000) return;
    var r = await post(LIC_API + 'verify', { key: l.key, accountId: S.yo, product: 'pro' });
    var j = r && r.json;
    // Solo cambia si el servidor contesta algo claro: sin red, se queda como estaba.
    if (j && typeof j.valid === 'boolean') { S.lic = Object.assign({}, l, j, { vts: Date.now() }); guardar(); avisar(); }
  }

  /* ---------------- sesion ---------------- */
  function sesion(s) {
    if (!s) return;
    var antes = S.yo;
    S.yo = s.conectado ? String(s.yo) : null;
    if (antes && S.yo && antes !== S.yo) {
      // Otra cuenta: lo guardado era de la anterior y no se mezcla.
      var lic = S.lic, intro = S.intro;
      S = cargar(); localStorage.removeItem(CLAVE); S = Object.assign(cargar(), { yo: s.yo, lic: lic, intro: intro });
    }
    guardar(); avisar({ sesion: true });
  }

  /* ---------------- la revision ---------------- */
  function progreso(f) { fase = f; avisar({ fase: f }); }

  async function revisar(manual) {
    if (ocupado || !S.yo) return;
    // Con Instagram pidiendo esperar no se le pide nada, tampoco a mano:
    // insistir es lo que alarga el freno.
    if (S.rate && Date.now() < S.rate.until) { avisar({ frenado: true }); return; }
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
        diagnosticar();
        return;
      }
      var se = [], llegan = [];
      if (ant && ant.length) {
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
      if (se.length && esPro()) {
        Puente.nativo('notificar', {
          titulo: se.length === 1 ? '1 persona te dejó de seguir' : se.length + ' personas te dejaron de seguir',
          texto: se.slice(0, 5).map(function (u) { return '@' + u.username; }).join(', ')
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
      diagnosticar();
      if (e && e.kind === 'rate') {
        var espera0 = 0;
        try { espera0 = await ig('rateLeftMs', []); } catch (x) {}
        var veces = (S.rate && S.rate.veces || 0) + 1;
        // 30 min, 1 h, 2 h... hasta 6 h: cada vez que vuelve a frenar, mas calma.
        S.rate = { status: e.status || 429, veces: veces, until: Date.now() + Math.max(espera0 || 0, Math.min(6, Math.pow(2, veces - 1) * 0.5) * 3600000) };
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

  async function diagnosticar() {
    if (S.diag && Date.now() - S.diag.ts < 6 * 3600000) return;
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
      /* A quien sigue: cada 6 h, hasta ~1.000 cuentas. Si es privada y no la
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

  /* ---------------- reloj ---------------- */
  setInterval(function () {
    if (S.yo && !ocupado && Date.now() >= (S.nextCheck || 0)) revisar(false);
  }, 60000);

  return {
    get estado() { return S; }, get ocupado() { return ocupado; }, get fase() { return fase; },
    LIBRE: LIBRE, on: on, registrar: registrar, diagnosticar: diagnosticar, guardar: guardar, avisar: avisar, sesion: sesion,
    esPro: esPro, activar: activar, reverificar: reverificar,
    revisar: revisar, listas: listas, dejarDeSeguir: dejarDeSeguir,
    solicitudes: solicitudes, responder: responder, aceptarVarias: aceptarVarias, regla: regla,
    vigilar: vigilar, dejarDeVigilar: dejarDeVigilar,
    bandeja: bandeja, verHistorias: verHistorias, misHistorias: misHistorias, ranking: ranking,
    interacciones: interacciones, seSiguen: seSiguen
  };
})();

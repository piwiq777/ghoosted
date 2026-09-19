/* Ghoosted — puente entre el diseño y la vista de Instagram.
 *
 * Puente.ig('fetchList', ['followers'], progreso) manda la llamada a la otra
 * vista (la de instagram.com, donde vive tu sesion) y devuelve una promesa.
 * Puente.nativo('mostrarInstagram') pide cosas al telefono: enseñar la vista
 * de Instagram para iniciar sesion, abrir un enlace, compartir...
 *
 * Sin telefono (abriendo index.html en un navegador, con ?demo) todo sale de
 * datos de ejemplo, para poder ver el diseño sin instalar nada. */
window.Puente = (function () {
  'use strict';
  var pend = {}, n = 0, oyentes = [];
  var DEMO = /[?&#]demo\b/.test(location.href) || !(window.GhdNativo || (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ghd));

  function enviar(obj) {
    var s = JSON.stringify(obj);
    if (window.GhdNativo) window.GhdNativo.enviar(s);
    else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ghd) window.webkit.messageHandlers.ghd.postMessage(s);
  }

  function ig(metodo, args, progreso) {
    if (DEMO) return window.Demo.ig(metodo, args || [], progreso);
    return new Promise(function (ok, ko) {
      var id = 'c' + (++n);
      var t = setTimeout(function () {
        if (!pend[id]) return;
        delete pend[id];
        ko({ kind: 'network', message: 'timeout' });
      }, 240000);
      pend[id] = { ok: ok, ko: ko, progreso: progreso, t: t };
      enviar({ tipo: 'llamar', id: id, metodo: metodo, args: args || [] });
    });
  }

  function nativo(orden, datos) {
    if (DEMO) return window.Demo.nativo(orden, datos || {});
    return new Promise(function (ok) {
      var id = 'n' + (++n);
      pend[id] = { ok: ok, ko: ok, t: setTimeout(function () { if (pend[id]) { delete pend[id]; ok(null); } }, 30000) };
      enviar({ tipo: 'nativo', id: id, orden: orden, datos: datos || {} });
    });
  }

  // Lo llama el telefono con lo que contesta la vista de Instagram o el propio
  // telefono. Todo lo que llega aqui se trata como datos de un tercero.
  function recibir(s) {
    var m;
    try { m = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.tipo === 'progreso') {
      var p = pend[m.id];
      if (p && p.progreso) try { p.progreso(m.n); } catch (e) {}
      return;
    }
    if (m.tipo === 'resultado') {
      var q = pend[m.id];
      if (!q) return;
      delete pend[m.id];
      clearTimeout(q.t);
      if (m.ok) q.ok(m.valor); else q.ko(m.error || { kind: 'other' });
      return;
    }
    oyentes.forEach(function (f) { try { f(m); } catch (e) {} });
  }
  function escuchar(f) { oyentes.push(f); }

  return { ig: ig, nativo: nativo, recibir: recibir, escuchar: escuchar, demo: DEMO };
})();

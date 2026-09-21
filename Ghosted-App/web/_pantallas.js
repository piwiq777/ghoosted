/* Recorre TODAS las pantallas de la app con datos de ejemplo y avisa si
 * alguna pinta basura: "undefined", "NaN", "[object Object]" o se queda en
 * blanco. Es la prueba que faltaba cuando en el movil salio un "undefined"
 * suelto debajo del logo.
 *
 * Se ejecuta pegandolo en la consola de la pagina (o desde las herramientas
 * del navegador):  await Pantallas.todo()
 */
window.Pantallas = (function () {
  'use strict';
  var esperar = function (ms) { return new Promise(function (r) { setTimeout(r, ms || 260); }); };
  var q = function (sel) { return document.querySelector(sel); };
  var BASURA = ['undefined', 'NaN', '[object Object]', 'null·', '· null'];

  function mirar(nombre, fallos) {
    var t = document.body.innerText || '';
    BASURA.forEach(function (b) { if (t.indexOf(b) !== -1) fallos.push(nombre + ': sale "' + b + '"'); });
    if (t.trim().length < 12) fallos.push(nombre + ': pantalla vacía');
    var rotos = document.querySelectorAll('[data-a=""],[data-tab=""]');
    if (rotos.length) fallos.push(nombre + ': ' + rotos.length + ' botón(es) sin acción');
    return t.slice(0, 60).replace(/\n+/g, ' | ');
  }

  async function pulsar(sel) { var e = q(sel); if (e) { e.click(); await esperar(); } return !!e; }

  async function todo() {
    var fallos = [], vistas = [];
    var S = Motor.estado;
    async function paso(nombre, preparar) {
      await preparar();
      await esperar();
      vistas.push(nombre + ' → ' + mirar(nombre, fallos));
    }

    // --- presentación y entrada
    try { localStorage.removeItem('ghd_app_v1'); } catch (e) {}
    location.hash = '';
    await paso('intro 1', async function () { S.intro = false; S.yo = null; Motor.avisar(); });
    for (var i = 2; i <= 4; i++) await paso('intro ' + i, function () { return pulsar('[data-a=intro-sig]'); });
    await paso('entrar', function () { return pulsar('[data-a=intro-sig]'); });
    await paso('sesión', function () { return pulsar('[data-a=login]'); });
    await esperar(9000);
    await paso('hoy con datos', async function () {});

    // --- pestañas
    for (var t of ['personas', 'historias', 'actividad', 'historial']) {
      await paso(t, function () { return pulsar('[data-tab=' + t + ']'); });
    }
    await paso('personas · nuevos', async function () { await pulsar('[data-tab=personas]'); await pulsar('[data-seg="new"]'); });
    await paso('personas · no te siguen', function () { return pulsar('[data-seg=notback]'); });
    await paso('actividad · solicitudes', async function () { await pulsar('[data-tab=actividad]'); await pulsar('[data-act=solicitudes]'); });
    await paso('historial · interacciones', async function () { await pulsar('[data-tab=historial]'); await pulsar('[data-hist=interacciones]'); });
    await paso('historial · hombres y mujeres', async function () { await pulsar('[data-hist=resumen]'); await pulsar('[data-gen=following]'); });

    // --- hojas
    await paso('hoja Pro', async function () { await pulsar('[data-tab=hoy]'); await pulsar('[data-a=pro]'); });
    await paso('hoja clave', function () { return pulsar('[data-a=tengo-clave]'); });
    await paso('ajustes', async function () { await pulsar('[data-a=cerrar-hoja]'); await pulsar('[data-a=ajustes]'); });
    await paso('diagnóstico', function () { return pulsar('[data-a=diag]'); });
    await paso('espectadores', async function () { await pulsar('[data-a=cerrar-hoja]'); await pulsar('[data-tab=historial]'); await pulsar('[data-a=espectadores]'); });
    await pulsar('[data-a=cerrar-hoja]');

    // --- estados raros de Hoy
    await pulsar('[data-tab=hoy]');
    await paso('hoy · aviso de versión', async function () { Puente.recibir({ tipo: 'actualizacion', web: true }); });
    await paso('hoy · Instagram frenando', async function () { S.rate = { status: 401, until: Date.now() + 600000 }; Motor.avisar(); });
    await paso('hoy · sin datos y frenado', async function () { S.followers = null; Motor.avisar(); });
    await paso('hoy · en pausa', async function () { Motor.pausar(true); });
    await paso('hoy · error suelto', async function () { Motor.pausar(false); S.rate = null; S.error = { kind: 'transport', status: 0 }; Motor.avisar(); });
    await paso('hoy · lista a medias', async function () { S.error = null; S.parcial = true; S.parcialInfo = { recibidos: 0, total: 475, completa: false }; S.followers = { ts: Date.now(), users: [] }; Motor.avisar(); });

    console.log(vistas.join('\n'));
    return { fallos: fallos, vistas: vistas.length };
  }
  return { todo: todo };
})();

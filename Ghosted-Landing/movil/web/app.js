/* Ghoosted — las pantallas.
 *
 * Cada pantalla es una funcion que devuelve HTML con las mismas piezas del
 * lienzo (clases de app.css). Todo lo que viene de Instagram —nombres, @,
 * bios— lo escribe un tercero y pasa por esc() antes de pintarse. */
(function () {
  'use strict';
  var M = window.Motor, P = window.Puente;
  var $app = document.getElementById('app');

  /* ---------------- utilidades ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function num(n) { return Number(n || 0).toLocaleString('es-ES'); }
  function hace(ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (m < 1) return 'ahora'; if (m < 60) return m + ' min'; if (h < 24) return h + ' h'; if (d < 7) return d + ' d';
    return Math.floor(d / 7) + ' sem';
  }
  function hora(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function iniciales(p) {
    var w = String(p.full_name || '').trim().split(/\s+/).filter(Boolean);
    function primera(x) { return Array.from(x)[0] || ''; }
    if (w.length >= 2) return (primera(w[0]) + primera(w[1])).toUpperCase();
    if (w.length === 1) return primera(w[0]).toUpperCase();
    return (String(p.username || '?').replace(/[^a-z0-9]/gi, '')[0] || '?').toUpperCase();
  }
  // Pasteles del lienzo: [fondo claro, letra clara, letra en oscuro]
  var TONOS = [['#EAE2FD', '#5436AE', '#C9A8FF'], ['#DDEBFF', '#27528F', '#9CC7FF'], ['#DCF2E5', '#1B6640', '#8EE3B3'],
               ['#FFE8D4', '#91431A', '#FFC08F'], ['#FDE3EC', '#A8215C', '#F2A7C4'], ['#F1E3FA', '#723390', '#E2B2F7']];
  function tono(u) { var h = 0, s = String(u || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return TONOS[h % TONOS.length]; }
  // Las fotos de Instagram no se cargan tal cual desde esta vista: las pide el
  // telefono por detras (Instagram las sirve solo a su propia web).
  function foto(url) {
    if (!url || P.demo) return '';
    if (window.GhdNativo) return 'https://appassets.androidplatform.net/foto?u=' + encodeURIComponent(url);
    return 'ghdfoto://f?u=' + encodeURIComponent(url);
  }
  function av(p, cls) {
    var t = tono(p.username), f = foto(p.pic);
    return '<div class="av' + (cls ? ' ' + cls : '') + '" aria-hidden="true" style="--a:' + t[0] + ';--b:' + t[1] + ';--c:' + t[2] + '">' +
      esc(iniciales(p)) + (f ? '<img alt="" src="' + esc(f) + '" onerror="this.remove()">' : '') + '</div>';
  }
  var VERIF = '<span class="verif"><svg width="15" height="15" viewBox="0 0 24 24" aria-label="Verificado" role="img"><path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-.9 2.8.9 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 16l.9-2.8-.9-2.8 2.5-1.7.9-2.9 3 .2z" fill="#3B82F6"/><path d="M8.5 12.2l2.3 2.3 4.7-4.7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  function ico(d, t, w) { return '<svg width="' + (t || 22) + '" height="' + (t || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var I = {
    hoy: '<circle cx="7.5" cy="12" r="4.5"/><circle cx="16.5" cy="12" r="4.5"/><circle cx="8.8" cy="12" r="1" fill="currentColor"/><circle cx="17.8" cy="12" r="1" fill="currentColor"/>',
    personas: '<circle cx="9" cy="8" r="3.6"/><path d="M2.8 19.5c.6-3.4 3.1-5.5 6.2-5.5s5.6 2.1 6.2 5.5"/><path d="M15.5 4.8a3.4 3.4 0 0 1 0 6.4"/><path d="M18.2 14.3c1.7.8 2.8 2.6 3.1 5.2"/>',
    historias: '<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4"/>',
    actividad: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
    historial: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5v4h4"/><path d="M12 8v4.5l3 2"/>',
    ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1v.5"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor"/>',
    revisar: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    nuevo: '<circle cx="10" cy="8" r="4"/><path d="M3.5 20c0-3.6 2.9-6 6.5-6"/><path d="M19 14v6"/><path d="M16 17h6"/>',
    fuera: '<circle cx="10" cy="8" r="4"/><path d="M3.5 20c0-3.6 2.9-6 6.5-6"/><path d="M16 17h6"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    x: '<path d="M7 7l10 10"/><path d="M17 7L7 17"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cambio: '<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/>',
    alerta: '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor"/><path d="M10.3 3.9L2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    reloj_arena: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3v3.5a4 4 0 0 0 1.6 3.2L12 12l2.4-2.3A4 4 0 0 0 16 6.5V3"/><path d="M8 21v-3.5a4 4 0 0 1 1.6-3.2L12 12l2.4 2.3a4 4 0 0 1 1.6 3.2V21"/>',
    camara: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
    reloj: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 7v5l3 2"/>',
    candado: '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    menos: '<path d="M6 12h12"/>', mas: '<path d="M12 6v12"/><path d="M6 12h12"/>',
    flecha: '<path d="M4 12h14"/><path d="M13 6.5L18.5 12 13 17.5"/>',
    corazon: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    bocadillo: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/>',
    cerrar: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
  };
  function wm(p20) {
    return '<div class="wm' + (p20 ? ' p20' : '') + '" role="img" aria-label="ghoosted"><span>gh</span><span class="ojos"><span aria-hidden="true"><span></span></span><span aria-hidden="true"><span></span></span></span><span>sted</span></div>';
  }
  var toastT = 0;
  function toast(t) {
    var el = document.getElementById('toast');
    el.textContent = t; el.classList.add('ver');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('ver'); }, 2800);
  }
  function errTxt(e) {
    var k = e && e.kind;
    if (k === 'pro') return 'Esto es de Pro';
    if (k === 'rate') return 'Instagram pidió esperar un poco';
    if (k === 'challenge') return 'Instagram pide que confirmes que eres tú';
    if (k === 'auth') return 'Tienes que volver a iniciar sesión';
    if (k === 'no_existe') return 'No encuentro esa cuenta';
    var msg = String(e && e.message || '');
    if (msg.indexOf('tope_') === 0) return 'Me he frenado solo para no molestar a Instagram. Prueba dentro de un rato';
    if (k === 'network' || k === 'transport') return 'Instagram no contesta, prueba otra vez';
    var m = e && (e.reason || e.message);
    return 'No se ha podido hacer' + (m ? ' · ' + String(m).slice(0, 60) : '');
  }

  window.addEventListener('error', function (ev) { M.registrar('js', { message: (ev.message || '') + ' @' + (ev.lineno || '') }); toast('Error: ' + String(ev.message || '').slice(0, 70)); });
  window.addEventListener('unhandledrejection', function (ev) { M.registrar('promesa', ev.reason || {}); });

  /* ---------------- estado de la interfaz ---------------- */
  var U = { tab: 'hoy', paso: 1, cargando: false, seg: 'unfollow', busca: '', sel: null, act: 'cambios', hist: 'resumen',
            hojaAbierta: null, buscaHis: '', ab: null, calc: null, visor: null, trabajando: {} };

  function tema(t) {
    if (t) try { localStorage.setItem('ghd_tema', t); } catch (e) {}
    var g = null; try { g = localStorage.getItem('ghd_tema'); } catch (e) {}
    var osc = g === 'oscuro' || (g !== 'claro' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    if (osc) document.documentElement.setAttribute('data-tema', 'oscuro'); else document.documentElement.removeAttribute('data-tema');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', osc ? '#09090B' : '#F6F5F8');
    P.nativo('tema', { oscuro: osc });
  }
  tema();
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { tema(); });

  /* ---------------- presentacion ---------------- */
  function puntos(n) {
    var s = '';
    for (var i = 1; i <= 4; i++) s += '<span' + (i === n ? ' class="on"' : '') + '></span>';
    return '<div class="puntos" role="img" aria-label="Paso ' + n + ' de 4">' + s + '</div>';
  }
  function intro() {
    var n = U.paso, medio = '', boton = n < 4 ? 'Siguiente' : '¡Vamos!';
    if (n === 1) medio = '<div class="intro-medio centro"><div class="icono-caja"><div class="icono" aria-hidden="true"><div></div><span><span></span></span><span><span></span></span></div>' +
      '<div class="pega-abs"><span class="pega">sin contraseña</span></div></div>' +
      '<div class="titulo"><h1>Hola, soy ghoosted</h1><p>Te digo quién te deja de seguir. Todo se queda en tu dispositivo.</p></div></div>';
    if (n === 2) medio = '<div class="intro-medio"><div style="display:flex;justify-content:center"><div class="cuadro vidrio" aria-hidden="true">' + ico(I.camara, 44, 1.6) + '</div></div>' +
      '<div class="titulo"><h1>Primero hago una foto</h1><p>Así tengo con qué comparar la próxima vez.</p></div>' +
      '<div class="pasos"><div class="paso vidrio"><span class="num">1</span><div>Hoy apunto a tus seguidores.</div></div>' +
      '<div class="paso vidrio"><span class="num">2</span><div>Desde la próxima revisión, te digo quién se fue.</div></div></div></div>';
    if (n === 3) {
      var celdas = [[I.menos, 'var(--rosa-txt)', 'Te dejaron', 'Quién te dejó de seguir'], [I.mas, 'var(--verde-ico)', 'Nuevos', 'Quién empezó a seguirte'],
        [I.flecha, 'var(--ink)', 'No te siguen', 'No te devuelven el follow'], [I.historias, 'var(--ink)', 'Historias', 'Verlas sin salir en la lista'],
        [I.actividad, 'var(--ink)', 'Actividad', 'Cambios de foto, nombre o bio'], [I.corazon, 'var(--rosa-txt)', 'Amigos', 'Quién más interactúa contigo'],
        [I.historial, 'var(--ink)', 'Historial', 'Quién vio tus historias']];
      medio = '<div class="intro-medio g24"><div class="titulo"><h1>Cada pestaña, de un vistazo</h1></div><div class="rejilla">' +
        celdas.map(function (c) { return '<div class="celda vidrio"><span style="color:' + c[1] + '">' + ico(c[0], 22) + '</span><div><b>' + c[2] + '</b><i>' + c[3] + '</i></div></div>'; }).join('') + '</div></div>';
    }
    if (n === 4) medio = '<div class="intro-medio"><div style="display:flex;justify-content:center"><div class="cuadro ig" aria-hidden="true">' + ico(I.ok, 44, 2) + '</div></div>' +
      '<div class="titulo"><h1>Tú no tienes que hacer nada</h1></div><div class="pasos">' +
      '<div class="paso vidrio"><span class="pi vidrio" aria-hidden="true">' + ico(I.revisar, 22) + '</span><div>Reviso solo cada 30 min con Instagram abierto.</div></div>' +
      '<div class="paso vidrio"><span class="pi vidrio" aria-hidden="true">' + ico(I.reloj, 22) + '</span><div>Voy con calma para que Instagram no te frene.</div></div>' +
      '<div class="paso vidrio"><span class="pi vidrio" aria-hidden="true">' + ico(I.candado, 22) + '</span><div>Sin contraseña. Tus datos no salen de tu dispositivo.</div></div></div></div>';
    return '<div class="intro"><div class="intro-top">' + wm(true) + (n < 4 ? '<button class="saltar" data-a="intro-fin">Saltar</button>' : '') + '</div>' + medio +
      '<div class="intro-bajo">' + puntos(n) + '<div class="fila-btn"><button class="negro grande" data-a="intro-sig">' + boton + '</button></div></div></div>';
  }
  var relojCarga = 0;
  function cargando() {
    var f = M.fase || {}, n = f.n || 0, tot = f.total || 0;
    // Si algo se atasca, esta pantalla no se queda dando vueltas para siempre.
    clearTimeout(relojCarga);
    relojCarga = setTimeout(function () {
      if (!U.cargando) return;
      U.cargando = false;
      pintar();
      if (!M.estado.followers) toast('No he podido terminar. Prueba «Revisar ahora»');
    }, 180000);
    var que = f.que === 'seguidos' ? 'Cargando seguidos' : f.que === 'guardando' ? 'Guardando la foto' : 'Cargando seguidores';
    var pc = tot ? Math.min(100, Math.round(n / tot * 100)) : (f.que === 'guardando' ? 100 : 6);
    return '<div class="intro"><div class="intro-top centro">' + wm(true) + '</div><div class="intro-medio g28">' +
      '<div class="icono p112" aria-hidden="true"><div></div><span><span></span></span><span><span></span></span></div>' +
      '<div class="carga-txt"><div>' + que + '</div><div class="carga-n">' + num(n) + '</div></div>' +
      '<div class="barra-p vidrio" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso"><div style="width:' + pc + '%"></div></div>' +
      '<div class="carga-pie">Un momento, esto puede tardar</div></div>' +
      '<button class="inicio" data-a="ir-inicio">Ir al inicio</button></div>';
  }
  function sinSesion() {
    // Antes de abrir Instagram se explica que va a pasar: sin esto, la app
    // saltaba a la pagina de Instagram sin decir nada.
    var pasos = [['1', 'Se abre Instagram dentro de la app. Es su página oficial.'],
                 ['2', 'Entra con tu usuario y contraseña, como siempre.'],
                 ['3', 'En cuanto entres, vuelves aquí solo y hago la primera foto.']];
    return '<div class="intro"><div class="intro-top">' + wm(true) + '</div><div class="intro-medio">' +
      '<div style="display:flex;justify-content:center"><div class="icono-caja"><div class="icono" aria-hidden="true"><div></div><span><span></span></span><span><span></span></span></div>' +
      '<div class="pega-abs"><span class="pega">sin contraseña</span></div></div></div>' +
      '<div class="titulo"><h1>Conecta tu Instagram</h1><p>Tu contraseña va a Instagram, nunca a Ghoosted. Yo solo leo lo que Instagram te enseña a ti.</p></div>' +
      '<div class="pasos">' + pasos.map(function (x) { return '<div class="paso vidrio"><span class="num">' + x[0] + '</span><div>' + x[1] + '</div></div>'; }).join('') + '</div></div>' +
      '<div class="intro-bajo"><div class="fila-btn"><button class="negro grande" data-a="login">Entrar con Instagram</button></div></div></div>';
  }

  /* ---------------- barra de pestañas ---------------- */
  var TABS = [['hoy', 'Hoy'], ['personas', 'Personas'], ['historias', 'Historias'], ['actividad', 'Actividad'], ['historial', 'Historial']];
  /* La barra se pinta UNA vez y luego solo se le mueve la capsula. Si se
     volviera a pintar entera en cada cambio, el navegador estrenaria los
     elementos y no habria animacion que valga. */
  function barra() {
    return '<div class="velo" aria-hidden="true"></div><nav class="tabs vidrio" id="tabs" aria-label="Secciones"><span class="capsula" aria-hidden="true"></span>' +
      TABS.map(function (x) {
        return '<button data-tab="' + x[0] + '"' + (U.tab === x[0] ? ' class="on" aria-current="page"' : '') + '><i class="ti">' + ico(I[x[0]], 22) + '</i><span>' + x[1] + '</span></button>';
      }).join('') + '</nav>';
  }
  function moverCapsula(animar) {
    var nav = document.getElementById('tabs');
    if (!nav) return;
    var i = TABS.map(function (x) { return x[0]; }).indexOf(U.tab);
    var cap = nav.querySelector('.capsula');
    cap.style.transform = 'translateX(calc(' + i + ' * (100% + 2px)))';
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b, k) {
      var on = TABS[k][0] === U.tab;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      if (on && animar) { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }
    });
    if (animar) { cap.classList.remove('liquida'); void cap.offsetWidth; cap.classList.add('liquida'); }
  }
  function cabecera(t, extra) { return '<div class="cabecera"><h1>' + t + '</h1><div style="display:flex;gap:10px">' + (extra || '') + '</div></div>'; }
  /* Los selectores de arriba llevan la misma pieza que la barra de abajo: una
     capsula que viaja y se estira. Como el cuerpo se repinta entero, la
     posicion anterior se guarda aqui y la animacion se lanza a mano (si no,
     el navegador estrena la capsula ya colocada y no se mueve nada). */
  var segAnterior = {};
  function segs(lista, activo, attr, plano) {
    var i = Math.max(0, lista.map(function (x) { return x[0]; }).indexOf(activo));
    return '<div class="segs ' + (plano ? 'plano' : 'vidrio') + '" role="group" data-grupo="' + attr + '" data-n="' + lista.length + '" data-i="' + i + '">' +
      '<span class="s-cap" aria-hidden="true" style="width:calc((100% - 8px - ' + (lista.length - 1) * 2 + 'px) / ' + lista.length + ')"></span>' +
      lista.map(function (s) {
        var on = s[0] === activo;
        return '<button data-' + attr + '="' + s[0] + '" aria-pressed="' + on + '"' + (on ? ' class="on"' : '') + '>' + s[1] + (s[2] != null ? '<span>' + num(s[2]) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
  }
  function colocarSegs() {
    Array.prototype.forEach.call(document.querySelectorAll('.segs'), function (g) {
      var grupo = g.getAttribute('data-grupo'), i = Number(g.getAttribute('data-i')) || 0;
      var cap = g.querySelector('.s-cap');
      if (!cap) return;
      var antes = segAnterior[grupo];
      function donde(k) { return 'translateX(calc(' + k + ' * (100% + 2px)))'; }
      if (antes != null && antes !== i) {
        cap.style.transition = 'none';
        cap.style.transform = donde(antes);
        void cap.offsetWidth;
        cap.style.transition = '';
        cap.classList.add('liquida');
      }
      cap.style.transform = donde(i);
      segAnterior[grupo] = i;
    });
  }
  function pro() { return M.esPro() ? '' : ' <span class="pro-chip">PRO</span>'; }
  function gratis() {
    if (M.esPro()) return '';
    return '<div class="gratis vidrio"><div><b>Versión gratuita</b><span>Ves las 3 primeras de cada lista</span></div><button data-a="pro">Pasar a Pro</button></div>';
  }
  function vacio(icono, t, d, conBoton) {
    return '<div class="vacio"><span class="vi vidrio" aria-hidden="true">' + ico(icono, 30) + '</span><div class="vt"><b>' + t + '</b><span>' + d + '</span></div>' +
      (conBoton ? '<div class="fila-btn"><button class="negro h50" data-a="revisar">' + ico(I.revisar, 19, 2) + 'Revisar ahora</button></div>' : '') + '</div>';
  }
  function vaciaFila(icono, t, d) {
    return '<div class="vacia-fila"><div class="vi" aria-hidden="true">' + ico(icono, 20) + '</div><div class="vt"><b>' + t + '</b><span>' + d + '</span></div></div>';
  }

  /* Los tres botones de arriba van en TODAS las pantallas de Hoy. Antes, en
     la de error, solo estaba el de ayuda: justo cuando hace falta entrar en
     Instagram o cambiar de cuenta, no habia por donde. */
  function botonesCab() {
    return '<button class="redondo vidrio" aria-label="Abrir Instagram" data-a="ampliar">' + ico(I.ig, 20) + '</button>' +
      '<button class="redondo vidrio" aria-label="Ajustes" data-a="ajustes">' + ico(I.ajustes, 19) + '</button>';
  }

  /* Lo que ha pasado de verdad, en una linea: con esto una captura basta
     para saber que falla. */
  function detalle() {
    var S = M.estado, d = S.diag, e = S.error, t = [];
    if (e) t.push('error ' + (e.kind || '?') + (e.status ? ' ' + e.status : ''));
    if (S.parcial && S.parcialInfo) t.push('recibí ' + S.parcialInfo.recibidos + ' de ' + (S.parcialInfo.total || '?') + (S.parcialInfo.completa ? '' : ' (cortada)'));
    if (d) {
      if (!d.yo) t.push('sin sesión en Instagram');
      else {
        if (!d.listo) t.push('motor no cargado en ' + (d.ruta || '?'));
        [['móvil', d.movil], ['móvil2', d.movil2], ['pc', d.pc], ['pc2', d.pc2]].forEach(function (x) {
          if (x[1]) t.push(x[0] + ' ' + x[1].status + (x[1].usuarios != null ? '·' + x[1].usuarios : '') + (x[1].status !== 200 || !x[1].usuarios ? ' ' + String(x[1].texto || '').replace(/\s+/g, ' ').slice(0, 50) : ''));
        });
      }
    }
    return t.length ? '<p class="nota" style="font-size:11.5px;-webkit-user-select:text;user-select:text">Detalle: ' + esc(t.join(' · ')) + '</p>' : '';
  }

  /* ---------------- Hoy ---------------- */
  function hoy() {
    var S = M.estado, L = M.listas(), c = S.counts;
    var ocup = M.ocupado;
    var btn = '<div class="fila-btn"><button class="negro' + (ocup ? ' gira' : '') + '" data-a="revisar">' + ico(I.revisar, 19, 2) + (ocup ? 'Revisando…' : 'Revisar ahora') + '</button></div>';
    var cab = '<div class="arriba"><div class="wm-caja">' + wm() + '</div>';
    var banda = U.actu ? '<div class="gratis vidrio"><div><b>' + (U.actu.apk ? 'Hay una versión nueva de la app' : 'Versión nueva lista') + '</b><span>' +
      (U.actu.apk ? 'Se descarga e instala desde aquí' : 'Pulsa para usarla ya') + '</span></div><button data-a="' + (U.actu.apk ? 'instalar-apk' : 'aplicar-act') + '">Actualizar</button></div>' : '';
    // Error 429 sin nada cargado: la pantalla "Hoy · error 429" del lienzo.
    if (!S.followers && (S.rate || S.error)) {
      return cab + botonesCab() + '</div>' + banda +
        (S.rate ? '<div class="aviso vidrio" role="status"><span class="ai" aria-hidden="true">' + ico(I.alerta, 20) + '</span><div class="at"><b>Instagram pidió esperar</b><span>Código ' + (S.rate.status || 429) + ' · lo vuelvo a intentar solo ~ ' + hora(S.rate.until) + '. No pulses Revisar mientras tanto.</span></div></div>'
          : '<div class="aviso vidrio" role="status"><span class="ai" aria-hidden="true">' + ico(I.alerta, 20) + '</span><div class="at"><b>' + esc(errTxt(S.error)) + '</b><span>' + (S.error && S.error.status ? 'Código ' + S.error.status : 'Vuelve a intentarlo') + '</span></div></div>') +
        '<div class="cifras sueltas"><div><b class="vacia">—</b><span>seguidores</span></div><div><b class="vacia">—</b><span>seguidos</span></div><div><b class="vacia">—</b><span>no te siguen</span></div></div>' +
        vacio(I.reloj_arena, 'Aún no he podido cargar tus seguidores', 'Pulsa «Revisar ahora» para intentarlo otra vez.', true) + detalle();
    }
    var semana = Date.now() - 7 * 864e5;
    var se = L.unfollow.filter(function (e) { return e.ts >= semana; }), n = se.length, ult = se[0];
    var ficha = ult ? '<div class="ficha"><div class="fav" aria-hidden="true">' + esc(iniciales(ult)) + (foto(ult.pic) ? '<img alt="" src="' + esc(foto(ult.pic)) + '" onerror="this.remove()">' : '') + '</div>' +
      '<div class="ft"><b>' + esc(ult.full_name || ult.username) + '</b><span>@' + esc(ult.username) + ' · hace ' + hace(ult.ts) + '</span></div></div>' : '<span></span>';
    var pega = n === 1 ? 'te dejó 💔' : n ? 'te dejaron 💔' : 'todo bien ✨';
    var cls = String(n).length > 3 ? ' l4' : String(n).length > 2 ? ' l3' : '';
    var nb = L.notback;
    var est;
    if (ocup) {
      var f = M.fase || {};
      est = '<span class="estado"><i class="ambar"></i><b>Revisando</b>· ' + (f.que === 'seguidos' ? 'seguidos' : 'seguidores') + (f.n ? ' ' + num(f.n) : '') + '</span>';
    } else if (S.rate && Date.now() < S.rate.until) est = '<span class="estado"><i class="rojo"></i><b>Instagram pidió esperar</b>· reintento ~ ' + hora(S.rate.until) + '</span>';
    else if (S.parcial) est = '<span class="estado"><i class="ambar"></i><b>Lista a medias</b>· no he comparado, lo reintento ~ ' + hora(S.nextCheck) + '</span>';
    else if (S.error) est = '<span class="estado"><i class="rojo"></i><b>' + esc(errTxt(S.error)) + '</b></span>';
    else if (S.auto) est = '<span class="estado"><i></i><b>Todo al día</b>· próxima revisión ~ ' + hora(S.nextCheck || Date.now() + 216e5) + '</span>';
    else est = '<span class="estado"><i></i><b>Todo al día</b>· solo reviso cuando tú pulses</span>';
    var neu = L.new.slice(0, M.esPro() ? 5 : Math.min(5, M.LIBRE));
    if (S.pausa) {
      return cab + botonesCab() + '</div>' + banda +
        '<div class="vacio"><span class="vi vidrio" aria-hidden="true">' + ico(I.alerta, 30) + '</span>' +
        '<div class="vt"><b>En pausa: Instagram limitó tu cuenta</b><span>Fue culpa mía: la app le pidió datos demasiadas veces. Mientras dure, Instagram no deja leer tus seguidores ni desde aquí ni desde el ordenador. Suele levantarse en unas horas.</span></div>' +
        '<div class="fila-btn"><button class="negro h50" data-a="reanudar">Ya puedo, reanudar</button></div></div>' +
        '<p class="nota">Antes de reanudar, entra en Instagram (botón de arriba) y comprueba que ya te deja moverte con normalidad.</p>' +
        (S.counts ? '<div class="cifras sueltas"><div><b>' + num(S.counts.followers) + '</b><span>seguidores</span></div><div><b>' + num(S.counts.following) + '</b><span>seguidos</span></div><div><b class="rosa">' + (M.listas().notback ? num(M.listas().notback.length) : '—') + '</b><span>no te siguen</span></div></div>' : '') +
        detalle();
    }
    return cab + botonesCab() + '</div>' + banda +
      '<button class="heroe" data-a="ver-dejaron"><div class="b1" aria-hidden="true"></div><div class="b2" aria-hidden="true"></div>' +
      '<div class="heroe-top">' + ficha + '<span class="pega">' + pega + '</span></div>' +
      '<div class="heroe-bajo"><div class="heroe-cifra' + cls + '">' + num(n) + '</div><div class="heroe-txt">' + (n === 1 ? 'persona te dejó de seguir.' : n ? 'personas te dejaron de seguir.' : 'nadie te ha dejado de seguir.') + '</div></div></button>' +
      '<div class="cifras"><button data-seg="new"><b>' + (c ? num(c.followers) : '—') + '</b><span>seguidores</span></button>' +
      '<button data-seg="new"><b>' + (c ? num(c.following) : '—') + '</b><span>seguidos</span></button>' +
      '<button data-seg="notback"><b class="rosa">' + (nb ? num(nb.length) : '—') + '</b><span>no te siguen</span></button></div>' +
      '<div class="bloque">' + btn + est + (S.parcial || S.error ? detalle() : '') + '</div>' +
      '<div class="bloque"><div class="cab"><h2>Nuevos · ' + num(L.new.length) + '</h2>' + (L.new.length > neu.length ? '<button data-seg="new">Ver todo</button>' : '') + '</div>' +
      '<div class="lista">' + (neu.length ? neu.map(function (p) { return filaPersona(p, 'hora'); }).join('') : vaciaFila(I.nuevo, 'Nadie nuevo, de momento', 'Te avisamos cuando alguien te siga.')) + '</div></div>';
  }

  /* ---------------- Personas ---------------- */
  function filaPersona(p, der) {
    var d = '';
    if (der === 'hora') d = '<span class="hora">' + (p.ts ? hace(p.ts) : '') + '</span>';
    if (der === 'dejar') d = U.trabajando[p.pk] ? '<button class="chip hecho" disabled>…</button>' : '<button class="chip" data-a="dejar" data-pk="' + esc(p.pk) + '">Dejar de seguir' + pro() + '</button>';
    if (der === 'sel') d = '';
    var marca = der === 'sel' ? '<span class="marca-sel' + (U.sel[p.pk] ? ' on' : '') + '" aria-hidden="true">' + (U.sel[p.pk] ? ico(I.ok, 14, 2.6) : '') + '</span>' : '';
    return '<div class="fila" data-perfil="' + esc(p.username) + '"' + (der === 'sel' ? ' data-sel="' + esc(p.pk) + '"' : '') + '>' + marca + av(p) +
      '<div class="quien"><b>' + esc(p.full_name || p.username) + (p.is_verified ? ' ' + VERIF : '') + '</b><span>@' + esc(p.username) + (p.is_private ? ' · privada' : '') + '</span></div>' + d + '</div>';
  }
  function personas() {
    var L = M.listas(), esPro = M.esPro();
    var nb = L.notback;
    var h = cabecera('Personas') + segs([['unfollow', 'Te dejaron', L.unfollow.length], ['new', 'Nuevos', L.new.length], ['notback', 'No te siguen', nb ? nb.length : 0]], U.seg, 'seg');
    var todos = U.seg === 'notback' ? (nb || []) : L[U.seg];
    if (!todos.length && !U.busca) {
      h += gratis();
      if (U.seg === 'unfollow') h += vacio(I.fuera, 'Nadie te ha dejado de seguir', 'Cuando alguien se vaya, aparecerá aquí con la fecha.');
      else if (U.seg === 'new') h += vacio(I.nuevo, 'Aún no hay nuevos seguidores', 'Aquí verás quién empezó a seguirte desde la última revisión.');
      else if (!nb) h += vacio(I.flecha, 'Todavía no sé a quién sigues', 'Pulsa «Revisar ahora» para cargar tu lista de seguidos.', true);
      else h += vacio(I.ok, 'Todos te siguen de vuelta', 'No hay nadie a quien sigas que no te siga.');
      return h;
    }
    h += '<div style="display:flex;gap:10px;align-items:center"><label class="busca">' + ico(I.lupa, 19, 2) + '<span class="sr">Buscar</span>' +
      '<input type="search" id="busca" placeholder="Buscar por nombre o @usuario" value="' + esc(U.busca) + '"></label>' +
      (U.seg === 'notback' && esPro ? '<button class="enlace" data-a="seleccionar">' + (U.sel ? 'Cancelar' : 'Seleccionar') + '</button>' : '') + '</div>';
    h += gratis();
    var q = U.busca.toLowerCase().trim(), items = todos;
    if (q) items = items.filter(function (p) { return (p.username + ' ' + p.full_name).toLowerCase().indexOf(q) >= 0; });
    var vis = esPro ? items : items.slice(0, M.LIBRE);
    var der = U.seg === 'notback' ? (U.sel ? 'sel' : 'dejar') : 'hora';
    h += '<div class="bloque"><div class="lista">' + (vis.length ? vis.map(function (p) { return filaPersona(p, der); }).join('') : vaciaFila(I.lupa, 'Nadie coincide', 'Prueba con otro nombre.')) + '</div>';
    if (U.seg === 'notback' && !q) h += '<p class="nota">' + num(items.length) + (items.length === 1 ? ' cuenta que sigues no te sigue.' : ' cuentas que sigues no te siguen.') + ' Tú decides a quién dejar.</p>';
    if (!esPro && items.length > M.LIBRE) h += '<p class="nota">Y ' + num(items.length - M.LIBRE) + ' más con Pro.</p>';
    h += '</div>';
    if (U.sel) {
      var k = Object.keys(U.sel).filter(function (x) { return U.sel[x]; }).length;
      h += '<div class="fila-btn" style="position:sticky;bottom:calc(var(--sa-bot) + 104px);z-index:45"><button class="negro" data-a="dejar-sel"' + (k ? '' : ' disabled style="opacity:.5"') + '>Dejar de seguir' + (k ? ' (' + k + ')' : '') + '</button></div>';
    }
    return h;
  }

  /* ---------------- Historias ---------------- */
  function historias() {
    var S = M.estado, t = S.tray && S.tray.list || [];
    var q = U.buscaHis.toLowerCase().trim(), lista = q ? t.filter(function (x) { return (x.username + ' ' + x.full_name).toLowerCase().indexOf(q) >= 0; }) : t;
    var h = cabecera('Historias', '<div class="fantasma"><span class="pega">modo fantasma</span></div>' + (M.esPro() ? '' : '<span class="pro-chip">PRO</span>'));
    h += '<p class="sub">' + (S.tray ? num(t.length) + (t.length === 1 ? ' persona tiene' : ' personas tienen') + ' historia ahora. Ábrelas sin aparecer en su lista de espectadores.' : 'Mira las historias de quien sigues sin aparecer en su lista de espectadores.') + '</p>';
    h += '<div style="display:flex"><label class="busca h46">' + ico(I.lupa, 19, 2) + '<span class="sr">Buscar</span><input type="text" id="buscaHis" placeholder="Busca a alguien" value="' + esc(U.buscaHis) + '"></label></div>';
    h += M.esPro() ? '' : '<div class="gratis vidrio"><div><b>Ver historias a escondidas es de Pro</b><span>Gratis ves quién tiene historia ahora</span></div><button data-a="pro">Pasar a Pro</button></div>';
    if (!S.tray) h += vacio(I.historias, 'Aún no he mirado las historias', 'Pulsa «Actualizar» para ver quién tiene historia ahora.');
    else if (!lista.length) h += vacio(I.historias, q ? 'Nadie coincide' : 'Nadie tiene historia ahora', q ? 'Prueba con otro nombre.' : 'Vuelve en un rato.');
    else h += '<div class="caras">' + lista.map(function (x) {
      return '<button class="cara" data-a="ver-historia" data-reel="' + esc(x.reelId) + '"><div class="aro' + (x.unseen ? '' : ' visto') + '"><div>' + av(x) + '</div>' +
        (x.count > 1 ? '<span class="n">' + num(x.count) + '</span>' : '') + '</div><span class="nom">' + esc(x.username) + '</span></button>';
    }).join('') + '</div>';
    var ocup = U.trabajando.tray;
    h += '<div class="dosbtn"><button class="claro vidrio" data-a="ver-todas"' + (lista.length ? '' : ' disabled style="opacity:.5"') + '>' + ico(I.play, 19) + 'Ver las ' + num(lista.length) + pro() + '</button>' +
      '<button class="negro h50' + (ocup ? ' gira' : '') + '" data-a="bandeja">' + ico(I.revisar, 19, 2) + 'Actualizar</button></div>';
    return h;
  }

  /* ---------------- Actividad ---------------- */
  var TIPO = { name: 'Cambió el nombre', username: 'Cambió el usuario', photo: 'Cambió la foto de perfil', bio: 'Cambió la bio', follow_add: 'Empezó a seguir a', follow_rem: 'Dejó de seguir a' };
  var TAG = { name: 'perfil', username: 'perfil', photo: 'foto', bio: 'perfil', follow_add: 'nuevo', follow_rem: 'sigue' };
  function actividad() {
    var S = M.estado, esPro = M.esPro();
    var nReq = S.reqs ? S.reqs.users.length : 0;
    var h = cabecera('Actividad') + segs([['cambios', 'Cambios', S.activity.length], ['solicitudes', 'Solicitudes', nReq]], U.act, 'act');
    if (U.act === 'cambios') {
      h += '<div class="vigilar"><label class="busca h46">' + ico(I.lupa, 19, 2) + '<span class="sr">Vigilar usuario</span><input type="text" id="vigilar" placeholder="Busca a alguien para vigilar" autocapitalize="off"></label>' +
        '<button class="negro h46" data-a="vigilar">Vigilar</button></div>';
      var a = esPro ? S.activity : S.activity.slice(0, M.LIBRE);
      if (!esPro && S.activity.length > M.LIBRE) h += gratis();
      h += '<div class="lista fina">' + (a.length ? a.map(function (e) {
        var cambio = TIPO[e.type] + (e.target ? ' @' + e.target.username : '') + (e.from != null && e.to != null ? ' · ' + e.from + ' → ' + e.to : '');
        return '<div class="fila act" data-perfil="' + esc(e.username) + '">' + av(e) + '<div class="quien"><b>' + esc(e.full_name || e.username) + '</b><span>@' + esc(e.username) + (e.is_private ? ' · privada' : '') + '</span><em>' + esc(cambio) + '</em></div>' +
          '<div class="lado"><span>' + hace(e.ts) + '</span><span class="tag">' + TAG[e.type] + '</span></div></div>';
      }).join('') : vaciaFila(I.actividad, S.watch.length ? 'Sin cambios todavía' : 'No vigilas a nadie', S.watch.length ? 'Te aviso cuando sigan a alguien nuevo o cambien foto, nombre o bio.' : 'Escribe un @ arriba y pulsa Vigilar.')) + '</div>';
      if (S.watch.length) h += '<div class="bloque"><div class="cab"><h2>Vigilando · ' + num(S.watch.length) + '</h2></div><div class="lista">' + S.watch.map(function (w) {
        return '<div class="fila" data-perfil="' + esc(w.username) + '">' + av(w) + '<div class="quien"><b>' + esc(w.full_name || w.username) + '</b><span>@' + esc(w.username) + '</span></div><button class="chip" data-a="quitar-vigilar" data-pk="' + esc(w.pk) + '">Quitar</button></div>';
      }).join('') + '</div></div>';
      return h;
    }
    // Solicitudes
    var reqs = S.reqs ? S.reqs.users : [];
    h += '<div class="sol"><div class="sol-cab"><div><span>Aprobar automáticamente' + pro() + '</span>' + (reqs.length ? '<button data-a="aceptar-todas">Aceptar todas' + pro() + '</button>' : '<button data-a="cargar-sol">Actualizar</button>') + '</div>' +
      segs([['manual', 'Manual'], ['sigo', 'A quien sigo'], ['todas', 'Todas']], S.reqRule, 'regla', true) + '</div>' +
      (!S.reqs ? vaciaFila(I.nuevo, 'Cargando solicitudes…', 'Solo aparecen si tu cuenta es privada.') :
        reqs.length ? reqs.map(function (p) {
          return '<div class="fila">' + av(p) + '<div class="quien"><b>' + esc(p.full_name || p.username) + '</b><span>@' + esc(p.username) + '</span></div>' +
            '<div class="dos"><button aria-label="Rechazar" data-a="rechazar" data-pk="' + esc(p.pk) + '">' + ico(I.x, 16, 2.2) + '</button><button class="si" aria-label="Aceptar" data-a="aceptar" data-pk="' + esc(p.pk) + '">' + ico(I.ok, 17, 2.3) + '</button></div></div>';
        }).join('') : '<div class="fila">' + vaciaFila(I.ok, 'Sin solicitudes', 'Nadie está esperando.').replace('class="vacia-fila"', 'class="vacia-fila" style="padding:2px 0"') + '</div>') + '</div>';
    h += '<div class="bloque"><div class="cab"><h2>¿Se siguen?</h2></div><div class="panel vidrio"><div class="ab">' +
      '<label class="busca h46"><span class="sr">Cuenta A</span><input type="text" id="cuentaA" placeholder="Cuenta A" autocapitalize="off"></label>' +
      '<span class="flecha" aria-hidden="true">' + ico(I.cambio, 16, 2) + '</span>' +
      '<label class="busca h46"><span class="sr">Cuenta B</span><input type="text" id="cuentaB" placeholder="Cuenta B" autocapitalize="off"></label></div>' +
      '<div class="fila-btn"><button class="negro h48' + (U.trabajando.ab ? ' gira' : '') + '" data-a="comprobar">Comprobar</button></div>' +
      (U.ab ? '<div class="resultado">' + U.ab + '</div>' : '') + '</div></div>';
    return h;
  }

  /* ---------------- Historial ---------------- */
  function linea() {
    var S = M.estado, h = S.history.slice(-8), c = S.counts;
    var hoyN = c ? c.followers : (h.length ? h[h.length - 1].followers : 0);
    var ini = h.length ? h[0].followers : hoyN, delta = hoyN - ini;
    var serie = h.map(function (x) { return x.followers; });
    if (serie.length < 2) serie = [hoyN, hoyN];
    var lo = Math.min.apply(null, serie), hi = Math.max.apply(null, serie), r = Math.max(1, hi - lo);
    var pts = serie.map(function (y, i) { return [i / (serie.length - 1) * 300, hi === lo ? 46 : 18 + (1 - (y - lo) / r) * 56]; });
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var deltaTxt = delta > 0 ? '+' + num(delta) : delta < 0 ? '−' + num(-delta) : '±0';
    return '<div class="grafica vidrio"><div class="g-cab"><b>' + num(hoyN) + '</b><span>seguidores</span><span class="delta' + (delta > 0 ? ' mas' : delta === 0 ? ' igual' : '') + '">' + deltaTxt + '</span></div>' +
      '<svg width="100%" height="96" viewBox="0 0 300 96" preserveAspectRatio="none" role="img" aria-label="Evolución de seguidores: de ' + num(ini) + ' a ' + num(hoyN) + '"><defs>' +
      '<linearGradient id="gls" x1="0" x2="1"><stop offset="0" stop-color="#F0507A"/><stop offset="1" stop-color="#6E4BE0"/></linearGradient>' +
      '<linearGradient id="glf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D62976" stop-opacity="0.22"/><stop offset="1" stop-color="#D62976" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + ' L300 96 L0 96 Z" fill="url(#glf)"/><path d="' + d + '" fill="none" stroke="url(#gls)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>' +
      '<div class="g-pie"><span>' + (h.length > 1 ? 'hace ' + hace(h[0].ts) : 'hace 7 d') + '</span><span>hoy</span></div></div>';
  }
  /* Hombres y mujeres entre quien te sigue (o a quien sigues), estimado por
     el nombre. Gratis: es de lo primero que se quiere mirar. */
  function genero() {
    var S = M.estado, cual = U.gen || 'followers', src = S[cual] && S[cual].users;
    var h = '<div class="bloque"><div class="cab"><h2>Hombres y mujeres</h2></div><div class="grafica vidrio">' +
      segs([['followers', 'Te siguen'], ['following', 'Sigues']], cual, 'gen', true);
    if (!src || !src.length) return h + '<p class="nota" style="padding:0">Pulsa «Revisar ahora» en Hoy para cargar la lista.</p></div></div>';
    var r = Generos.reparto(src);
    return h + '<div class="genero"><div class="gm"><span>Mujeres</span><b>' + r.pctM + '%</b></div><div class="gh"><span>Hombres</span><b>' + r.pctH + '%</b></div></div>' +
      '<div class="gbarra"><i style="width:' + r.pctM + '%"></i></div>' +
      '<div class="g-pie"><span>' + num(r.mujeres) + ' mujeres · ' + num(r.hombres) + ' hombres</span><span>' + num(r.sin) + ' sin clasificar</span></div>' +
      '<p class="nota" style="padding:0">Estimado por el nombre de cada perfil. Los que no tienen un nombre claro no cuentan.</p></div></div>';
  }
  function historial() {
    var S = M.estado;
    var h = cabecera('Historial') + segs([['resumen', 'Resumen'], ['interacciones', 'Interacciones']], U.hist, 'hist');
    if (U.hist === 'resumen') {
      h += linea() + genero();
      var rk = M.ranking(), items = Object.keys(S.stories.items).length, ocup = U.trabajando.mis;
      var top = rk.length ? '<div class="mis-top"><div class="mis-ico" aria-hidden="true">' + ico(I.historial, 24, 2) + '</div><div><b>' + num(rk.length) + ' espectadores guardados</b><span>' + num(items) + (items === 1 ? ' historia' : ' historias') + ' · el que más: @' + esc(rk[0].user.username) + ' (' + rk[0].slides + ')</span></div></div>'
        : '<div class="mis-top"><div class="mis-ico" aria-hidden="true">' + ico(I.historial, 24, 2) + '</div><div><b>Aún no hay nada guardado</b><span>Si tienes una historia activa, actualiza para guardarla. Solo tú las ves.</span></div></div>';
      h += '<div class="bloque"><div class="cab"><h2>Mis historias' + pro() + '</h2></div><div class="mis">' + top +
        '<div class="dosbtn"><button class="claro vidrio h48" data-a="espectadores">Ver espectadores</button>' +
        '<button class="negro h48' + (ocup ? ' gira' : '') + '" data-a="mis-historias">' + ico(I.revisar, 19, 2) + 'Actualizar</button></div></div></div>';
      return h;
    }
    var it = S.inter, calc = U.trabajando.inter;
    h += '<div class="inter vidrio"><p>Leo los likes y comentarios de tus últimas publicaciones para ver quién interactúa más contigo.</p>' +
      '<div class="fila-btn"><button class="negro h50' + (calc ? ' gira' : '') + '" data-a="calcular">' + (calc ? 'Calculando ' + esc(calc) : 'Calcular likes y comentarios') + '</button></div></div>';
    function tarj(icono, color, t, vacio, lista) {
      var sub = lista && lista.length ? lista.slice(0, 3).map(function (x) { return '@' + esc(x.user.username) + ' (' + x.n + ')'; }).join(', ') : vacio;
      var mini = lista && lista.length ? '<div class="mini">' + lista.slice(0, 5).map(function (x) { return av(x.user); }).join('') + '</div>' : '';
      return '<div class="tarjeta"><span class="ti" style="color:' + color + '" aria-hidden="true">' + ico(icono, 20) + '</span><div><b>' + t + '</b><span>' + sub + '</span>' + mini + '</div></div>';
    }
    var L = M.listas(), sem = L.new.filter(function (e) { return e.ts > Date.now() - 7 * 864e5; });
    h += '<div class="tarjetas">' + tarj(I.corazon, 'var(--rosa-txt)', 'Más likes recibidos', 'Calcula para ver quién te da más likes.', it && it.likers) +
      tarj(I.bocadillo, '#F08A3D', 'Más comentarios', 'Calcula para ver quién comenta más.', it && it.commenters) +
      '<div class="tarjeta"><span class="ti" style="color:var(--verde-ico)" aria-hidden="true">' + ico(I.nuevo, 20) + '</span><div><b>Nuevos seguidores</b><span>' +
      (sem.length ? num(sem.length) + ' esta semana: ' + sem.slice(0, 3).map(function (p) { return '@' + esc(p.username); }).join(', ') : 'Aún no hay nuevos seguidores registrados.') + '</span></div></div></div>';
    return h;
  }

  /* ---------------- hojas ---------------- */
  function hojaPro() {
    var v = [['Quién ve tus stories', 'Aunque no te lo digan.'], ['Ranking de espectadores', 'Los más fieles, guardado para siempre.'],
             ['Alertas al instante', 'Te enteras en cuanto pasa.'], ['Historial completo', 'Sin el límite de 3 por lista.']];
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Ghoosted Pro"><div class="asa"><span></span></div>' +
      (U.proQue ? '<div class="aviso-pro">' + ico(I.candado, 16, 2) + '<span><b>' + esc(U.proQue) + '</b> es una función de Pro</span></div>' : '') +
      '<div class="h-cab"><span class="pro">PRO</span><h2>Desbloquea ghoosted Pro</h2><p>Ahora ves las 3 primeras de cada lista. Con Pro, todo.</p></div>' +
      '<div class="ventajas">' + v.map(function (x) { return '<div class="ventaja"><span class="ok" aria-hidden="true">' + ico(I.ok, 14, 2.6) + '</span><div><b>' + x[0] + '</b><span>' + x[1] + '</span></div></div>'; }).join('') + '</div>' +
      '<div class="h-bajo"><div class="fila-btn" style="align-self:stretch"><button class="comprar" data-a="comprar"><b>Desbloquear por 5 €</b><span>Pago único · para siempre</span></button></div>' +
      '<button class="tengo" data-a="tengo-clave">Ya lo compré · tengo una clave</button></div></div>';
  }
  function hojaClave() {
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Activar clave"><div class="asa"><span></span></div>' +
      '<div class="h-cab"><span class="pro">PRO</span><h2>Pega tu clave</h2><p>La que te llegó por correo al comprar. Se queda unida a esta cuenta de Instagram.</p></div>' +
      '<label class="busca h46" style="flex:none"><span class="sr">Clave</span><input type="text" id="clave" placeholder="GHD-XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off"></label>' +
      '<div class="h-bajo"><div class="fila-btn" style="align-self:stretch"><button class="negro' + (U.trabajando.clave ? ' gira' : '') + '" data-a="activar">Activar</button></div>' +
      '<button class="tengo" data-a="pro">Volver</button></div></div>';
  }
  function hojaAjustes() {
    var S = M.estado, g = null; try { g = localStorage.getItem('ghd_tema'); } catch (e) {}
    var yo = S.followers ? '' : '';
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Ajustes"><div class="asa"><span></span></div>' +
      '<div class="h-cab"><h2>Ajustes</h2></div><div>' +
      '<div class="ajuste"><span>Plan</span>' + (M.esPro() ? '<span class="valor">Pro ✓</span>' : '<button class="enlace" data-a="pro" style="height:auto">Pasar a Pro</button>') + '</div>' +
      '<div class="ajuste"><span>Tema</span>' + segs([['sistema', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']], g || 'sistema', 'tema', true).replace('class="segs', 'style="width:190px" class="segs') + '</div>' +
      '<div class="ajuste"><span>Última revisión</span><span class="valor">' + (S.lastCheck ? 'hace ' + hace(S.lastCheck) : '—') + '</span></div>' +
      '<div class="ajuste"><span>Instagram</span><button class="enlace" data-a="ampliar" style="height:auto">Abrir</button></div>' +
      '<div class="ajuste"><span>Versión' + (U.ver ? ' <span class="valor">' + U.ver.web + '·' + U.ver.apk + '</span>' : '') + '</span><button class="enlace" data-a="buscar-act" style="height:auto">' + (U.buscando ? 'Buscando…' : 'Buscar actualización') + '</button></div>' +
      '<div class="ajuste"><span>Peticiones a Instagram<span class="valor"> · tope por hora</span></span><span class="valor">' +
        (U.gasto ? U.gasto.hora + '/' + U.gasto.topeHora + ' · hoy ' + U.gasto.dia + '/' + U.gasto.topeDia : '—') + '</span></div>' +
      '<div class="ajuste"><span>Revisar sola cada 6 h<span class="valor"> · con la app abierta</span></span><button class="enlace" data-a="auto" style="height:auto">' + (S.auto ? 'Sí, activado' : 'No, solo a mano') + '</button></div>' +
      '<div class="ajuste"><span>Pedir datos a Instagram</span><button class="enlace" data-a="' + (M.esPro() && false ? '' : 'pausa') + '" style="height:auto">' + (S.pausa ? 'Está en pausa · reanudar' : 'Pausar') + '</button></div>' +
      '<div class="ajuste"><span>Diagnóstico</span><button class="enlace" data-a="diag" style="height:auto">Ver</button></div>' +
      '<div class="ajuste"><span>Borrar los datos guardados</span><button class="enlace" data-a="borrar" style="height:auto">Borrar</button></div>' +
      '<div class="ajuste"><span>Cuenta</span><button class="enlace" data-a="cambiar" style="height:auto">Cambiar de cuenta</button></div>' +
      '<div class="ajuste"><span>Salir de Instagram</span><button class="rojo" data-a="salir">Cerrar sesión</button></div>' + yo +
      '</div></div>';
  }
  function hojaDiag() {
    var S = M.estado, d = U.diag;
    function res(x) { return x ? esc(x.status + ' · ' + x.texto) : '…'; }
    var prueba = !d ? '<p>Pulsa «Probar» y mándame una captura de esta pantalla.</p>' : d.cargando ? '<p>Probando…</p>' :
      '<div class="lista" style="padding:10px 16px;font-size:12.5px;line-height:1.5;word-break:break-all;-webkit-user-select:text;user-select:text">' +
      '<b>Cuenta:</b> ' + esc(d.yo || 'sin sesión') + '<br><b>Id en uso:</b> ' + esc(d.usado || '') + '<br><b>Móvil:</b> ' + res(d.movil) + '<br><b>PC:</b> ' + res(d.pc) +
      '<br><b>Navegador:</b> ' + esc(d.ua || '') + '</div>';
    var log = (S.log || []).slice(0, 12).map(function (x) {
      return esc(hora(x.ts) + ' ' + x.que + ' · ' + x.kind + (x.status ? ' ' + x.status : '') + (x.msg ? ' · ' + x.msg : ''));
    }).join('<br>');
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Diagnóstico"><div class="asa"><span></span></div>' +
      '<div class="h-cab"><h2>Diagnóstico</h2></div>' + prueba +
      '<div class="lista" style="padding:10px 16px;font-size:12px;line-height:1.5;color:var(--ink-2);-webkit-user-select:text;user-select:text">' + (log || 'Sin incidencias guardadas.') + '</div>' +
      '<div class="fila-btn"><button class="negro" data-a="probar">Probar</button></div></div>';
  }
  function hojaEspectadores() {
    var rk = M.ranking();
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Espectadores"><div class="asa"><span></span></div>' +
      '<div class="h-cab"><h2>Quién ve tus historias</h2><p>' + num(rk.length) + ' personas, de más a menos.</p></div>' +
      '<div class="lista" style="padding:2px 16px">' + (rk.length ? rk.slice(0, 200).map(function (x, i) {
        return '<div class="fila" data-perfil="' + esc(x.user.username) + '"><span style="width:20px;text-align:center;font-family:var(--marca);font-weight:700;font-size:13px;color:var(--ink-2)">' + (i + 1) + '</span>' + av(x.user) +
          '<div class="quien"><b>' + esc(x.user.full_name || x.user.username) + '</b><span>' + x.slides + (x.slides === 1 ? ' historia' : ' historias') + (x.likes ? ' · ' + x.likes + ' ♥' : '') + '</span></div></div>';
      }).join('') : vaciaFila(I.historias, 'Nada guardado aún', 'Actualiza con una historia activa.')) + '</div></div>';
  }

  /* ---------------- visor de historias ---------------- */
  var visorT = 0;
  function visor() {
    var v = U.visor; if (!v) return '';
    var g = v.grupos[v.g], it = g && g.items[v.i];
    if (!it) return '';
    var barras = g.items.map(function (x, k) { return '<i class="' + (k < v.i ? 'hecha' : k === v.i ? 'ahora' : '') + '"></i>'; }).join('');
    // El video se baja entero antes (ver cargarVideo): el reproductor del
    // movil no pasa por el proxy de fotos y sin eso salia el icono de play gris.
    var medio = it.isVideo ? '<video playsinline autoplay poster="' + esc(foto(it.img) || '') + '"' + (it.blob ? ' src="' + esc(it.blob) + '"' : '') + '></video>' : '<img alt="" src="' + esc(foto(it.url) || it.url) + '">';
    return '<div class="visor"><div class="barras">' + barras + '</div><div class="quien-v">' + av(g.user) + '<b>' + esc(g.user.username) + '</b><span>' + hace(it.ts) + '</span>' +
      '<button aria-label="Cerrar" data-a="cerrar-visor">' + ico(I.cerrar, 24, 2) + '</button></div>' +
      '<div class="medio">' + medio + '<button class="zona izq" aria-label="Anterior" data-a="visor-ant"></button><button class="zona der" aria-label="Siguiente" data-a="visor-sig"></button></div>' +
      '<div class="pie">Modo fantasma · no apareces en su lista</div></div>';
  }
  async function abrirVisor(reels) {
    if (!M.esPro()) return abrirPro('Ver historias sin salir en la lista');
    toast('Cargando historias…');
    try {
      var tray = M.estado.tray.list, datos = await M.verHistorias(reels), grupos = [];
      reels.forEach(function (r) {
        var u = tray.find(function (x) { return String(x.reelId) === String(r); });
        var items = datos[r] || datos[u && u.pk] || [];
        if (u && items.length) grupos.push({ user: u, items: items });
      });
      if (!grupos.length) return toast('Ya no están disponibles');
      U.visor = { grupos: grupos, g: 0, i: 0 };
      pintar(); temporizar();
    } catch (e) { toast(errTxt(e)); }
  }
  var blobs = [];
  function cargarVideo(it) {
    if (it.blob || it.bajando) return;
    it.bajando = true;
    fetch(foto(it.url) || it.url).then(function (r) { if (!r.ok) throw new Error('video ' + r.status); return r.blob(); })
      .then(function (b) { it.blob = URL.createObjectURL(b); blobs.push(it.blob); if (U.visor) { pintar(); temporizar(); } })
      .catch(function (e) { M.registrar('video', e); it.isVideo = false; it.url = it.img; if (U.visor) pintar(); });
  }
  function temporizar() {
    clearTimeout(visorT);
    var v = U.visor; if (!v) { blobs.forEach(function (b) { URL.revokeObjectURL(b); }); blobs = []; return; }
    var it = v.grupos[v.g].items[v.i];
    if (it.isVideo && !it.blob) { cargarVideo(it); return; }
    // el siguiente, por adelantado
    var sig = v.grupos[v.g].items[v.i + 1]; if (sig && sig.isVideo) cargarVideo(sig);
    if (it.isVideo) {
      var vid = document.querySelector('.visor video');
      if (vid) vid.onended = function () { avanzar(1); };
      return;
    }
    visorT = setTimeout(function () { avanzar(1); }, 5000);
  }
  function avanzar(d) {
    var v = U.visor; if (!v) return;
    v.i += d;
    if (v.i >= v.grupos[v.g].items.length) { v.g++; v.i = 0; }
    if (v.i < 0) { v.g = Math.max(0, v.g - 1); v.i = 0; }
    if (v.g >= v.grupos.length) { U.visor = null; clearTimeout(visorT); }
    pintar(); temporizar();
  }

  /* ---------------- pintar ---------------- */
  var foco = null;
  var conBarra = false, tabAnterior = null;
  function pintar(animarTab) {
    var S = M.estado;
    var act = document.activeElement;
    foco = act && act.id && act.tagName === 'INPUT' ? { id: act.id, pos: act.selectionStart } : null;
    if (!S.intro || !S.yo || U.cargando) {
      conBarra = false;
      $app.innerHTML = !S.intro ? intro() : !S.yo ? sinSesion() : cargando();
    } else {
      var cuerpo = ({ hoy: hoy, personas: personas, historias: historias, actividad: actividad, historial: historial })[U.tab]();
      if (!conBarra) {
        $app.innerHTML = '<main class="pantalla" id="pantalla"></main>' + barra();
        conBarra = true;
        tabAnterior = null;
      }
      var m = document.getElementById('pantalla');
      m.innerHTML = cuerpo;
      if (tabAnterior !== U.tab) {
        m.classList.remove('entra'); void m.offsetWidth; m.classList.add('entra');
        moverCapsula(tabAnterior !== null);
        tabAnterior = U.tab;
        segAnterior = {};
      }
    }
    pintarHoja();
    pintarVisor();
    // Aqui abajo: asi entran tambien los selectores que viven dentro de una
    // hoja, como el del Tema en Ajustes.
    colocarSegs();
    if (foco) { var el = document.getElementById(foco.id); if (el) { el.focus(); try { el.setSelectionRange(foco.pos, foco.pos); } catch (e) {} } }
  }

  /* ---------------- hojas: suben, se arrastran y bajan ---------------- */
  var hojaPuesta = null, cajaHoja = null;
  function pintarHoja() {
    var quiere = U.hojaAbierta;
    if (!quiere) { if (hojaPuesta) cerrarHoja(); return; }
    var html = ({ pro: hojaPro, clave: hojaClave, ajustes: hojaAjustes, espectadores: hojaEspectadores, diag: hojaDiag })[quiere]();
    if (hojaPuesta === quiere && cajaHoja) {
      // misma hoja, contenido nuevo: se cambia por dentro y no vuelve a subir
      var nueva = document.createElement('div');
      nueva.innerHTML = html;
      cajaHoja.querySelector('.hoja').innerHTML = nueva.querySelector('.hoja').innerHTML;
      return;
    }
    if (cajaHoja) cajaHoja.remove();
    cajaHoja = document.createElement('div');
    cajaHoja.innerHTML = html;
    document.body.appendChild(cajaHoja);
    var hoja = cajaHoja.querySelector('.hoja');
    arrastrar(hoja);
    requestAnimationFrame(function () { cajaHoja.classList.add('abierta'); });
    hojaPuesta = quiere;
  }
  function cerrarHoja() {
    var caja = cajaHoja;
    hojaPuesta = null; cajaHoja = null;
    if (!caja) return;
    caja.classList.add('cerrando');
    setTimeout(function () { caja.remove(); }, 300);
  }
  // Arrastrar la hoja hacia abajo para cerrarla, como en iOS.
  function arrastrar(hoja) {
    var y0 = null, dy = 0, t0 = 0;
    hoja.addEventListener('touchstart', function (e) {
      if (hoja.scrollTop > 0) return;
      y0 = e.touches[0].clientY; dy = 0; t0 = Date.now();
      hoja.style.transition = 'none';
    }, { passive: true });
    hoja.addEventListener('touchmove', function (e) {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy < 0) dy = dy / 6;   // hacia arriba apenas cede
      hoja.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    hoja.addEventListener('touchend', function () {
      if (y0 == null) return;
      var rapido = dy > 40 && Date.now() - t0 < 300;
      hoja.style.transition = '';
      hoja.style.transform = '';
      y0 = null;
      if (dy > 110 || rapido) { U.hojaAbierta = null; U.proQue = null; cerrarHoja(); }
    });
  }
  var visorPuesto = false;
  function pintarVisor() {
    var v = document.getElementById('visor');
    if (!U.visor) { if (v) v.remove(); visorPuesto = false; return; }
    var html = visor();
    if (!v) {
      var caja = document.createElement('div');
      caja.id = 'visor';
      caja.innerHTML = html;
      document.body.appendChild(caja);
      visorPuesto = true;
    } else v.innerHTML = html;
  }
  function abrir(h) { if (h !== 'pro' && h !== 'clave') U.proQue = null; U.hojaAbierta = h; pintar(); }
  // Al tocar algo de pago se dice que es: «Dejar de seguir» es de Pro.
  function abrirPro(que) { U.proQue = que || null; U.hojaAbierta = 'pro'; pintar(); }

  /* ---------------- acciones ---------------- */
  function valor(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function abrirPerfil(u) { if (u) P.nativo('abrir', { url: 'https://www.instagram.com/' + encodeURIComponent(u) + '/' }); }
  async function trabajo(k, f) {
    if (U.trabajando[k]) return;
    U.trabajando[k] = true; pintar();
    try { return await f(); } catch (e) { toast(errTxt(e)); } finally { delete U.trabajando[k]; pintar(); }
  }

  var ACC = {
    'intro-sig': function () { if (U.paso < 4) { U.paso++; pintar(); } else ACC['intro-fin'](); },
    'intro-fin': function () { M.estado.intro = true; M.guardar(); pintar(); scrollTo(0, 0); },
    'login': function () { P.nativo('mostrarInstagram', {}); },
    'ir-inicio': function () { U.cargando = false; U.tab = 'hoy'; pintar(); },
    'reanudar': function () {
      M.pausar(false);
      toast('Listo. Pulsa «Revisar ahora» una sola vez.');
    },
    'revisar': function () {
      if (M.estado.pausa) return toast('La app está en pausa');
      var r = M.estado.rate;
      if (r && Date.now() < r.until) return toast('Instagram pidió esperar. Lo vuelvo a intentar solo a las ' + hora(r.until));
      M.revisar(true);
    },
    'buscar-act': function () {
      if (P.demo) return toast('En el navegador no hay actualizaciones');
      U.buscando = true; pintar();
      P.nativo('buscarActualizacion', {}).then(function (r) {
        U.buscando = false;
        if (!r || r.error) { toast('No he podido mirar: ' + String(r && r.error || 'sin respuesta').slice(0, 50)); return pintar(); }
        if (r.apk) { U.actu = { apk: true }; U.hojaAbierta = null; toast('Hay una versión nueva de la app'); }
        else if (r.web) { toast('Actualizando…'); P.nativo('aplicarActualizacion', {}); }
        else toast('Ya tienes la última versión ✓');
        pintar();
      });
    },
    'aplicar-act': function () { U.actu = null; P.nativo('aplicarActualizacion', {}); },
    'instalar-apk': function () { toast('Descargando la app nueva…'); P.nativo('instalarApk', {}); },
    'auto': function () { M.automatico(!M.estado.auto); toast(M.estado.auto ? 'Revisará sola cada 6 h' : 'Solo cuando pulses «Revisar ahora»'); pintar(); },
    'pausa': function () { M.pausar(!M.estado.pausa); toast(M.estado.pausa ? 'En pausa: no le pido nada a Instagram' : 'Reanudada'); pintar(); },
    'diag': function () { U.diag = null; abrir('diag'); },
    'probar': function () {
      U.diag = { cargando: true }; pintar();
      P.ig('probar', []).then(function (r) { U.diag = r || { yo: null }; }).catch(function (e) { U.diag = { yo: '?', usado: errTxt(e) }; }).finally(pintar);
    },
    'ampliar': function () { U.hojaAbierta = null; P.nativo('mostrarInstagram', {}); },
    'ajustes': function () { abrir('ajustes'); if (!P.demo) P.ig('gasto', []).then(function (g) { U.gasto = g; if (U.hojaAbierta === 'ajustes') pintar(); }).catch(function () {}); if (!P.demo) P.nativo('version', {}).then(function (v) { if (v) { U.ver = v; if (U.hojaAbierta === 'ajustes') pintar(); } }); },
    'ayuda': function () { toast('Instagram frena si se le pide mucho. Espera y vuelve a probar.'); },
    'ver-dejaron': function () { U.tab = 'personas'; U.seg = 'unfollow'; U.busca = ''; U.sel = null; pintar(); scrollTo(0, 0); },
    'pro': function () { U.proQue = null; abrir('pro'); },
    'cerrar-hoja': function () { U.hojaAbierta = null; pintar(); },
    'comprar': function () { P.nativo('abrir', { url: 'https://ghoosted.net/#pricing' }); },
    'tengo-clave': function () { abrir('clave'); setTimeout(function () { var c = document.getElementById('clave'); if (c) c.focus(); }, 50); },
    'activar': function () {
      var k = valor('clave');
      trabajo('clave', async function () {
        var r = await M.activar(k);
        if (r && r.valid) { U.hojaAbierta = null; toast('Pro activado ✓'); }
        else toast(r && r.error === 'demasiados_intentos' ? 'Demasiados intentos, espera un poco' : r && r.error === 'red' ? 'Sin conexión' : 'Esa clave no vale para esta cuenta');
      });
    },
    'seleccionar': function () { U.sel = U.sel ? null : {}; pintar(); },
    'dejar': function (el) {
      var pk = el.getAttribute('data-pk');
      if (!M.esPro()) return abrirPro('Dejar de seguir');
      U.trabajando[pk] = true; pintar();
      M.dejarDeSeguir([pk]).then(function () { toast('Dejaste de seguirle'); }).catch(function (e) { toast(errTxt(e)); }).finally(function () { delete U.trabajando[pk]; pintar(); });
    },
    'dejar-sel': function () {
      var pks = Object.keys(U.sel || {}).filter(function (k) { return U.sel[k]; });
      if (!pks.length) return;
      U.sel = null;
      toast('Dejando de seguir a ' + pks.length + ', despacio…');
      M.dejarDeSeguir(pks, function (i, n) { toast(i + ' de ' + n); pintar(); })
        .then(function (h) { toast('Hecho: ' + h.length + ' de ' + pks.length); }).catch(function (e) { toast(errTxt(e)); });
    },
    'bandeja': function () { trabajo('tray', function () { return M.bandeja(); }); },
    'ver-historia': function (el) { abrirVisor([el.getAttribute('data-reel')]); },
    'ver-todas': function () {
      var t = M.estado.tray && M.estado.tray.list || [], q = U.buscaHis.toLowerCase().trim();
      if (q) t = t.filter(function (x) { return (x.username + ' ' + x.full_name).toLowerCase().indexOf(q) >= 0; });
      if (t.length) abrirVisor(t.slice(0, 30).map(function (x) { return x.reelId; }));
    },
    'cerrar-visor': function () { U.visor = null; clearTimeout(visorT); pintar(); },
    'visor-sig': function () { avanzar(1); },
    'visor-ant': function () { avanzar(-1); },
    'vigilar': function () {
      var n = valor('vigilar'); if (!n.trim()) return;
      trabajo('vig', async function () {
        try { var u = await M.vigilar(n); toast('Vigilando a @' + u.username); }
        catch (e) { if (e && e.kind === 'pro') return abrirPro('Vigilar más de 3 cuentas'); throw e; }
      });
    },
    'quitar-vigilar': function (el) { M.dejarDeVigilar(el.getAttribute('data-pk')); },
    'cargar-sol': function () { trabajo('sol', function () { return M.solicitudes(); }); },
    'aceptar': function (el) { if (!M.esPro()) return abrirPro('Aceptar solicitudes'); M.responder(el.getAttribute('data-pk'), true).catch(function (e) { toast(errTxt(e)); }); },
    'rechazar': function (el) { if (!M.esPro()) return abrirPro('Rechazar solicitudes'); M.responder(el.getAttribute('data-pk'), false).catch(function (e) { toast(errTxt(e)); }); },
    'aceptar-todas': function () { if (!M.esPro()) return abrirPro('Aceptar todas'); trabajo('sol', function () { return M.aceptarVarias(); }); },
    'comprobar': function () {
      var a = valor('cuentaA'), b = valor('cuentaB');
      if (!a.trim() || !b.trim()) return toast('Escribe las dos cuentas');
      trabajo('ab', async function () {
        var r = await M.seSiguen(a, b);
        function txt(x, y, s) { return '<b>@' + esc(x.username) + '</b> ' + (s == null ? 'no se puede saber (cuenta privada)' : s.follows ? 'sigue a' : 'no sigue a') + ' <b>@' + esc(y.username) + '</b>'; }
        U.ab = txt(r.a, r.b, r.ab) + '<br>' + txt(r.b, r.a, r.ba);
      });
    },
    'mis-historias': function () { if (!M.esPro()) return abrirPro('Quién ve tus historias'); trabajo('mis', function () { return M.misHistorias().then(function (it) { if (!it.length) toast('No tienes ninguna historia activa'); }); }); },
    'espectadores': function () { if (!M.esPro()) return abrirPro('Ranking de espectadores'); abrir('espectadores'); },
    'calcular': function () {
      trabajo('inter', function () { return M.interacciones(function (i, n) { U.trabajando.inter = i + '/' + n; pintar(); }); });
    },
    'borrar': function () {
      if (!confirm('¿Borrar todo lo guardado en este móvil? Tu clave Pro se mantiene.')) return;
      var S = M.estado;
      ['followers', 'following', 'counts', 'reqs', 'tray', 'inter', 'rate', 'error'].forEach(function (k) { S[k] = null; });
      S.events = []; S.history = []; S.activity = []; S.watch = []; S.stories = { viewers: {}, items: {}, hist: [], ts: 0 };
      M.guardar(); U.hojaAbierta = null; pintar(); toast('Borrado');
    },
    'cambiar': function () {
      /* Cerrar la sesion de la app y entrar de cero. Antes solo abria
         Instagram, y si la sesion de antes estaba atascada en un aviso de
         seguridad no habia manera de llegar a la pantalla de entrar. */
      if (!confirm('Voy a cerrar la sesión de Instagram dentro de Ghoosted para que entres con otra cuenta. Tu cuenta no se toca. ¿Sigo?')) return;
      U.hojaAbierta = null;
      M.pausar(false);
      toast('Cerrando sesión…');
      P.nativo('cerrarSesion', {}).then(function () {
        setTimeout(function () { P.nativo('mostrarInstagram', {}); }, 800);
      });
      pintar();
    },
    'salir': function () {
      if (!confirm('¿Cerrar la sesión de Instagram en esta app?')) return;
      U.hojaAbierta = null; M.pausar(false); P.nativo('cerrarSesion', {});
    }
  };

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-a],[data-tab],[data-seg],[data-act],[data-hist],[data-gen],[data-regla],[data-tema],[data-sel],[data-perfil]');
    if (!t) return;
    if (t.hasAttribute('data-a')) { var f = ACC[t.getAttribute('data-a')]; if (f) f(t); return; }
    if (t.hasAttribute('data-tab')) { U.tab = t.getAttribute('data-tab'); U.sel = null; pintar(true); scrollTo(0, 0);
      if (U.tab === 'historias' && !M.estado.tray && !U.trabajando.tray) ACC.bandeja();
      if (U.tab === 'actividad' && U.act === 'solicitudes' && !M.estado.reqs) ACC['cargar-sol']();
      return; }
    if (t.hasAttribute('data-seg')) { U.tab = 'personas'; U.seg = t.getAttribute('data-seg'); U.busca = ''; U.sel = null; pintar(); scrollTo(0, 0); return; }
    if (t.hasAttribute('data-act')) { U.act = t.getAttribute('data-act'); pintar(); if (U.act === 'solicitudes' && !M.estado.reqs) ACC['cargar-sol'](); return; }
    if (t.hasAttribute('data-gen')) { U.gen = t.getAttribute('data-gen'); pintar(); return; }
    if (t.hasAttribute('data-hist')) { U.hist = t.getAttribute('data-hist'); pintar(); return; }
    if (t.hasAttribute('data-regla')) { if (!M.esPro() && t.getAttribute('data-regla') !== 'manual') return abrirPro('Aprobar solicitudes automáticamente'); M.regla(t.getAttribute('data-regla')); return; }
    if (t.hasAttribute('data-tema')) { var v = t.getAttribute('data-tema'); if (v === 'sistema') { try { localStorage.removeItem('ghd_tema'); } catch (e) {} tema(); } else tema(v); pintar(); return; }
    if (t.hasAttribute('data-sel')) { var pk = t.getAttribute('data-sel'); U.sel[pk] = !U.sel[pk]; pintar(); return; }
    if (t.hasAttribute('data-perfil')) abrirPerfil(t.getAttribute('data-perfil'));
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'busca') { U.busca = ev.target.value; pintar(); }
    if (ev.target.id === 'buscaHis') { U.buscaHis = ev.target.value; pintar(); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    if (ev.target.id === 'vigilar') ACC.vigilar();
    if (ev.target.id === 'clave') ACC.activar();
    if (ev.target.id === 'cuentaB') ACC.comprobar();
  });

  /* ---------------- lo que llega del telefono ---------------- */
  P.escuchar(function (m) {
    if (m.tipo === 'sesion') {
      var antes = M.estado.yo;
      M.sesion(m);
      // Recien entrado y sin foto hecha: la pantalla de "Cargando" del lienzo.
      if (!antes && M.estado.yo && !M.estado.followers && M.estado.intro) { U.cargando = true; M.revisar(true); }
      else if (M.estado.yo && Date.now() >= (M.estado.nextCheck || 0)) M.revisar(false);
      M.reverificar();
      pintar();
    }
    if (m.tipo === 'atras') {
      if (U.visor) { U.visor = null; pintar(); }
      else if (U.hojaAbierta) { U.hojaAbierta = null; pintar(); }
      else if (U.tab !== 'hoy' && M.estado.yo) { U.tab = 'hoy'; pintar(); }
      else P.nativo('salirApp', {});
    }
    if (m.tipo === 'actualizacion') {
      if (m.error) { if (U.hojaAbierta === 'ajustes') toast('Actualización: ' + String(m.error).slice(0, 60)); }
      else if (m.web || m.apk) { U.actu = { apk: !!m.apk }; pintar(); }
    }
    if (m.tipo === 'volver') { P.nativo('buscarActualizacion', {}).then(function (r) { if (r && (r.web || r.apk)) { U.actu = { apk: !!r.apk }; pintar(); } }); }
    if (m.tipo === 'volver') { if (M.estado.yo && Date.now() >= (M.estado.nextCheck || 0)) M.revisar(false); pintar(); }
  });
  M.on(function (x) {
    if (x.fin && U.cargando) U.cargando = false;
    // Mientras se escribe no se repinta por el reloj: se perderia el foco.
    var act = document.activeElement;
    if (act && act.tagName === 'INPUT' && !x.fin) return;
    // El progreso llega varias veces por segundo: solo se repinta si se esta
    // mirando Hoy o la pantalla de carga. Repintarlo todo era lo que hacia ir
    // la app a tirones mientras revisaba.
    if (x.fase && !U.cargando && U.tab !== 'hoy') return;
    if (x.fase) { var ahora = Date.now(); if (ahora - (U.ultimoPinte || 0) < 400) return; U.ultimoPinte = ahora; }
    pintar();
  });
  setInterval(function () { if (!U.visor && !(document.activeElement && document.activeElement.tagName === 'INPUT')) pintar(); }, 30000);

  pintar();
  P.nativo('listo', {});
})();

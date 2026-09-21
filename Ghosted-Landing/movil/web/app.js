/* Ghoosted — las pantallas.
 *
 * Cada pantalla es una funcion que devuelve HTML con las mismas piezas del
 * lienzo (clases de app.css). Todo lo que viene de Instagram —nombres, @,
 * bios— lo escribe un tercero y pasa por esc() antes de pintarse. */
(function () {
  'use strict';
  var M = window.Motor, P = window.Puente, C = window.Cuenta;
  var $app = document.getElementById('app');

  /* ---------------- utilidades ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function num(n) { return Number(n || 0).toLocaleString('es-ES'); }
  function hace(ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (m < 1) return 'ahora'; if (m < 60) return m + ' min'; if (h < 24) return h + ' h'; if (d < 7) return d + ' d';
    return Math.floor(d / 7) + ' sem';
  }
  /* "3 h" o "12 min": lo que falta, en la unidad que se entiende de un
     vistazo. Por debajo de un minuto no se dice nada, ya casi esta. */
  function queda(ms) {
    var m = Math.ceil(ms / 60000);
    if (m >= 120) return Math.round(m / 60) + ' h';
    if (m >= 60) return Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '');
    return Math.max(1, m) + ' min';
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
    cerrar: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    bajar: '<path d="M12 3v11"/><path d="M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4.5 17.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"/>',
    ojo: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    ojo_no: '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4"/><path d="M6.6 7.9A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
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
            hojaAbierta: null, buscaHis: '', ab: null, calc: null, visor: null, trabajando: {},
            /* Puertas abiertas a lo Pro por la prueba. Solo dura lo que dura:
               en cuanto se gasta, se cierra sola y vuelve el muro. */
            cata: {},
            /* Lo que se esta buscando ahora mismo en Actividad. */
            sug: null,
            /* Lo escrito en el buscador de Actividad, para que sobreviva al
               repintado. */
            vig: '',
            /* Mientras se guarda una historia en el movil. */
            bajando: false,
            /* La persona cuya ficha esta abierta. */
            perfil: null,
            /* La lista de seguidores/seguidos que se esta mirando. */
            gente: null,
            /* La pantalla de la cuenta de Ghoosted. */
            cuentaModo: 'entrar', cCorreo: '', cClave: '', verClave: false, cuentaError: null, cuentaCorreoPendiente: null };

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
  /* LA CUENTA DE GHOOSTED. Va antes que todo: antes de Instagram, antes de
     la presentacion. Es la que lleva el plan, asi que sin ella no se sabe
     que puede hacer quien abre la app.
     Registrarse y entrar son la MISMA pantalla con un interruptor: son dos
     campos iguales y separarlas en dos pantallas solo hace que la gente se
     equivoque de sitio y crea que no tiene cuenta. */
  /* LA SALIDA DE EMERGENCIA.
     Si esta pantalla se atasca —y se atasco: el registro se quedo sin
     correos que mandar— la app entera queda encerrada detras de ella, con el
     boton de actualizar dentro. O sea que un fallo aqui no se puede arreglar
     actualizando, que es justo como se arregla todo lo demas. Nunca mas: el
     aviso de version nueva y el boton de buscarla viven tambien aqui. */
  function salidaEmergencia() {
    var banda = U.actu
      ? '<div class="gratis vidrio"><div><b>' + (U.actu.apk ? 'Hay una versión nueva de la app' : 'Versión nueva lista') + '</b>' +
        '<span>' + (U.actu.apk ? 'Se descarga e instala desde aquí' : 'Pulsa para usarla ya') + '</span></div>' +
        '<button data-a="' + (U.actu.apk ? 'instalar-apk' : 'aplicar-act') + '">Actualizar</button></div>'
      : '';
    return banda + '<button class="inicio" data-a="buscar-act">' +
      (U.buscando ? 'Buscando…' : '¿Algo no va? Buscar actualización') + '</button>';
  }

  function pantallaCuenta() {
    var modo = U.cuentaModo || 'entrar';
    var esperar = !!U.trabajando.cuenta;
    var pendiente = U.cuentaCorreoPendiente;
    if (pendiente) {
      return '<div class="intro"><div class="intro-top centro">' + wm(true) + '</div><div class="intro-medio centro">' +
        '<div class="icono p112" aria-hidden="true"><div></div><span><span></span></span><span><span></span></span></div>' +
        '<div class="titulo"><h1>Mira tu correo</h1><p>Te hemos mandado un enlace a <b>' + esc(pendiente) + '</b>. Púlsalo y vuelve aquí para entrar.</p></div>' +
        '</div><div class="intro-bajo"><div class="fila-btn"><button class="negro grande" data-a="cuenta-ya-confirme">Ya lo he confirmado</button></div>' +
        '<button class="inicio" data-a="cuenta-otro-correo">Usar otro correo</button>' + salidaEmergencia() + '</div></div>';
    }
    return '<div class="intro"><div class="intro-top centro">' + wm(true) + '</div><div class="intro-medio g24">' +
      '<div style="display:flex;justify-content:center"><div class="icono p112" aria-hidden="true"><div></div><span><span></span></span><span><span></span></span></div></div>' +
      '<div class="titulo"><h1>' + (modo === 'entrar' ? 'Entra en Ghoosted' : 'Crea tu cuenta') + '</h1>' +
      '<p>' + (modo === 'entrar' ? 'Con tu cuenta de Ghoosted. La de Instagram va después y es aparte.'
                                 : 'Es la cuenta de Ghoosted, donde vive tu plan. No es la de Instagram.') + '</p></div>' +
      segs([['entrar', 'Entrar'], ['crear', 'Crear cuenta']], modo, 'cuentamodo', true) +
      '<div class="pasos-login">' +
      '<label class="busca h50"><span class="sr">Correo</span><input type="email" id="cCorreo" inputmode="email" autocapitalize="off" autocomplete="email" placeholder="tu@correo.com" value="' + esc(U.cCorreo || '') + '"></label>' +
      '<div class="clave-caja"><label class="busca h50"><span class="sr">Contraseña</span>' +
      '<input type="' + (U.verClave ? 'text' : 'password') + '" id="cClave" autocomplete="' + (modo === 'entrar' ? 'current-password' : 'new-password') + '" placeholder="Contraseña" value="' + esc(U.cClave || '') + '"></label>' +
      '<button class="ojo" data-a="ver-clave" aria-label="' + (U.verClave ? 'Ocultar la contraseña' : 'Ver la contraseña') + '">' + ico(U.verClave ? I.ojo_no : I.ojo, 20, 1.8) + '</button></div>' +
      (U.cuentaError ? '<p class="nota" style="color:var(--rosa-txt);padding:0 4px">' + esc(U.cuentaError) + '</p>' : '') +
      '</div></div>' +
      '<div class="intro-bajo"><div class="fila-btn"><button class="negro grande' + (esperar ? ' gira' : '') + '" data-a="cuenta-ir">' +
      (modo === 'entrar' ? 'Entrar' : 'Crear cuenta') + '</button></div>' +
      '<p class="nota" style="text-align:center">Tu contraseña de Ghoosted no tiene nada que ver con la de Instagram, y nunca te pedimos la suya.</p>' +
      salidaEmergencia() + '</div></div>';
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
    return '<div class="vacio"><span class="vi" aria-hidden="true">' + ico(icono, 46) + '</span><div class="vt"><b>' + t + '</b><span>' + d + '</span></div>' +
      (conBoton ? '<div class="fila-btn"><button class="negro h50" data-a="revisar">' + ico(I.revisar, 19, 2) + 'Revisar ahora</button></div>' : '') + '</div>';
  }
  /* Cuando una lista esta vacia no es un renglon gris: es lo unico que hay en
     la pantalla, asi que ocupa como tal. Icono grande en el degradado de la
     marca y el texto debajo, centrado. Antes parecia un error. */
  function vaciaFila(icono, t, d) {
    return '<div class="vacia-fila"><div class="vi" aria-hidden="true">' + ico(icono, 34) + '</div><div class="vt"><b>' + t + '</b><span>' + d + '</span></div></div>';
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
    // Una revision al dia: el boton lo dice en vez de no hacer nada al
    // pulsarlo, que es lo que lleva a pulsarlo diez veces.
    var falta = M.faltaParaRevisar();
    var btn = '<div class="fila-btn"><button class="negro' + (ocup ? ' gira' : '') + (falta && !ocup ? ' espera' : '') + '" data-a="revisar">' +
      ico(falta && !ocup ? I.reloj_arena : I.revisar, 19, 2) +
      (ocup ? 'Revisando…' : falta ? 'Ya revisado hoy · ' + queda(falta) : 'Revisar ahora') + '</button></div>';
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
      /* "Seleccionar" ya no se esconde a quien no tiene Pro: se veia la
         lista de quien no te sigue y no habia NADA que dijera que se podia
         hacer algo con ella. Ahora esta, con su chapa, y al pulsarla se
         explica. Esconder una funcion no la vende; enseñarla, si. */
      (U.seg === 'notback' ? '<button class="enlace" data-a="seleccionar">' + (U.sel ? 'Cancelar' : 'Seleccionar') + (esPro ? '' : pro()) + '</button>' : '') + '</div>';
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
    // Lo primero que se ve es la pantalla de desbloquear. La prueba esta ahi
    // dentro, en un boton: se entra a probar, no se entra y ya.
    if (!M.esPro() && !U.cata.historias) {
      var quedaH = M.cataQueda('historia');
      return muroPro('Historias',
        quedaH ? 'Abre la historia de quien sea sin aparecer en su lista de espectadores. Te dejo probarlo con una, gratis.'
               : 'Ya has visto una historia sin aparecer en su lista de espectadores. Con Pro no hay límite.',
        [['Modo fantasma', 'Abre historias sin salir en la lista de espectadores.'],
         ['Quién ve las tuyas', 'La lista entera, y cuántas veces ha vuelto cada uno.'],
         ['Ranking de espectadores', 'Los más fieles, guardado para siempre.'],
         ['Descargas en HD', 'Historias, destacadas y publicaciones.']],
        quedaH ? ['probar-his', 'Probar con una gratis'] : null);
    }
    var q = U.buscaHis.toLowerCase().trim(), lista = q ? t.filter(function (x) { return (x.username + ' ' + x.full_name).toLowerCase().indexOf(q) >= 0; }) : t;
    var h = cabecera('Historias', '<div class="fantasma"><span class="pega">modo fantasma</span></div>' + (M.esPro() ? '' : '<span class="pro-chip">PRO</span>'));
    h += '<p class="sub">' + (S.tray ? num(t.length) + (t.length === 1 ? ' persona tiene' : ' personas tienen') + ' historia ahora. Ábrelas sin aparecer en su lista de espectadores.' : 'Mira las historias de quien sigues sin aparecer en su lista de espectadores.') + '</p>';
    h += '<div style="display:flex"><label class="busca h46">' + ico(I.lupa, 19, 2) + '<span class="sr">Buscar</span><input type="text" id="buscaHis" placeholder="Busca a alguien" value="' + esc(U.buscaHis) + '"></label></div>';
    h += M.esPro() ? '' : (M.cataQueda('historia')
        ? '<div class="gratis vidrio"><div><b>Te queda una historia de prueba</b><span>Ábrela y verás cómo es: no sales en su lista de espectadores</span></div><button data-a="pro">Pasar a Pro</button></div>'
        : '<div class="gratis vidrio"><div><b>Prueba gastada</b><span>Esta es la última vez que ves esta pantalla sin Pro</span></div><button data-a="pro">Pasar a Pro</button></div>');
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

  /* Las sugerencias mientras escribes. En la extension estaban y aqui no:
     habia que acertar el @ exacto de memoria, y si te equivocabas no pasaba
     nada — ni un aviso. */
  function sugerencias() {
    var g = U.sug;
    if (!g || !g.q) return '';
    if (!g.lista.length) return '<div class="sug"><div class="sug-nada">' +
      (g.cargando ? 'Buscando…' : 'No encuentro a nadie con «' + esc(g.q) + '»') + '</div></div>';
    // Con gente ya en pantalla, lo de fuera se añade debajo sin tapar nada.
    var nMios = (g.propios || g.lista).length;
    return '<div class="sug">' + g.lista.map(function (p, i) {
      // Una linea que separa a tu gente de la que viene de Instagram: si no,
      // aparecen desconocidos mezclados con los tuyos y no se entiende.
      var cab = (i === nMios && nMios > 0) ? '<div class="sug-cab">En Instagram</div>' : '';
      return cab + '<button class="sug-fila" data-a="elegir-sug" data-user="' + esc(p.username) + '">' + av(p) +
        '<div class="quien"><b>' + esc(p.full_name || p.username) + '</b><span>@' + esc(p.username) +
        (p.is_private ? ' · privada' : '') + '</span></div></button>';
    }).join('') + (g.cargando ? '<div class="sug-nada">Buscando más en Instagram…</div>' : '') + '</div>';
  }

  /* ---------------- Actividad ---------------- */
  var TIPO = { name: 'Cambió el nombre', username: 'Cambió el usuario', photo: 'Cambió la foto de perfil', bio: 'Cambió la bio', follow_add: 'Empezó a seguir a', follow_rem: 'Dejó de seguir a' };
  var TAG = { name: 'perfil', username: 'perfil', photo: 'foto', bio: 'perfil', follow_add: 'nuevo', follow_rem: 'sigue' };
  function actividad() {
    var S = M.estado, esPro = M.esPro();
    if (!esPro && !U.cata.actividad) {
      var quedaP = M.cataQueda('persona');
      return muroPro('Actividad',
        quedaP ? 'Vigila a alguien y te aviso en cuanto cambie la foto, el nombre o la bio, o empiece a seguir a otra persona. Prueba con una, gratis.'
               : 'Ya has vigilado a una persona. Con Pro vigilas a quien quieras.',
        [['Vigila a quien quieras', 'Sin el límite de una.'],
         ['Cambios de perfil', 'Foto, nombre, usuario y bio, en cuanto pasan.'],
         ['A quién empieza a seguir', 'Y a quién deja de seguir.'],
         ['¿Se siguen?', 'Comprueba dos cuentas a la vez.']],
        quedaP ? ['probar-act', 'Probar con una persona'] : null);
    }
    var nReq = S.reqs ? S.reqs.users.length : 0;
    var h = cabecera('Actividad') + segs([['cambios', 'Cambios', S.activity.length], ['solicitudes', 'Solicitudes', nReq]], U.act, 'act');
    if (U.act === 'cambios') {
      h += '<div class="vigilar"><label class="busca h46">' + ico(I.lupa, 19, 2) + /* El value es imprescindible: la pantalla se repinta entera cada vez que
           llega algo (la sesion, el reloj, una sugerencia) y sin el, lo que
           acabas de escribir se borra solo. Parte de "pongo un nombre y no va"
           era esto: el nombre ya no estaba cuando pulsabas Vigilar. */
        '<span class="sr">Vigilar usuario</span><input type="text" id="vigilar" placeholder="Busca a alguien para vigilar" autocapitalize="off" autocomplete="off" value="' + esc(U.vig || '') + '"></label>' +
        '<button class="negro h46" data-a="vigilar">Vigilar</button></div>' +
        '<div id="sugCaja">' + sugerencias() + '</div>' +
        (esPro ? '' : M.cataQueda('persona')
          ? '<div class="gratis vidrio"><div><b>Te queda una persona de prueba</b><span>Búscala y te aviso de todo lo que cambie en su perfil</span></div><button data-a="pro">Pasar a Pro</button></div>'
          : '<div class="gratis vidrio"><div><b>Prueba gastada</b><span>Ya vigilas a una. Con Pro, a quien quieras</span></div><button data-a="pro">Pasar a Pro</button></div>');
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
  /* EL MURO. Historias y Actividad son de Pro, pero se prueban antes de
     pagar: una historia y una persona. Gastada la prueba, el apartado entero
     pasa a ser esta pantalla, en vez de pedir la clave en una esquina.
     La barra de abajo se queda: esto no es una trampa, se sale cuando se
     quiere. Y lo primero que dice es lo que ya has probado, que es lo que
     convence — no "paga", sino "ya has visto como es". */
  function muroPro(titulo, probado, ventajas, probar) {
    return cabecera(titulo, '<span class="pro-chip">PRO</span>') +
      '<div class="muro">' +
      '<span class="muro-ico" aria-hidden="true">' + ico(I.candado, 26, 2) + '</span>' +
      '<h2>' + esc(titulo) + ' es de Pro</h2>' +
      '<p>' + esc(probado) + '</p>' +
      '<div class="ventajas">' + ventajas.map(function (x) {
        return '<div class="ventaja"><span class="ok" aria-hidden="true">' + ico(I.ok, 14, 2.6) + '</span><div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div></div>';
      }).join('') + '</div>' +
      '<div class="fila-btn"><button class="comprar" data-a="comprar"><b>Desbloquear por 5 €</b><span>Pago único · para siempre</span></button></div>' +
      (probar ? '<button class="probar" data-a="' + probar[0] + '">' + ico(I.play, 17) + probar[1] + '</button>' : '') +
      '<button class="tengo" data-a="tengo-clave">Ya lo compré · tengo una clave</button>' +
      '</div>';
  }

  /* LA FICHA DE UNA PERSONA.
     Antes, tocar a alguien te SACABA de Ghoosted y abria Instagram. Ahora se
     abre aqui dentro con todo lo que ya sabemos de esa persona sin pedir
     nada: si te sigue, si le sigues, de donde salio, y como se porta con tus
     historias. El expediente —lo que hay que preguntarle a Instagram— va
     detras de un boton, porque cada uno es una peticion. */
  function hojaPerfil() {
    var u = U.perfil; if (!u) return '';
    var s = M.loQueSe(u.username), d = u.pk ? M.expedienteGuardado(u.pk) : null;
    var p = (d || (s && s.user) || u);
    var etiquetas = [];
    if (s) {
      etiquetas.push(s.teSigue ? ['si', 'Te sigue'] : ['no', 'No te sigue']);
      etiquetas.push(s.leSigues ? ['si', 'Le sigues'] : ['no', 'No le sigues']);
      if (s.vigilada) etiquetas.push(['si', 'La vigilas']);
    }
    if (d) {
      if (d.is_private) etiquetas.push(['no', 'Privada']);
      if (d.is_verified) etiquetas.push(['si', 'Verificada']);
      if (d.is_business || d.is_pro) etiquetas.push(['si', d.category || 'Cuenta profesional']);
    }
    var h = '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Perfil"><div class="asa"><span></span></div>';
    h += '<div class="pf-cab">' + (d && (d.pic_hd || d.pic)
      ? '<button class="pf-foto" data-a="ver-foto" aria-label="Ver la foto grande">' + av(p) + '</button>'
      : av(p)) + '<div><b>' + esc(p.full_name || p.username) + '</b><span>@' + esc(p.username) + '</span></div></div>';
    if (etiquetas.length) h += '<div class="pf-etqs">' + etiquetas.map(function (e) {
      return '<span class="pf-etq ' + e[0] + '">' + esc(e[1]) + '</span>';
    }).join('') + '</div>';

    /* LAS ACCIONES, como en la extension. Lo de TikTok esta aqui porque es
       para lo que se usa de verdad: encuentras a alguien en Instagram y lo
       siguiente es ver si esta en TikTok. Van dos, porque el @ no siempre es
       el mismo en las dos redes: una al perfil directo y otra al buscador. */
    var tt = encodeURIComponent(p.username);
    h += '<div class="pf-acciones">' +
      '<button data-a="ir" data-url="https://www.tiktok.com/@' + esc(tt) + '">' + ico(I.play, 17) + 'TikTok</button>' +
      '<button data-a="ir" data-url="https://www.tiktok.com/search/user?q=' + esc(tt) + '">' + ico(I.lupa, 17, 2) + 'Buscar en TikTok</button>' +
      (s ? '<button data-a="' + (s.vigilada ? 'quitar-vigilar' : 'vigilar-a') + '" data-pk="' + esc(s.pk) + '" data-user="' + esc(p.username) + '">' +
        ico(I.actividad, 17, 2) + (s.vigilada ? 'Dejar de vigilar' : 'Vigilar') + '</button>' : '') +
      (d && (d.pic_hd || d.pic) ? '<button data-a="bajar-foto">' + ico(I.bajar, 17, 2) + 'Guardar foto' + pro() + '</button>' : '') +
      '<button data-a="copiar-id" data-id="' + esc((d && d.pk) || (s && s.pk) || '') + '">' + ico(I.cambio, 17, 2) + 'Copiar ID</button>' +
      '</div>';

    if (d) {
      h += '<div class="pf-cifras"><div><b>' + num(d.posts) + '</b><span>publicaciones</span></div>' +
        '<div><b>' + num(d.followers) + '</b><span>seguidores</span></div>' +
        '<div><b>' + num(d.following) + '</b><span>siguiendo</span></div></div>';
      if (d.bio) h += '<p class="pf-bio">' + esc(d.bio) + '</p>';
      var extra = [];
      if (d.pronouns) extra.push(['Pronombres', d.pronouns]);
      if (d.external_url) extra.push(['Web', d.external_url]);
      (d.bio_links || []).slice(0, 2).forEach(function (l) { if (l !== d.external_url) extra.push(['Enlace', l]); });
      if (d.category) extra.push(['Categoría', d.category]);
      if (d.public_email) extra.push(['Correo público', d.public_email]);
      if (d.public_phone) extra.push(['Teléfono público', d.public_phone]);
      if (d.address) extra.push(['Dirección', d.address]);
      if (extra.length) h += '<div class="pf-datos">' + extra.map(function (x) {
        return '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>';
      }).join('') + '</div>';

      /* Su gente. Cada lista es una peticion, asi que van detras de su
         boton y cuentan para el tope del dia. */
      h += '<div class="pf-sec">Su gente</div><div class="pf-acciones">' +
        '<button data-a="ver-gente" data-cual="seguidores"' + (U.trabajando.gente ? ' class="gira"' : '') + '>' +
        ico(I.personas, 17, 2) + 'Sus seguidores' + pro() + '</button>' +
        '<button data-a="ver-gente" data-cual="seguidos"' + (U.trabajando.gente ? ' class="gira"' : '') + '>' +
        ico(I.flecha, 17, 2) + 'A quién sigue' + pro() + '</button></div>';

      /* Destacadas: las portadas, en fila. */
      var dst = d.destacadas || [];
      if (dst.length) h += '<div class="pf-sec">Destacadas</div><div class="pf-dest">' + dst.map(function (x) {
        return '<button class="pf-d" data-a="ver-dest" data-id="' + esc(x.id) + '"><div class="aro"><div>' + (foto(x.full) || x.full ? '<img alt="" src="' + esc(foto(x.full) || x.full) + '" loading="lazy" onerror="this.remove()">' : '') + '</div></div>' +
          '<span>' + esc(x.title || '·') + '</span></button>';
      }).join('') + '</div>';

      /* Publicaciones, y con ellas el engagement: los me gusta y los
         comentarios vienen DENTRO de cada publicacion, asi que la media no
         cuesta ninguna peticion mas. */
      var ps = d.posts_lista || [];
      if (ps.length) {
        var conDatos = ps.filter(function (x) { return !x.likesHidden; });
        if (conDatos.length) {
          var ml = Math.round(conDatos.reduce(function (a, x) { return a + (x.likes || 0); }, 0) / conDatos.length);
          var mc = Math.round(conDatos.reduce(function (a, x) { return a + (x.comments || 0); }, 0) / conDatos.length);
          var tasa = d.followers ? (ml + mc) / d.followers * 100 : 0;
          h += '<div class="pf-sec">Sus números</div><div class="pf-cifras">' +
            '<div><b>' + num(ml) + '</b><span>me gusta de media</span></div>' +
            '<div><b>' + num(mc) + '</b><span>comentarios</span></div>' +
            (d.followers ? '<div><b>' + (tasa >= 10 ? Math.round(tasa) : tasa.toFixed(1)) + '%</b><span>de sus seguidores</span></div>' : '') +
            '</div>';
        } else {
          h += '<div class="pf-sec">Sus números</div><p class="nota" style="padding:0">Esconde los me gusta de sus publicaciones.</p>';
        }
        h += '<div class="pf-sec">Publicaciones · ' + num(ps.length) + '</div><div class="pf-posts">' + ps.map(function (x, i) {
          return '<button class="pf-post" data-a="ver-post" data-i="' + i + '">' +
            (foto(x.thumb) || x.thumb ? '<img alt="" src="' + esc(foto(x.thumb) || x.thumb) + '" loading="lazy" onerror="this.remove()">' : '') +
            (x.isVideo ? '<i class="pf-mark">' + ico(I.play, 14) + '</i>' : x.multi ? '<i class="pf-mark">' + num(x.slides) + '</i>' : '') +
            '</button>';
        }).join('') + '</div>';
      } else if (d.is_private) {
        h += '<div class="pf-sec">Publicaciones</div><p class="nota" style="padding:0">Es privada y no la sigues: Instagram no enseña nada.</p>';
      }
    }

    if (s && s.historias) h += '<div class="pf-datos"><div><span>Tus historias</span><b>' +
      num(s.historias.slides) + ' vistas · ' + num(s.historias.likes) + ' me gusta · ' + num(s.historias.dias) + ' días</b></div></div>';
    if (s && s.cambios.length) h += '<div class="pf-datos">' + s.cambios.map(function (c) {
      return '<div><span>hace ' + hace(c.ts) + '</span><b>' + esc(TIPO[c.type] || 'Cambió algo') + '</b></div>';
    }).join('') + '</div>';

    h += '<div class="h-bajo">';
    if (!d) {
      h += '<div class="fila-btn" style="align-self:stretch"><button class="negro' + (U.trabajando.exp ? ' gira' : '') + '" data-a="ver-exp">' +
        ico(I.lupa, 19, 2) + 'Ver expediente' + pro() + '</button></div>' +
        '<p class="nota" style="text-align:center">Una consulta a Instagram. Se guarda un día: volver a abrirla no gasta otra.</p>';
    }
    h += '<button class="tengo" data-a="abrir-ig">Abrir en Instagram</button></div></div>';
    return h;
  }

  /* La lista de sus seguidores o de a quien sigue. Instagram no la da
     entera nunca: da un trozo. Se dice, para que nadie cuente mal. */
  function hojaGente() {
    var g = U.gente; if (!g) return '';
    return '<div class="hoja-velo" data-a="cerrar-hoja"></div><div class="hoja" role="dialog" aria-label="Su gente"><div class="asa"><span></span></div>' +
      '<div class="h-cab"><h2>' + (g.cual === 'seguidores' ? 'Sus seguidores' : 'A quién sigue') + '</h2>' +
      '<p>@' + esc(g.de) + ' · una muestra de ' + num(g.lista.length) + ', no la lista entera: Instagram no la da completa.</p></div>' +
      '<div class="lista fina">' + (g.lista.length ? g.lista.map(function (u) {
        return '<div class="fila" data-perfil="' + esc(u.username) + '">' + av(u) +
          '<div class="quien"><b>' + esc(u.full_name || u.username) + '</b><span>@' + esc(u.username) +
          (u.is_private ? ' · privada' : '') + '</span></div></div>';
      }).join('') : vaciaFila(I.personas, 'No hay nada que enseñar', 'Instagram no ha dado la lista.')) + '</div></div>';
  }

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
      '<div class="ajuste"><span>Cuenta</span><span class="valor">' + esc(C.estado.correo || '—') + '</span></div>' +
      '<div class="ajuste"><span>Plan</span>' + (M.esPro() ? '<span class="valor">Pro ✓</span>' : '<button class="enlace" data-a="pro" style="height:auto">Pasar a Pro</button>') + '</div>' +
      '<div class="ajuste"><span>Tema</span>' + segs([['sistema', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']], g || 'sistema', 'tema', true).replace('class="segs', 'style="width:190px" class="segs') + '</div>' +
      '<div class="ajuste"><span>Última revisión</span><span class="valor">' + (S.lastCheck ? 'hace ' + hace(S.lastCheck) : '—') + '</span></div>' +
      '<div class="ajuste"><span>Instagram</span><button class="enlace" data-a="ampliar" style="height:auto">Abrir</button></div>' +
      '<div class="ajuste"><span>Versión' + (U.ver ? ' <span class="valor">' + U.ver.web + '·' + U.ver.apk + '</span>' : '') + '</span><button class="enlace" data-a="buscar-act" style="height:auto">' + (U.buscando ? 'Buscando…' : 'Buscar actualización') + '</button></div>' +
      '<div class="ajuste"><span>Peticiones a Instagram<span class="valor"> · tope por hora</span></span><span class="valor">' +
        (U.gasto ? U.gasto.hora + '/' + U.gasto.topeHora + ' · hoy ' + U.gasto.dia + '/' + U.gasto.topeDia : '—') + '</span></div>' +
      '<div class="ajuste"><span>Revisar sola una vez al día<span class="valor"> · con la app abierta</span></span><button class="enlace" data-a="auto" style="height:auto">' + (S.auto ? 'Sí, activado' : 'No, solo a mano') + '</button></div>' +
      '<div class="ajuste"><span>Pedir datos a Instagram</span><button class="enlace" data-a="' + (M.esPro() && false ? '' : 'pausa') + '" style="height:auto">' + (S.pausa ? 'Está en pausa · reanudar' : 'Pausar') + '</button></div>' +
      '<div class="ajuste"><span>Diagnóstico</span><button class="enlace" data-a="diag" style="height:auto">Ver</button></div>' +
      '<div class="ajuste"><span>Borrar los datos guardados</span><button class="enlace" data-a="borrar" style="height:auto">Borrar</button></div>' +
      '<div class="ajuste"><span>Cuenta</span><button class="enlace" data-a="cambiar" style="height:auto">Cambiar de cuenta</button></div>' +
      '<div class="ajuste"><span>Salir de Instagram</span><button class="rojo" data-a="salir">Cerrar sesión</button></div>' +
      '<div class="ajuste"><span>Salir de Ghoosted</span><button class="rojo" data-a="salir-cuenta">Cerrar mi cuenta</button></div>' + yo +
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
    return '<div class="visor"><div class="barras">' + barras + '</div><div class="quien-v">' + av(g.user) + '<b>' + esc(g.user.username) + '</b><span>' +
      // Las historias traen `takenAt` (en ms), no `ts`. Poniendo it.ts salia
      // "NaN sem" en la esquina SIEMPRE, en cualquier historia.
      (it.takenAt || it.ts ? hace(it.takenAt || it.ts) : '') + '</span>' +
      '<button aria-label="' + (U.bajando ? 'Guardando' : 'Guardar en el móvil') + '" data-a="bajar-historia"' + (U.bajando ? ' class="gira"' : '') + '>' + ico(I.bajar, 22, 2) + '</button>' +
      '<button aria-label="Cerrar" data-a="cerrar-visor">' + ico(I.cerrar, 24, 2) + '</button></div>' +
      '<div class="medio">' + medio + '<button class="zona izq" aria-label="Anterior" data-a="visor-ant"></button><button class="zona der" aria-label="Siguiente" data-a="visor-sig"></button></div>' +
      '<div class="pie">Modo fantasma · no apareces en su lista</div></div>';
  }
  /* `cata` = viene de la prueba gratis. Sin eso, esto era Pro y punto: se
     gastaba la prueba, se llamaba aqui, y aqui mismo saltaba la hoja de
     pago. O sea que la prueba no dejaba ver NADA y encima se consumia. */
  async function abrirVisor(reels, cata) {
    if (!M.esPro() && !cata) return abrirPro('Ver historias sin salir en la lista');
    toast('Cargando historias…');
    try {
      var tray = M.estado.tray.list, datos = await M.verHistorias(reels), grupos = [];
      reels.forEach(function (r) {
        var u = tray.find(function (x) { return String(x.reelId) === String(r); });
        var items = datos[r] || datos[u && u.pk] || [];
        if (u && items.length) grupos.push({ user: u, items: items });
      });
      if (!grupos.length) return toast('Ya no están disponibles');
      // Aqui, y no antes: la prueba se cobra cuando la historia esta en
      // pantalla. Si Instagram no la da, no se ha visto nada y no se paga.
      if (!M.esPro()) M.gastarCata('historia');
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
    if (!C.dentro() || !S.intro || !S.yo || U.cargando) {
      conBarra = false;
      // La cuenta de Ghoosted va primero: es la que dice que plan tienes.
      $app.innerHTML = !C.dentro() ? pantallaCuenta() : !S.intro ? intro() : !S.yo ? sinSesion() : cargando();
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
    document.body.classList.toggle('con-sug', !!(U.sug && (U.sug.lista.length || U.sug.cargando)));
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
    var html = ({ pro: hojaPro, clave: hojaClave, ajustes: hojaAjustes, espectadores: hojaEspectadores, diag: hojaDiag, perfil: hojaPerfil, gente: hojaGente })[quiere]();
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
  function abrirPerfil(u) {
    if (!u) return;
    var s = M.loQueSe(u);
    U.perfil = { username: String(u).replace(/^@+/, ''), pk: s && s.pk, full_name: s && s.user.full_name, pic: s && s.user.pic };
    U.hojaAbierta = 'perfil';
    pintar();
  }
  async function trabajo(k, f) {
    if (U.trabajando[k]) return;
    U.trabajando[k] = true; pintar();
    try { return await f(); } catch (e) { toast(errTxt(e)); } finally { delete U.trabajando[k]; pintar(); }
  }

  /* EL AVISO ANTES DE CERRAR SESION.
     Instagram apunta una sesion nueva cada vez que se entra, y cerrar sesion
     aqui borra las cookies: la siguiente entrada es una sesion de cero.
     Hacerlo varias veces en un rato es lo que dispara "no puedes crear
     varias sesiones", y no tiene NADA que ver con cuantos datos pidas. Si ya
     van varias hoy, se dice con todas las letras antes de sumar otra. */
  function avisoSesiones(que) {
    var n = M.sesionesHoy();
    if (n < 2) return confirm('Voy a cerrar la sesión de Instagram dentro de Ghoosted. Tu cuenta no se toca. ¿Sigo?');
    return confirm('Cuidado: hoy ya has entrado ' + n + ' veces en Instagram desde la app.\n\n' +
      'Cada entrada cuenta como una sesión nueva, y encadenar varias es justo lo que hace que Instagram ' +
      'restrinja una cuenta («no puedes crear varias sesiones»). No tiene que ver con revisar tus seguidores.\n\n' +
      'Si puedes, deja pasar unas horas antes de ' + que + '. ¿Aun así sigo?');
  }

  var ACC = {
    'intro-sig': function () { if (U.paso < 4) { U.paso++; pintar(); } else ACC['intro-fin'](); },
    'intro-fin': function () { M.estado.intro = true; M.guardar(); pintar(); scrollTo(0, 0); },
    'login': function () { P.nativo('mostrarInstagram', {}); },
    'ver-clave': function () { U.verClave = !U.verClave; pintar(); },
    'cuenta-ir': function () {
      var correo = (U.cCorreo || valor('cCorreo') || '').trim(), clave = U.cClave || valor('cClave') || '';
      U.cCorreo = correo; U.cuentaError = null;
      if (!correo || correo.indexOf('@') < 1) { U.cuentaError = 'Escribe tu correo'; return pintar(); }
      if (clave.length < 6) { U.cuentaError = 'La contraseña son 6 letras o más'; return pintar(); }
      var crear = U.cuentaModo === 'crear';
      trabajo('cuenta', async function () {
        try {
          var r = crear ? await C.registrar(correo, clave) : await C.entrar(correo, clave);
          // Si el proyecto pide confirmar el correo, no hay sesion todavia.
          if (!r.dentro) { U.cuentaCorreoPendiente = r.confirmar; return pintar(); }
          U.cCorreo = ''; U.cClave = ''; U.verClave = false; U.cuentaError = null;
          pintar();
        } catch (e) { U.cuentaError = C.texto(e); pintar(); }
      });
    },
    'cuenta-ya-confirme': function () {
      U.cuentaCorreoPendiente = null; U.cuentaModo = 'entrar'; U.cuentaError = null; pintar();
    },
    'cuenta-otro-correo': function () {
      U.cuentaCorreoPendiente = null; U.cCorreo = ''; U.cuentaError = null; pintar();
    },
    'salir-cuenta': function () {
      if (!confirm('¿Salir de tu cuenta de Ghoosted? Tus datos de Instagram se quedan en el móvil.')) return;
      U.hojaAbierta = null;
      C.salir().then(pintar);
    },
    'ir-inicio': function () { U.cargando = false; U.tab = 'hoy'; pintar(); },
    'reanudar': function () {
      M.pausar(false);
      toast('Listo. Pulsa «Revisar ahora» una sola vez.');
    },
    'revisar': function () {
      if (M.estado.pausa) return toast('La app está en pausa');
      var r = M.estado.rate;
      if (r && Date.now() < r.until) return toast('Instagram pidió esperar. Lo vuelvo a intentar solo a las ' + hora(r.until));
      var f = M.faltaParaRevisar();
      if (f) return toast('Ya has revisado hoy. Vuelve en ' + queda(f) + ' — es lo que evita que Instagram te marque');
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
    'auto': function () { M.automatico(!M.estado.auto); toast(M.estado.auto ? 'Revisará sola una vez al día' : 'Solo cuando pulses «Revisar ahora»'); pintar(); },
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
    'ir': function (el) { P.nativo('abrir', { url: el.getAttribute('data-url') }); },
    'vigilar-a': function (el) {
      var n = el.getAttribute('data-user');
      if (!M.cataQueda('persona')) return abrirPro('Vigilar a alguien');
      trabajo('vig', async function () {
        var u = await M.vigilar(n);
        M.gastarCata('persona');
        toast('Vigilando a @' + u.username);
      });
    },
    'copiar-id': function (el) {
      var id = el.getAttribute('data-id');
      if (!id) return toast('Todavía no sé su ID: abre el expediente');
      try { navigator.clipboard.writeText(id); toast('ID copiado'); } catch (e) { toast('No he podido copiar'); }
    },
    'bajar-foto': function () {
      if (!M.esPro()) return abrirPro('Descargar la foto de perfil');
      var p = U.perfil, d = p && p.pk && M.expedienteGuardado(p.pk);
      if (!d) return;
      if (P.demo) return toast('En el navegador no se puede guardar');
      if (U.bajando) return;
      U.bajando = true; pintar();
      P.nativo('guardarMedia', { url: d.pic_hd || d.pic, video: false, de: d.username })
        .then(function (r) { toast(r && r.ok ? 'Guardada en ' + (r.donde || 'tu galería') : 'No se pudo guardar: ' + String(r && r.error || '').slice(0, 40)); })
        .catch(function () { toast('No se pudo guardar'); })
        .finally(function () { U.bajando = false; pintar(); });
    },
    /* Tocar una publicacion la abre en el mismo visor de las historias. */
    'ver-post': function (el) {
      var p = U.perfil, d = p && p.pk && M.expedienteGuardado(p.pk);
      if (!d) return;
      var x = (d.posts_lista || [])[Number(el.getAttribute('data-i'))];
      if (!x) return;
      U.hojaAbierta = null;
      U.visor = { grupos: [{ user: { username: d.username, full_name: d.full_name, pic: d.pic },
        items: [{ url: x.full || x.thumb, img: x.thumb, isVideo: !!x.isVideo, takenAt: x.ts }] }], g: 0, i: 0 };
      pintar(); temporizar();
    },
    'ver-foto': function () {
      var p = U.perfil, d = p && p.pk && M.expedienteGuardado(p.pk);
      if (!d) return;
      U.hojaAbierta = null;
      U.visor = { grupos: [{ user: d, items: [{ url: d.pic_hd || d.pic, img: d.pic, isVideo: false, takenAt: 0 }] }], g: 0, i: 0 };
      pintar(); temporizar();
    },
    'ver-dest': function (el) {
      if (!M.esPro()) return abrirPro('Ver sus destacadas');
      var p = U.perfil, d = p && p.pk && M.expedienteGuardado(p.pk);
      if (!d) return;
      var id = el.getAttribute('data-id');
      toast('Abriendo la destacada…');
      M.historiasDestacada(id).then(function (items) {
        if (!items.length) return toast('No he podido abrirla');
        U.hojaAbierta = null;
        U.visor = { grupos: [{ user: d, items: items }], g: 0, i: 0 };
        pintar(); temporizar();
      }).catch(function (e) { toast(errTxt(e)); });
    },
    'ver-gente': function (el) {
      if (!M.esPro()) return abrirPro('Ver sus seguidores');
      var p = U.perfil; if (!p || !p.pk) return;
      var cual = el.getAttribute('data-cual');
      trabajo('gente', async function () {
        try {
          var lista = await M.genteDe(p.pk, cual);
          U.gente = { cual: cual, lista: lista, de: p.username };
          U.hojaAbierta = 'gente';
          pintar();
        } catch (e) {
          if (e && e.kind === 'tope_exp') return toast('Ya has hecho ' + M.EXP_DIA + ' consultas hoy. Mañana más');
          throw e;
        }
      });
    },
    'abrir-ig': function () {
      var u = U.perfil && U.perfil.username; if (!u) return;
      P.nativo('abrir', { url: 'https://www.instagram.com/' + encodeURIComponent(u) + '/' });
    },
    'ver-exp': function () {
      if (!M.esPro()) return abrirPro('El expediente de una persona');
      var p = U.perfil; if (!p) return;
      trabajo('exp', async function () {
        try { await M.expediente(p.pk, p.username); }
        catch (e) {
          if (e && e.kind === 'tope_exp') return toast('Ya has abierto ' + M.EXP_DIA + ' expedientes hoy. Mañana más — es lo que evita que Instagram te marque');
          throw e;
        }
      });
    },
    'comprar': function () { P.nativo('abrir', { url: 'https://ghoosted.net/#pricing' }); },
    'tengo-clave': function () { abrir('clave'); setTimeout(function () { var c = document.getElementById('clave'); if (c) c.focus(); }, 50); },
    'activar': function () {
      var k = valor('clave');
      trabajo('clave', async function () {
        var r = await M.activar(k);
        if (r && r.valid) { U.hojaAbierta = null; toast('Pro activado ✓'); }
        else {
          // "Esa clave no vale para esta cuenta" se decia para TODO, incluso
          // cuando el problema era que no habias entrado en Instagram o que
          // la clave era de Plus. Cada motivo tiene el suyo.
          var CLAVE_MAL = {
            demasiados_intentos: 'Demasiados intentos, espera un poco',
            red: 'Sin conexión',
            sin_sesion: 'Entra antes en tu Instagram desde la app',
            account: 'Entra antes en tu Instagram desde la app',
            vacia: 'Escribe la clave',
            invalid: 'Esa clave no existe. Míralo bien, o recupérala en ghoosted.net',
            bound: 'Esa clave ya está en uso en otra cuenta de Instagram',
            revoked: 'Esa clave está anulada',
            expired: 'Esa clave ha caducado',
            wrong_product: 'Esa clave es de Ghoosted Plus y aquí hace falta una de Pro'
          };
          toast(CLAVE_MAL[r && r.error] || 'Esa clave no vale para esta cuenta');
        }
      });
    },
    'seleccionar': function () {
      if (!M.esPro()) return abrirPro('Dejar de seguir a varios a la vez');
      U.sel = U.sel ? null : {}; pintar();
    },
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
    'probar-his': function () { U.cata.historias = true; pintar(); },
    'probar-act': function () { U.cata.actividad = true; pintar(); },
    'ver-historia': function (el) {
      if (!M.cataQueda('historia')) { U.cata.historias = false; return pintar(); }
      abrirVisor([el.getAttribute('data-reel')], true);
    },
    'ver-todas': function () {
      // Verlas todas de una no es la prueba: eso ya es la funcion entera. Y
      // no cuesta la prueba: no se cobra por enseñar el muro.
      if (!M.esPro()) { U.cata.historias = false; return pintar(); }
      var t = M.estado.tray && M.estado.tray.list || [], q = U.buscaHis.toLowerCase().trim();
      if (q) t = t.filter(function (x) { return (x.username + ' ' + x.full_name).toLowerCase().indexOf(q) >= 0; });
      if (t.length) abrirVisor(t.slice(0, 30).map(function (x) { return x.reelId; }));
    },
    /* Guardar la historia que se esta viendo. La descarga la hace la parte
       nativa: un WebView no puede escribir en el telefono, y ademas las URL
       de Instagram solo las da su CDN si se piden con la cabecera correcta. */
    'bajar-historia': function () {
      if (!M.esPro()) return abrirPro('Descargar historias');
      var v = U.visor; if (!v) return;
      var g = v.grupos[v.g], it = g && g.items[v.i];
      if (!it) return;
      if (P.demo) return toast('En el navegador no se puede guardar');
      if (U.bajando) return;
      U.bajando = true; pintar();
      P.nativo('guardarMedia', { url: it.url, video: !!it.isVideo, de: g.user.username })
        .then(function (r) {
          toast(r && r.ok ? 'Guardado en ' + (r.donde || 'tu galería') : 'No se pudo guardar: ' + String(r && r.error || '').slice(0, 40));
        })
        .catch(function () { toast('No se pudo guardar'); })
        .finally(function () { U.bajando = false; pintar(); });
    },
    'cerrar-visor': function () { U.visor = null; clearTimeout(visorT); pintar(); },
    'visor-sig': function () { avanzar(1); },
    'visor-ant': function () { avanzar(-1); },
    'vigilar': function () {
      var n = U.vig || valor('vigilar'); if (!n.trim()) return;
      if (!M.cataQueda('persona')) { U.cata.actividad = false; return pintar(); }
      trabajo('vig', async function () {
        try {
          var u = await M.vigilar(n);
          // Se gasta cuando se ha vigilado a alguien de verdad, no al
          // escribir: si el nombre no existe, la prueba sigue entera.
          M.gastarCata('persona');
          U.sug = null; U.vig = '';
          toast('Vigilando a @' + u.username);
        }
        catch (e) { if (e && e.kind === 'pro') return abrirPro('Vigilar más de 3 cuentas'); throw e; }
      });
    },
    'elegir-sug': function (el) {
      U.vig = el.getAttribute('data-user');
      U.sug = null;
      ACC.vigilar();
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
      if (!avisoSesiones('cambiar de cuenta')) return;
      U.hojaAbierta = null;
      M.pausar(false);
      toast('Cerrando sesión…');
      P.nativo('cerrarSesion', {}).then(function () {
        setTimeout(function () { P.nativo('mostrarInstagram', {}); }, 800);
      });
      pintar();
    },
    'salir': function () {
      if (!avisoSesiones('cerrar sesión')) return;
      U.hojaAbierta = null; M.pausar(false); P.nativo('cerrarSesion', {});
    }
  };

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-a],[data-tab],[data-seg],[data-act],[data-hist],[data-gen],[data-regla],[data-tema],[data-cuentamodo],[data-sel],[data-perfil]');
    if (!t) return;
    if (t.hasAttribute('data-a')) { var f = ACC[t.getAttribute('data-a')]; if (f) f(t); return; }
    if (t.hasAttribute('data-tab')) {
      /* Al salir del apartado se cierra la puerta que abrio la prueba. NO al
         usarla: si se cerraba en el momento de abrir la historia o de vigilar
         a alguien, se volvia al muro sin haber llegado a ver lo que se
         acababa de hacer. Parecia que no funcionaba nada. */
      if (t.getAttribute('data-tab') !== U.tab) U.cata = {};
      U.tab = t.getAttribute('data-tab'); U.sel = null; pintar(true); scrollTo(0, 0);
      if (U.tab === 'historias' && !M.estado.tray && !U.trabajando.tray) ACC.bandeja();
      if (U.tab === 'actividad' && U.act === 'solicitudes' && !M.estado.reqs) ACC['cargar-sol']();
      return; }
    if (t.hasAttribute('data-seg')) { U.tab = 'personas'; U.seg = t.getAttribute('data-seg'); U.busca = ''; U.sel = null; pintar(); scrollTo(0, 0); return; }
    if (t.hasAttribute('data-act')) { U.act = t.getAttribute('data-act'); pintar(); if (U.act === 'solicitudes' && !M.estado.reqs) ACC['cargar-sol'](); return; }
    if (t.hasAttribute('data-gen')) { U.gen = t.getAttribute('data-gen'); pintar(); return; }
    if (t.hasAttribute('data-hist')) { U.hist = t.getAttribute('data-hist'); pintar(); return; }
    if (t.hasAttribute('data-regla')) { if (!M.esPro() && t.getAttribute('data-regla') !== 'manual') return abrirPro('Aprobar solicitudes automáticamente'); M.regla(t.getAttribute('data-regla')); return; }
    if (t.hasAttribute('data-cuentamodo')) { U.cuentaModo = t.getAttribute('data-cuentamodo'); U.cuentaError = null; pintar(); return; }
    if (t.hasAttribute('data-tema')) { var v = t.getAttribute('data-tema'); if (v === 'sistema') { try { localStorage.removeItem('ghd_tema'); } catch (e) {} tema(); } else tema(v); pintar(); return; }
    if (t.hasAttribute('data-sel')) { var pk = t.getAttribute('data-sel'); U.sel[pk] = !U.sel[pk]; pintar(); return; }
    if (t.hasAttribute('data-perfil')) abrirPerfil(t.getAttribute('data-perfil'));
  });
  /* Se espera a que pare de escribir. Cada busqueda es una peticion a
     Instagram, y disparar una por tecla es justo lo que no se puede hacer. */
  /* Repintar SOLO las sugerencias. Antes, cada tecla repintaba la pantalla
     entera de Actividad —la lista de cambios, a quien vigilas, los
     selectores, la capsula que viaja— y en un telefono eso se nota: la app
     se atascaba mientras escribias. Aqui se cambia un solo nodo. */
  function pintarSug() {
    var caja = document.getElementById('sugCaja');
    if (!caja) return;
    caja.innerHTML = sugerencias();
    document.body.classList.toggle('con-sug', !!(U.sug && (U.sug.lista.length || U.sug.cargando)));
  }

  var sugT = 0;
  function buscarLuego(q) {
    clearTimeout(sugT);
    q = String(q || '').replace(/^@+/, '').trim();
    if (!q) { if (U.sug) { U.sug = null; pintarSug(); } return; }
    /* DESDE LA PRIMERA LETRA. Lo de tu gente sale YA, sin esperar y sin
       pedirle nada a Instagram: tus seguidores y a quien sigues estan en el
       telefono. Para casi todo lo que se quiere vigilar, con esto basta. */
    var locales = M.buscarLocal(q);
    /* Con una o dos letras, solo lo tuyo: a Instagram no se le pregunta por
       "m" porque contesta con los famosos del mundo.
       A partir de TRES letras se busca fuera SIEMPRE, aunque tu gente ya
       llene la lista: si escribes tres letras es que buscas a alguien
       concreto, y puede no ser de los tuyos. Antes, si tenias muchos
       seguidores que encajaban, no salia nunca nadie de fuera. */
    var fuera = q.length >= 3;
    U.sug = { q: q, propios: locales.slice(0, 5), lista: locales.slice(0, 5), cargando: fuera };
    if (!fuera) { U.sug.lista = locales; U.sug.propios = locales; }
    pintarSug();
    if (!fuera) return;
    sugT = setTimeout(function () {
      M.buscarGente(q).then(function (l) {
        // Si ya se esta buscando otra cosa, esta respuesta llega tarde.
        if (!U.sug || U.sug.q !== q) return;
        var hay = {};
        var mios = locales.slice(0, 5);
        mios.forEach(function (u) { hay[u.pk] = 1; });
        var otros = (l || []).filter(function (u) { return !hay[u.pk]; }).slice(0, 5);
        U.sug = { q: q, propios: mios, lista: mios.concat(otros), cargando: false }; pintarSug();
      });
    }, 500);
  }

  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'busca') { U.busca = ev.target.value; pintar(); }
    if (ev.target.id === 'buscaHis') { U.buscaHis = ev.target.value; pintar(); }
    if (ev.target.id === 'vigilar') { U.vig = ev.target.value; buscarLuego(ev.target.value); }
    // Lo de la cuenta se guarda tal cual: al enseñar u ocultar la contraseña
    // se repinta el campo, y sin esto se borraba lo escrito.
    if (ev.target.id === 'cCorreo') U.cCorreo = ev.target.value;
    if (ev.target.id === 'cClave') U.cClave = ev.target.value;
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
  /* Fuera la pantalla de arranque: ya hay algo que mirar. Se hace despues
     del primer pintar() y no antes, para que no haya ni un fotograma en
     blanco entre una cosa y la otra. */
  (function quitarArranque() {
    var a = document.getElementById('arranque');
    if (!a) return;
    requestAnimationFrame(function () {
      a.classList.add('fuera');
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 400);
    });
  })();
  P.nativo('listo', {});
})();

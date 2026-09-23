/* ==========================================================================
   LIQUID GLASS — el movimiento. Sin dependencias, ES5, vale en WebView.

     LiquidGlass.init()            coloca las cápsulas y engancha los clics
     LiquidGlass.recolocar()       después de repintar HTML (anima el salto)
     LiquidGlass.hoja(html, opc)   hoja de abajo, con arrastre para cerrar

   La idea que hace que se vea bien: la cápsula es UNA pieza que se mueve con
   transform. Si el HTML se repinta entero (muy común), el navegador estrena
   la cápsula ya colocada y no anima nada; por eso aquí se guarda la posición
   anterior de cada grupo y el viaje se lanza a mano.
   ========================================================================== */
window.LiquidGlass = (function () {
  'use strict';
  var anterior = {};   // grupo -> índice donde estaba

  function botones(g) {
    return Array.prototype.filter.call(g.children, function (n) { return n.tagName === 'BUTTON' || n.tagName === 'A'; });
  }
  function capsula(g) {
    var c = g.querySelector(':scope > .lg-capsula');
    if (!c) {
      c = document.createElement('span');
      c.className = 'lg-capsula';
      c.setAttribute('aria-hidden', 'true');
      g.insertBefore(c, g.firstChild);
    }
    return c;
  }
  function activo(g) {
    var bs = botones(g);
    for (var i = 0; i < bs.length; i++) if (bs[i].classList.contains('on')) return i;
    return 0;
  }
  function donde(i) { return 'translateX(calc(' + i + ' * (100% + 2px)))'; }

  /* Coloca la cápsula de un grupo. Si venía de otro sitio, hace el viaje. */
  function colocar(g, animar) {
    var bs = botones(g);
    if (!bs.length) return;
    var c = capsula(g), i = activo(g);
    var hueco = (g === document.body ? 8 : parseFloat(getComputedStyle(g).paddingLeft) * 2) || 8;
    c.style.width = 'calc((100% - ' + hueco + 'px - ' + (bs.length - 1) * 2 + 'px) / ' + bs.length + ')';
    var nombre = g.getAttribute('data-lg-grupo') || g.getAttribute('data-lg-tabs') || g.getAttribute('data-lg-segs') || 'lg';
    var antes = anterior[nombre];
    var salta = animar !== false && antes != null && antes !== i;
    if (salta) {
      c.style.transition = 'none';
      c.style.transform = donde(antes);
      void c.offsetWidth;            // fuerza al navegador a dibujarla ahí
      c.style.transition = '';
      c.classList.remove('lg-viaja');
      void c.offsetWidth;
      c.classList.add('lg-viaja');
      var b = bs[i];
      if (b) { b.classList.remove('lg-salta'); void b.offsetWidth; b.classList.add('lg-salta'); }
    }
    c.style.transform = donde(i);
    anterior[nombre] = i;
  }

  function grupos(raiz) {
    return (raiz || document).querySelectorAll('[data-lg-tabs],[data-lg-segs]');
  }

  /* Coloca todo sin animar: para después de repintar, cuando lo elegido no
     ha cambiado. Si ha cambiado, anima solo ese grupo. */
  function recolocar(raiz) {
    Array.prototype.forEach.call(grupos(raiz), function (g) { colocar(g, true); });
  }

  function init(raiz) {
    Array.prototype.forEach.call(grupos(raiz), function (g) { colocar(g, false); });
    if (init.enganchado) return;
    init.enganchado = true;
    // Un solo oyente para toda la página: vale también para lo que se cree
    // después.
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-lg-tabs] > button,[data-lg-tabs] > a,[data-lg-segs] > button,[data-lg-segs] > a');
      if (!b) return;
      var g = b.parentNode;
      botones(g).forEach(function (x) {
        var on = x === b;
        x.classList.toggle('on', on);
        if (x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed', String(on));
        if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
      });
      colocar(g, true);
      g.dispatchEvent(new CustomEvent('lg:cambio', {
        bubbles: true,
        detail: { valor: b.getAttribute('data-lg-valor') || b.textContent.trim(), indice: botones(g).indexOf(b), boton: b }
      }));
    });
    // Al girar el móvil cambian los anchos: se recolocan sin animar.
    window.addEventListener('resize', function () {
      Array.prototype.forEach.call(grupos(), function (g) { colocar(g, false); });
    });
  }

  /* ---------------- hojas ---------------- */
  var abierta = null;
  function hoja(contenido, opc) {
    opc = opc || {};
    cerrar(true);
    var caja = document.createElement('div');
    caja.className = 'lg-capa';
    caja.innerHTML = '<div class="lg-velo"></div><div class="lg-hoja" role="dialog" aria-modal="true"' +
      (opc.titulo ? ' aria-label="' + String(opc.titulo).replace(/"/g, '&quot;') + '"' : '') + '>' +
      (opc.asa === false ? '' : '<div class="lg-asa"><span></span></div>') + '</div>';
    var h = caja.querySelector('.lg-hoja');
    if (typeof contenido === 'string') h.insertAdjacentHTML('beforeend', contenido);
    else if (contenido) h.appendChild(contenido);
    document.body.appendChild(caja);
    caja.querySelector('.lg-velo').addEventListener('click', function () { cerrar(); });
    arrastrar(h);
    requestAnimationFrame(function () { caja.classList.add('lg-abierta'); });
    abierta = { caja: caja, hoja: h, alCerrar: opc.alCerrar };
    return { elemento: h, cerrar: cerrar };
  }
  function cerrar(inmediato) {
    var a = abierta;
    abierta = null;
    if (!a) return;
    if (inmediato) { a.caja.remove(); return; }
    a.caja.classList.add('lg-cerrando');
    setTimeout(function () { a.caja.remove(); }, 320);
    if (a.alCerrar) a.alCerrar();
  }
  /* Arrastrar hacia abajo para cerrar, como en iOS: si sueltas a medias
     vuelve a su sitio; si bajas bastante o das un tirón, se cierra. */
  function arrastrar(h) {
    var y0 = null, dy = 0, t0 = 0;
    h.addEventListener('touchstart', function (e) {
      if (h.scrollTop > 0) return;
      y0 = e.touches[0].clientY; dy = 0; t0 = Date.now();
      h.style.transition = 'none';
    }, { passive: true });
    h.addEventListener('touchmove', function (e) {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy < 0) dy = dy / 6;
      h.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    h.addEventListener('touchend', function () {
      if (y0 == null) return;
      var tiron = dy > 40 && Date.now() - t0 < 300;
      h.style.transition = '';
      h.style.transform = '';
      y0 = null;
      if (dy > 110 || tiron) cerrar();
    });
  }

  /* Marca el cuerpo que acaba de cambiar para que entre con el desplazamiento
     de iOS: LiquidGlass.entra(document.getElementById('vista')) */
  function entra(el) {
    if (!el) return;
    el.classList.remove('lg-entra');
    void el.offsetWidth;
    el.classList.add('lg-entra');
  }

  if (document.readyState !== 'loading') setTimeout(function () { init(); }, 0);
  else document.addEventListener('DOMContentLoaded', function () { init(); });

  return { init: init, recolocar: recolocar, colocar: colocar, hoja: hoja, cerrarHoja: cerrar, entra: entra };
})();

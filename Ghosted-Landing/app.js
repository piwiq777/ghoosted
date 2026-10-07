/* Ghoosted landing — config + wiring (nav, reveal, CTAs, i18n boot). */
(function () {
  'use strict';

  // ── Owner: set these two after publishing ──────────────────────────────
  const CONFIG = {
    // Chrome Web Store URL of your published extension. Leave '' until then;
    // the "Add to Chrome" buttons will point to the pricing section meanwhile.
    chromeUrl: '',
    // Your Gumroad product URL, e.g. 'https://YOURNAME.gumroad.com/l/ghosted'.
    // Leave '' until you create the product; buy buttons fall back to #pricing.
  };

  function ready(fn) {
    document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    GhostedI18n.init();

    // sticky nav border + top-alert shrink on scroll (big at rest, compact once scrolled)
    const nav = document.getElementById('nav');
    const topAlert = document.getElementById('topAlert');
    const onScroll = () => {
      const scrolled = window.scrollY > 8;
      nav.classList.toggle('scrolled', scrolled);
      if (topAlert) topAlert.classList.toggle('scrolled', scrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Menu plegable de movil. Se cierra al elegir destino, al tocar fuera y
    // con Escape; si se vuelve a escritorio se limpia el estado para que no
    // quede el panel abierto colgando sobre la barra.
    const burger = document.getElementById('navBurger');
    const navLinks = document.getElementById('navLinks');
    if (burger && navLinks) {
      const cerrar = function () {
        navLinks.classList.remove('abierto');
        burger.setAttribute('aria-expanded', 'false');
      };
      burger.addEventListener('click', function (e) {
        e.stopPropagation();
        const abierto = navLinks.classList.toggle('abierto');
        burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      });
      navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrar));
      document.addEventListener('click', function (e) {
        if (!navLinks.contains(e.target) && e.target !== burger) cerrar();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
      window.matchMedia('(min-width:861px)').addEventListener('change', cerrar);
    }

    // reveal-on-scroll
    //
    // OJO: esto pone TODA la pagina a opacity:0 y la devuelve a la vista solo
    // cuando el observador dispara. Si por lo que sea no dispara -- una pestana
    // que arranca en segundo plano, un viewport de altura 0, un rastreador, una
    // herramienta de captura -- el visitante ve una pagina en blanco con el
    // contenido perfectamente presente en el DOM. Ya nos ha pasado. Asi que el
    // efecto es un adorno y va montado como tal: se apaga solo ante la duda.
    const targets = document.querySelectorAll('.features-head,.section-head,.stats,.film,.worlds,.pcard,.faq-list,.fb-grid,.show');
    // Al rendirse se QUITA la clase 'reveal', no se anade 'in'. Anadir 'in'
    // deja el elemento dependiendo de una transicion de opacidad, y una
    // transicion no avanza en una pestana en segundo plano: se queda 'running'
    // para siempre y el elemento sigue pintandose a opacity 0. Quitar 'reveal'
    // borra la declaracion entera y el contenido aparece sin animacion, que es
    // justo lo que queremos cuando el efecto no se puede reproducir.
    const mostrarTodo = function () {
      targets.forEach((el) => { el.classList.remove('reveal'); el.classList.add('in'); });
    };
    // Una pestana abierta en segundo plano (clic con rueda, sesion restaurada)
    // o un rastreador no ejecutan ni transiciones ni observador. Ahi no se
    // esconde nada de entrada: el efecto es un lujo, el contenido no.
    if (document.visibilityState === 'hidden') {
      targets.forEach((el) => el.classList.add('in'));
    } else if ('IntersectionObserver' in window && window.innerHeight > 0) {
      targets.forEach((el) => el.classList.add('reveal'));
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      targets.forEach((el) => io.observe(el));

      // 1) Lo que ya esta en pantalla se muestra sin esperar al observador.
      //    Un elemento mas alto que la ventana nunca llega al 12% exigido.
      const enPantalla = function (el) {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      };
      targets.forEach((el) => { if (enPantalla(el)) el.classList.add('in'); });

      // 2) Red de seguridad: si a los 2,5 s sigue habiendo algo invisible
      //    dentro de la ventana, es que el observador no esta funcionando.
      //    Se descarta el efecto y se ensena la pagina entera.
      setTimeout(function () {
        const atascado = Array.from(targets).some((el) => !el.classList.contains('in') && enPantalla(el));
        if (atascado) { io.disconnect(); mostrarTodo(); }
      }, 2500);

      // 3) Y si el usuario llega a hacer scroll sin que se haya revelado nada,
      //    no se le deja seguir bajando por un vacio blanco.
      window.addEventListener('scroll', function alPrimerScroll() {
        window.removeEventListener('scroll', alPrimerScroll);
        if (!document.querySelector('.reveal.in')) { io.disconnect(); mostrarTodo(); }
      }, { passive: true, once: false });
    } else {
      targets.forEach((el) => el.classList.add('in'));
    }

    // Scroll-linked zoom on the showcase card: small on the way in, full size
    // while it sits in view, small again on the way out. Driven here rather
    // than with a CSS view() timeline so Firefox and Safari get it too.
    // TEMPORARY (2026-07-25): the prefers-reduced-motion guard is disabled so
    // the effect can be eyeballed on a machine that has "reduce animation" on.
    // RESTORE BEFORE SHIPPING:
    //   if (filmCard && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const filmCard = document.querySelector('.film-card');
    if (filmCard) {
      const MIN = 0.84;   // scale at both ends of the pass
      const RAMP = 0.32;  // fraction of the pass spent growing / shrinking
      let queued = false;
      const paint = () => {
        queued = false;
        const r = filmCard.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 = card's top edge at the viewport bottom, 1 = its bottom edge at the top
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        let s = 1;
        if (p < RAMP) s = MIN + (1 - MIN) * (p / RAMP);
        else if (p > 1 - RAMP) s = MIN + (1 - MIN) * ((1 - p) / RAMP);
        filmCard.style.transform = 'scale(' + s.toFixed(4) + ')';
      };
      const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
      paint();
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
    }

    // Showcase — the two product shots cross-fade on a timer and the tab
    // progress bars run off that same clock. Clicking a tab (or the shot
    // itself) takes over. Pauses while off-screen or in a background tab, so
    // the slides aren't cycling where nobody can see them.
    //
    // Deliberately NOT gated on prefers-reduced-motion: this timer is the
    // only thing that shows a visitor the second slide exists at all, and
    // killing it leaves the section stuck on slide 1 with no story (same
    // reasoning). Reduced motion instead
    // drops just the kinetic bits — the photo's scale-drift (styles.css) and
    // the progress-bar fill going instant instead of animated (below).
    const showStage = document.getElementById('showStage');
    if (showStage) {
      /* La pista lleva las seis capturas en fila y se desplaza un ancho por
         paso: las imagenes pasan DE LADO, no aparecen y desaparecen en el
         sitio. Y las flechas van a los dos lados de la foto. */
      const pista = document.getElementById('showPista');
      const antes = document.getElementById('showPrev');
      const despues = document.getElementById('showNext');
      const DUR = 5200, TICK = 100;
      const slides = showStage.querySelectorAll('[data-slide]');
      const ledes = document.querySelectorAll('[data-lede]');
      const tabs = document.querySelectorAll('.show-tab');
      const bars = document.querySelectorAll('.show-tab .show-bar i');
      const count = slides.length;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let idx = 0, elapsed = 0, cycle = null, onScreen = false;

      const paint = () => {
        if (pista) pista.style.transform = 'translateX(' + (-idx * 100) + '%)';
        slides.forEach((el, n) => el.classList.toggle('is-on', n === idx));
        ledes.forEach((el, n) => el.classList.toggle('is-on', n === idx));
        tabs.forEach((el, n) => el.classList.toggle('is-on', n === idx));
        bars.forEach((el, n) => {
          el.style.width = n !== idx ? '0%'
            : still ? '100%' : Math.min(100, (elapsed / DUR) * 100) + '%';
        });
      };
      const go = (n) => { idx = ((n % count) + count) % count; elapsed = 0; paint(); };
      const tick = () => { elapsed += TICK; elapsed >= DUR ? go(idx + 1) : paint(); };
      const play = () => { if (!cycle) cycle = setInterval(tick, TICK); };
      const pause = () => { if (cycle) { clearInterval(cycle); cycle = null; } };
      const sync = () => { (onScreen && !document.hidden) ? play() : pause(); };

      showStage.addEventListener('click', () => go(idx + 1));
      showStage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(idx + 1); }
      });
      tabs.forEach((el, n) => el.addEventListener('click', () => go(n)));
      if (antes) antes.addEventListener('click', (e) => { e.stopPropagation(); go(idx - 1); });
      if (despues) despues.addEventListener('click', (e) => { e.stopPropagation(); go(idx + 1); });
      document.addEventListener('visibilitychange', sync);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          onScreen = entries[0].isIntersecting;
          sync();
        }, { threshold: 0.25 }).observe(showStage);
      } else {
        onScreen = true; sync();
      }
      paint();
    }

    // A phone visitor literally cannot run a Chrome extension — iOS has no
    // extension support in Chrome at all, and Android Chrome doesn't either.
    // The requirement is always on the page; here it just gets promoted to an
    // alert for the people it actually blocks, before they reach the buy button.
    const priceReq = document.getElementById('priceReq');
    if (priceReq && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      priceReq.classList.add('is-mobile');
    }

    // "Add to Chrome" buttons
    const chromeUrl = CONFIG.chromeUrl || '#pricing';
    document.querySelectorAll('[data-cta="chrome"]').forEach((a) => {
      a.setAttribute('href', chromeUrl);
      if (chromeUrl.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
    });

    // "Buy" buttons — each carries data-plan="pro"|"plus" (generic top-of-page
    // CTAs with no data-plan default to "pro" server-side). Sends the plan so
    // checkout.js picks the matching Stripe price instead of always charging
    // the same one regardless of which card was clicked.
    const buys = document.querySelectorAll('[data-cta="buy"]');
    buys.forEach((button) => button.addEventListener('click', async (event) => {
      event.preventDefault();
      if (button.hasAttribute('aria-busy')) return; // no duplicate Stripe sessions on double-click
      const original = button.innerHTML;          // innerHTML: keep the i18n spans + arrow intact
      button.setAttribute('aria-busy', 'true');
      button.textContent = GhostedI18n.t('buy_opening', 'Opening checkout…');
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // El idioma viaja con la compra: decide en que idioma llega el
          // correo con la clave y en cual se pinta la pantalla de Stripe.
          body: JSON.stringify({
            plan: button.dataset.plan || 'pro',
            lang: document.documentElement.lang || 'en',
            /* El creador que trajo esta visita, si lo hubo. Viaja con la
               compra y acaba en la metadata de Stripe: la comision se calcula
               sobre lo que se cobro de verdad, no sobre un contador aparte. */
            ref: window.ghdRef || '',
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.url) throw new Error(payload.error || 'checkout_unavailable');
        window.location.assign(payload.url);
      } catch (error) {
        button.innerHTML = original;
        button.removeAttribute('aria-busy');
        window.alert(GhostedI18n.t('buy_alert_fail', "Payment isn't available yet. Please try again in a few minutes."));
      }
    }));

    // Sin contador y sin precio anterior tachado. Un "termina en" o un 30 EUR
    // tachado afirman una oferta y un precio previo: mientras esos 30 EUR no se
    // hayan cobrado de verdad, la Directiva Omnibus lo trata como precio de
    // referencia falso. El precio que se anuncia es el que se cobra y punto.
    // Si algun dia hay oferta real, el bloque que la pintaba esta en el
    // historial: se recupera de ahi con su fecha unica para todos.

    // Cookie notice (informational only — no tracking on this site).
    const cookie = document.getElementById('cookie');
    if (cookie) {
      let seen; try { seen = localStorage.getItem('ghosted_cookies'); } catch (e) {}
      if (!seen) setTimeout(function () { cookie.classList.add('show'); }, 700);
      const a = document.getElementById('cookieAccept');
      if (a) a.addEventListener('click', function () {
        try { localStorage.setItem('ghosted_cookies', 'seen'); } catch (e) {}
        cookie.classList.remove('show');
      });
    }


    // ── Cycling collage panel + nav search hint ──────────────────────────
    // Scenes crossfade together: panel tint + the three photos + pill text.
    // Language-neutral pill terms (handles / aesthetic phrases), so no i18n.
    // Not gated on prefers-reduced-motion: these are still-image opacity
    // crossfades, not the drifting/parallaxing motion that setting targets.
    const panel = document.getElementById('worldsPanel');
    if (panel) {
      const SCENES = [
        { bg: '#B2687C', pill: 'golden hour ✨' },
        { bg: '#9A9A78', pill: '@sara.mrn' },
        { bg: '#3E5A72', pill: 'city nights 🌙' },
      ];
      const slots = panel.querySelectorAll('.w-slot');
      const pillText = document.getElementById('worldsPillText');
      let scene = 0;
      // No pause-on-hover: the panel is aria-hidden (purely decorative), and
      // since it spans nearly the full width, any cursor resting over it
      // while reading silently stalled the cycle — it just looked broken.
      setInterval(function () {
        if (document.hidden) return;
        scene = (scene + 1) % SCENES.length;
        panel.style.backgroundColor = SCENES[scene].bg;
        slots.forEach(function (slot) {
          const imgs = slot.querySelectorAll('img');
          imgs.forEach(function (im, i) { im.classList.toggle('on', i === scene); });
        });
        if (pillText) {
          pillText.classList.add('swap');
          setTimeout(function () {
            pillText.textContent = SCENES[scene].pill;
            pillText.classList.remove('swap');
          }, 400);
        }
      }, 4000);
    }
    // Nav search placeholder rotates through profile-ish queries — plain text
    // crossfade, not gated on prefers-reduced-motion (that setting is meant
    // for vestibular-triggering motion like the drifting chips, not a static
    // label's opacity swap; gating it there silently froze it for anyone
    // with that OS/browser preference on).
    const hint = document.getElementById('navSearchHint');
    if (hint) {
      hint.style.transition = 'opacity .3s ease';
      const TERMS = ['@emilysunshine', 'golden hour ✨', '@sara.mrn', 'beach days', '@leo.dnb', 'city nights 🌙'];
      let ti = 0;
      setInterval(function () {
        if (document.hidden) return;
        ti = (ti + 1) % TERMS.length;
        hint.style.opacity = '0';
        setTimeout(function () { hint.textContent = TERMS[ti]; hint.style.opacity = '1'; }, 300);
      }, 3200);
    }

    /* ---- AVISO EN EL MOVIL -----------------------------------------------
       Ghoosted se instala en un ordenador. Quien llega desde un telefono no
       puede comprarlo aunque quiera: leia, se iba, y la visita se perdia
       entera. Lo unico util que puede hacer ahora mismo es mandarse el enlace
       para abrirlo luego donde si funciona, y eso es lo que se le ofrece. */
    const aviso = document.getElementById('movil');
    if (aviso) {
      /* Se mira si el APARATO no puede, no si la ventana es estrecha. Un
         portatil con la ventana a media pantalla sigue pudiendo instalar la
         extension; decirle ahi "esto es para ordenador" es ruido y resta
         ventas. La señal buena es puntero grueso y sin hover: eso es un dedo.
         Se pide ademas pantalla de movil, para no saltar en una tableta
         grande apaisada donde la pagina se lee bien igual. */
      const dedo = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
      const chica = window.matchMedia('(max-width: 900px)').matches;
      if (dedo && chica) {
        aviso.hidden = false;

        /* El enlace canonico, no location.href: si alguien llega con #pricing
           o con parametros de una campaña, lo que se manda tiene que seguir
           siendo la portada limpia. */
        const canon = document.querySelector('link[rel="canonical"]');
        const ENLACE = (canon && canon.href) || (location.origin + '/');
        const T = function (k, d) { return window.GhostedI18n ? window.GhostedI18n.t(k, d) : d; };

        /* Android puede instalar la app: eso es lo util que se le ofrece.
           En un iPhone todavia no hay app, asi que se queda lo de siempre —
           mandarse el enlace para abrirlo en el ordenador. */
        const android = /android/i.test(navigator.userAgent || '');
        const botonApp = document.getElementById('movilApp');
        if (android && botonApp) {
          botonApp.hidden = false;
          const titulo = aviso.querySelector('.movil-h');
          const parrafo = aviso.querySelector('.movil-p');
          if (titulo) { titulo.setAttribute('data-i18n', 'mob_h_and'); titulo.textContent = T('mob_h_and', 'Ghoosted for Android'); }
          if (parrafo) { parrafo.setAttribute('data-i18n', 'mob_p_and'); parrafo.textContent = T('mob_p_and', 'Download the app and check your Instagram from the phone. On a computer it is a Chrome extension.'); }
        }

        const ok = document.getElementById('movilOk');
        let borrar = null;
        const decir = function (txt) {
          if (!ok) return;
          ok.textContent = txt;
          if (borrar) clearTimeout(borrar);
          borrar = setTimeout(function () { ok.textContent = ''; }, 5000);
        };

        /* Sin menu de compartir (navegadores viejos, contextos no seguros)
           queda el correo, que esta en todos los telefonos. */
        const abrirCorreo = function (texto) {
          try {
            location.href = 'mailto:?subject=' + encodeURIComponent('Ghoosted')
              + '&body=' + encodeURIComponent(texto + '\n\n' + ENLACE);
          } catch (e) { decir(ENLACE); }
        };

        const enviar = document.getElementById('movilEnviar');
        if (enviar) {
          enviar.addEventListener('click', function () {
            const texto = T('mob_share', 'Ghoosted — Instagram insights. Open this on a computer:');
            if (navigator.share) {
              navigator.share({ title: 'Ghoosted', text: texto, url: ENLACE })
                /* Cancelar el menu de compartir NO es un fallo: tratarlo como
                   tal dejaria un mensaje de error por cerrarlo. */
                .catch(function (e) { if (!e || e.name !== 'AbortError') abrirCorreo(texto); });
              return;
            }
            abrirCorreo(texto);
          });
        }

        const copiar = document.getElementById('movilCopiar');
        if (copiar) {
          const copiado = function () { decir(T('mob_copied', 'Link copied')); };
          /* Respaldo clasico: un campo temporal + execCommand. Feo, pero no
             pide permiso de portapapeles y funciona donde el moderno falla
             (contextos no seguros, navegadores de dentro de apps, WebViews). */
          const aLaVieja = function () {
            let ok2 = false;
            try {
              const c = document.createElement('input');
              c.setAttribute('readonly', '');
              c.value = ENLACE;
              c.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
              document.body.appendChild(c);
              c.select();
              c.setSelectionRange(0, ENLACE.length);
              ok2 = document.execCommand && document.execCommand('copy');
              c.remove();
            } catch (e) { ok2 = false; }
            /* Y si ni eso: se enseña el enlace para copiarlo a mano. Peor que
               un boton, pero mejor que un boton que no hace nada y deja
               pensando que la web esta rota. */
            if (ok2) copiado(); else decir(ENLACE);
          };
          copiar.addEventListener('click', function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(ENLACE).then(copiado, aLaVieja);
              return;
            }
            aLaVieja();
          });
        }
      }
    }

    /* ---- EL CODIGO DEL CREADOR ------------------------------------------
       Quien llega desde el video de alguien trae ?ref=SUCODIGO. Se guarda
       para toda la sesion —nadie compra en el primer minuto— y se manda con
       la compra. Sin esto, el programa de creadores seria un folleto: no
       habria forma de saber de quien fue cada venta. */
    (function () {
      var GUARDA = 'ghosted_ref';
      var limpia = function (v) {
        return String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
      };
      var enUrl = limpia(new URLSearchParams(location.search).get('ref'));
      if (enUrl && /^[A-Z0-9]{4,12}$/.test(enUrl)) {
        try { localStorage.setItem(GUARDA, enUrl); } catch (e) {}
        window.ghdRef = enUrl;
        /* La visita se apunta una vez por navegador y codigo: recargar la
           pagina veinte veces no puede inflarle los numeros a nadie. */
        var yaContada = 'ghosted_ref_visto_' + enUrl;
        var contar = true;
        try { contar = !localStorage.getItem(yaContada); } catch (e) {}
        if (contar) {
          try { localStorage.setItem(yaContada, '1'); } catch (e) {}
          fetch('/api/creador?accion=clic', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: enUrl }), keepalive: true,
          }).catch(function () { /* un contador perdido no rompe nada */ });
        }
      } else {
        try { window.ghdRef = limpia(localStorage.getItem(GUARDA)); } catch (e) { window.ghdRef = ''; }
      }
    })();
  });
})();

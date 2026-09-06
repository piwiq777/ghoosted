/* Ghoosted — floating photo-chip field (cosmos.so-style).
 * Each chip's transform = home + idle-drift + cursor-parallax + drag,
 * summed every frame in ONE requestAnimationFrame loop. Drag uses
 * pointer capture with release-momentum that springs back toward home.
 * Drives the hero field (interactive) and a sparse decorative CTA field.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isMobile = window.innerWidth < 720;

  /* ---- tuning ---- */
  var PARALLAX_MAX  = isMobile ? 12 : 34;  // px cursor-parallax at depth 1
  var DRIFT_AMP     = isMobile ? 5  : 9;   // px idle-drift amplitude at depth 1
  var DRIFT_SPEED   = 0.00022;             // idle-drift angular speed (rad/ms)
  var PARALLAX_EASE = 0.06;                // cursor smoothing (lower = gentler)
  var SPRING_K      = 0.055;               // drag spring-back stiffness
  var SPRING_DAMP   = 0.82;                // drag velocity damping (momentum)
  var ROT_PARALLAX  = 2.2;                 // deg tilt from cursor at depth 1

  /* The chip field's origin is the HERO's top edge, not the viewport's, and
     the hero starts directly below the sticky header — measured, all three
     agree: header bottom 73, hero top 73, field top 73. So y=0 in field
     coordinates is already clear of the header, and the only headroom a chip
     needs is enough that its idle drift and cursor-parallax cannot carry it
     back up past that edge. Same margin at the bottom.

     (Earlier versions carried a HEADER_SAFE of 128 and a TRAVEL_SAFE of 95
     "measured" from rendered positions. Those numbers were wrong: what they
     were really absorbing was this 73px field offset, not travel.) */
  var DRIFT_MARGIN = PARALLAX_MAX + DRIFT_AMP + 8;   // 51 desktop, 25 phone

  function rand(a, b) { return a + Math.random() * (b - a); }

  // staggered fade + scale-in entrance for a chip
  function scheduleEntrance(el, inner, targetOpacity, i) {
    setTimeout(function () {
      el.style.opacity = targetOpacity;
      inner.style.transform = '';
    }, 140 + i * 65);
  }

  /* HERO photo pool. Landscape/lifestyle scenes prioritised over close-up
     selfies. There are more photos here than there are positions in
     HERO_SLOTS — the surplus is not dropped, it cycles in via the rotation.

     Every chip is the SAME size (CHIP_W x CHIP_H below). The old recipe
     gave each photo its own width/height on a 150→84px ramp and then scaled it
     again by depth, so the field ran from 212px down to 74px — thirteen photos
     at thirteen different sizes read as scattered clutter rather than as one
     deliberate arrangement. `d` is still per-photo, but it now only drives
     atmosphere (opacity and parallax depth), never size. */
  var CHIP_W = 132, CHIP_H = 166;
  var HERO_RECIPE = [
    { s: 'cove',     d: 0.95 },
    { s: 'pool',     d: 0.92 },
    { s: 'positano', d: 0.85 },
    { s: 'sea',      d: 0.88 },
    { s: 'boat',     d: 0.66 },
    { s: 'shop',     d: 0.58 },   // fine detail (paintings/shelves) — needs a sharper tier
    { s: 'table',    d: 0.46 },   // fine detail (patterned plates)
    { s: 'uno',      d: 0.40 },
    { s: 'pasta',    d: 0.32 },
    { s: 'sparkle',  d: 0.26 },   // the sparkle IS the photo — keep it legible
    { s: 'pizza',    d: 0.20 },
    { s: 'dive',     d: 0.16 },
    { s: 'piet',     d: 0.12 }
  ];
  /* TWO LAYOUTS, chosen by how much room there actually is.

     COORDINATE SPACE: the field is inset:0 -10%, so it is 120% of the stage
     wide and starts 10% left of it — a chip centre lands at
     viewport_x = frac_x*1.2*stageW - 0.1*stageW, inverted below. Vertically
     the field matches the hero, so frac_y is a fraction of H — but everything
     is POSITIONED against ctx.visibleH (the part above the fold) and only
     converted to a fraction of H at the end. */

  var RING = { cx: 0.50, ry: 0.30, rxFrac: 0.450 };
  var RING_GAP_FROM = 55, RING_GAP_TO = 125;   // open wedge at the bottom (degrees)
  var RING_COUNT = 10;

  function toFracX(vx) { return (vx + 0.1) / 1.2; }

  /* Points are spread by EQUAL ARC LENGTH, not equal angle. On an ellipse this
     much wider than tall those differ sharply: near the left and right extremes
     the curve is almost vertical, so equal angular steps bunch chips there and
     leave holes across the top. Measured on the equal-angle version at
     1500x900: two pairs OVERLAPPED by 67px and two more sat 7px apart, while
     the top gaps were 226px. By arc length nothing overlaps. */
  function arcSpacedAngles(rxPx, ryPx, startDeg, sweepDeg, n) {
    var STEPS = 2000, angles = [], cum = [0], prev = null, total = 0;
    for (var i = 0; i <= STEPS; i++) {
      var deg = startDeg + sweepDeg * i / STEPS;
      var t = deg * Math.PI / 180;
      var x = rxPx * Math.cos(t), y = ryPx * Math.sin(t);
      if (prev) total += Math.sqrt((x - prev[0]) * (x - prev[0]) + (y - prev[1]) * (y - prev[1]));
      angles.push(deg); cum.push(total); prev = [x, y];
    }
    var out = [], k = 0;
    for (var j = 0; j < n; j++) {
      var target = total * j / (n - 1);
      while (k < STEPS && cum[k + 1] < target) k++;
      out.push(angles[k]);
    }
    return out;
  }

  function ringSlots(ctx) {
    var rxPx = RING.rxFrac * ctx.stageW;
    var ryPx = RING.ry * ctx.visibleH;
    var cyPx = ctx.visibleH * 0.5;
    var sweep = 360 - (RING_GAP_TO - RING_GAP_FROM);
    return arcSpacedAngles(rxPx, ryPx, RING_GAP_TO, sweep, RING_COUNT).map(function (deg) {
      var t = deg * Math.PI / 180;
      return [toFracX(RING.cx + RING.rxFrac * Math.cos(t)), (cyPx + ryPx * Math.sin(t)) / ctx.H];
    });
  }

  /* NARROW SCREENS GET BANDS, NOT A RING.

     Measured at 375x812: the headline spans x 22..353 and the CTA block
     x 22..353 — the text is the full width of the screen, so there is no
     lateral strip to put a photo in. A ring collapses onto the title (2 chips
     landed on the buttons); side columns sit straight behind the text. The
     same thing happens on a narrow desktop window: at 820px the ring produced
     7 overlapping pairs and 3 chips over the headline.

     What IS free is the band above the headline and the band below the
     buttons, so those get three photos each with the text clean between them.
     The bands are measured from the real elements rather than guessed, so they
     follow the text wherever it lands. */
  function bandSlots(ctx) {
    var xs = [0.11, 0.50, 0.89].map(toFracX);
    var title = document.querySelector('.hero-title');
    var cta = document.querySelector('.hero-cta');
    var topLimit = DRIFT_MARGIN, bottomLimit = ctx.visibleH - DRIFT_MARGIN;
    if (title && cta) {
      topLimit = Math.max(topLimit, 0);
      var tTop = title.getBoundingClientRect().top - ctx.fieldTop;
      var cBot = cta.getBoundingClientRect().bottom - ctx.fieldTop;
      // centre each row in whatever is free above the title / below the CTA
      var topCentre = Math.max(DRIFT_MARGIN + ctx.chipH / 2, (DRIFT_MARGIN + tTop - 18) / 2);
      var botCentre = Math.min(bottomLimit - ctx.chipH / 2, (cBot + 18 + bottomLimit) / 2);
      return xs.map(function (fx) { return [fx, topCentre / ctx.H]; })
        .concat(xs.map(function (fx) { return [fx, botCentre / ctx.H]; }));
    }
    return xs.map(function (fx) { return [fx, 0.22]; })
      .concat(xs.map(function (fx) { return [fx, 0.80]; }));
  }

  /* The ring only works if its radius clears the headline. The headline is
     capped at 840px (.hero-center max-width), so half of it plus half a chip
     plus a little air is the minimum radius worth attempting; below that the
     ring is guaranteed to sit on the text and the bands win. */
  function heroSlots(ctx) {
    var titleHalf = Math.min(840, ctx.stageW - 44) / 2;
    var needed = titleHalf + ctx.chipW / 2 + 24;
    return (RING.rxFrac * ctx.stageW >= needed) ? ringSlots(ctx) : bandSlots(ctx);
  }

  // Single entry point for the hero's positions. Stays a FUNCTION (not an
  // array): it needs the live stage size to pick a layout and to space the
  // ring by arc length, so buildStage resolves it once dimensions are known.
  var HERO_SLOTS = heroSlots;

  /* CTA — the photo field used to be repeated here as "bokeh". It didn't work:
     the same five hero photos, blurred and dropped to 30-58% opacity over a
     near-black band, stop reading as photos and turn into grey-brown smudges,
     and one of them always landed under the button. The band is now a clean
     gradient glow done in CSS (see .cta-band in styles.css) — nothing to build
     here. Kept as an empty recipe so the resize/rebuild paths stay valid. */
  /* El cierre repite el mismo lenguaje visual que la cabecera: las mismas
     fotos de viaje, colocadas en dos bandas —una arriba y otra abajo— que
     dejan libre la columna central donde va el texto. Menos fotos que arriba
     y más separadas, porque la banda es mucho más baja y sobre fondo oscuro. */
  var CTA_RECIPE = [
    { s: 'cove',     d: 0.92 },
    { s: 'positano', d: 0.80 },
    { s: 'sea',      d: 0.74 },
    { s: 'boat',     d: 0.60 },
    { s: 'table',    d: 0.44 },
    { s: 'pasta',    d: 0.34 },
    { s: 'dive',     d: 0.22 },
    { s: 'pizza',    d: 0.16 }
  ];
  function ctaSlots() {
    var xs = [0.06, 0.21, 0.79, 0.94];
    return xs.map(function (fx) { return [fx, 0.15]; })
      .concat(xs.map(function (fx) { return [fx, 0.87]; }));
  }
  var CTA_SLOTS = ctaSlots;

  var stages = [];

  function buildStage(fieldEl, recipe, slots, opts) {
    var stage = fieldEl.parentElement;
    if (isMobile && opts.mobileSlice) recipe = recipe.slice(0, opts.mobileSlice);

    var st = { stage: stage, field: fieldEl, chips: [], tpx: 0, tpy: 0, cpx: 0, cpy: 0, trot: 0, crot: 0, interactive: opts.interactive, active: true };
    // measure the FIELD (it bleeds 10% past each edge so chips hang off-screen)
    var W = fieldEl.clientWidth || stage.clientWidth, H = fieldEl.clientHeight || stage.clientHeight;
    // The ring needs real pixels to space itself by arc length, so it arrives
    // as a function and is resolved here. W is the field, 1.2x the stage.
    // This MUST happen before `placed` below: Function.length is the arity of
    // the function (2), so counting slots off an unresolved spec silently
    // builds two chips instead of ten.
    // How much of the field is actually ON SCREEN. The hero is 100svh tall but
    // starts `fieldTop` down the page, so its last `fieldTop` pixels sit below
    // the fold. Everything vertical is placed against this, not against H.
    var fieldTop = fieldEl.getBoundingClientRect().top;
    var visibleH = Math.max(240, Math.min(H, window.innerHeight - fieldTop));
    var chipW = CHIP_W * (isMobile ? 0.65 : 1), chipH = CHIP_H * (isMobile ? 0.65 : 1);
    if (typeof slots === 'function') {
      slots = slots({ stageW: W / 1.2, H: H, visibleH: visibleH, fieldTop: fieldTop, chipW: chipW, chipH: chipH });
    }

    // One chip per SLOT, never more. There are more photos than positions on
    // purpose: the extras aren't dropped, they keep cycling through the
    // rotation pool below, so every photo still gets shown — just never by
    // inventing an extra position for it and breaking the layout's spacing.
    var placed = recipe.slice(0, slots.length);

    placed.forEach(function (r, i) {
      var el = document.createElement('div');
      el.className = 'chip';
      var inner = document.createElement('div');
      inner.className = 'inner';
      var img = document.createElement('img');
      img.src = 'assets/photos/' + r.s + '.jpg';
      img.alt = '';
      // Las fotos del hero estan sobre la linea de flotacion: con lazy el
      // navegador las aplaza y la primera impresion son rectangulos grises.
      // Las del pie si van en diferido, que estan a 10 pantallas de distancia.
      if (opts.eager) { img.loading = 'eager'; img.fetchPriority = 'high'; }
      else { img.loading = 'lazy'; }
      img.decoding = 'async';
      inner.appendChild(img);
      el.appendChild(inner);
      fieldEl.appendChild(el);

      var slot = slots[i % slots.length];
      // One size for the whole field. Only the mobile step remains: the desktop
      // size would eat a third of a 375px screen and bury the headline.
      var scale = isMobile ? 0.65 : 1;
      var w = (r.w || CHIP_W) * scale, h = (r.h || CHIP_H) * scale;
      // Small jitter only. At ±22/±16 it undid the symmetry of the slots and
      // was a big part of why the field read as "thrown about".
      var hx = slot[0] * W - w / 2 + rand(-9, 9);
      var hy = slot[1] * H - h / 2 + rand(-7, 7);
      hx = Math.max(-w * 0.25, Math.min(W - w * 0.75, hx));
      hy = Math.max(-h * 0.25, Math.min(H - h * 0.75, hy));
      // Vertical guard rails, in px rather than fractions: the slot fractions
      // scale with the viewport, so on a short window the top row drifts up
      // into the sticky header and the bottom row past the fold. HEADER_SAFE
      // clears the ~73px header plus the maximum drift+parallax travel; the
      // lower bound keeps the last row fully on screen instead of sliced.
      if (opts.interactive) {
        hy = Math.max(DRIFT_MARGIN, Math.min(visibleH - h - DRIFT_MARGIN, hy));
      }

      el.style.width = w + 'px';
      el.style.height = h + 'px';
      // No per-chip blur. Once every chip is the same size the blur was buying
      // at most 1px of "depth" nobody can see, while giving each of the 13
      // chips its own rasterised GPU layer (on top of will-change:transform) —
      // the same class of compositing pressure that was smearing the field into
      // a grey cloud on some machines. Depth now lives in opacity alone, which
      // composites for free.
      var targetOpacity;
      if (opts.interactive) {
        // a touch fainter on mobile too — there the chips sit much closer to
        // the headline, so full-strength photos fought it for attention
        targetOpacity = ((isMobile ? 0.60 : 0.72) + r.d * 0.26).toFixed(2);
        el.style.zIndex = String(2 + Math.round(r.d * 14));
      } else {
        targetOpacity = (0.30 + r.d * 0.28).toFixed(2); // faint bokeh on dark CTA
        el.style.zIndex = '0';
        el.style.cursor = 'default';
        el.style.pointerEvents = 'none';
      }
      // staggered entrance: fade + scale-in from a soft settle.
      // Si la pestana esta en segundo plano la transicion de opacidad no
      // avanza nunca (se queda congelada en el valor inicial), asi que el hero
      // se quedaria en blanco para quien abre el enlace en una pestana nueva,
      // y para rastreadores y capturas. Ahi las fotos se colocan ya puestas.
      if (reduce || document.visibilityState === 'hidden') {
        el.style.opacity = targetOpacity;
      } else {
        el.style.opacity = '0';
        inner.style.transform = 'scale(.86)';
        el.style.transition = 'opacity .85s cubic-bezier(.2,.7,.2,1)';
        scheduleEntrance(el, inner, targetOpacity, i);
      }

      var c = {
        el: el, d: r.d, homeX: hx, homeY: hy,
        baseRot: rand(-7, 7),   // was ±14°; softer tilt keeps the ring readable
        driftPhase: rand(0, Math.PI * 2), driftPhaseY: rand(0, Math.PI * 2),
        driftSpeed: DRIFT_SPEED * rand(0.7, 1.3), // desynced so the field breathes organically
        driftAmpX: DRIFT_AMP * (0.4 + r.d) * rand(0.7, 1.2),
        driftAmpY: DRIFT_AMP * (0.4 + r.d) * rand(0.7, 1.2),
        dx: 0, dy: 0, vx: 0, vy: 0, dragging: false,
        img: img, poolIdx: i // for the photo rotation below — the FRAME never moves, only its photo
      };
      st.chips.push(c);
      if (opts.interactive) attachDrag(st, c);
      render(st, c);
    });

    // Rotate the photo shown in each frame — never the frame itself. Every
    // chip advances to the next image in the same shared pool (the recipe's
    // own photo list) in lockstep, which is equivalent to "each frame's photo
    // hands off to its neighbour": since chip i shows pool[(i+tick)%N], one
    // tick later chip i shows exactly what chip i+1 showed a moment ago.
    // All 13/8 pool images are already loaded (each is some chip's starting
    // photo), so src-swaps hit cache — no flicker, no extra network requests.
    if (recipe.length > 1) {
      var pool = recipe.map(function (r) { return r.s; });
      st.rotateTimer = setInterval(function () {
        if (document.hidden) return;
        st.chips.forEach(function (c) {
          var next = (c.poolIdx + 1) % pool.length;
          c.img.style.opacity = '0';
          setTimeout(function () {
            c.img.src = 'assets/photos/' + pool[next] + '.jpg';
            c.img.style.opacity = '1';
            c.poolIdx = next;
          }, 380);
        });
      }, opts.rotateMs || 4200);
    }

    if (opts.interactive) {
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = stage.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        st.tpx = -nx * PARALLAX_MAX * 2;
        st.tpy = -ny * PARALLAX_MAX * 2;
        st.trot = -nx * ROT_PARALLAX * 2;
      }, { passive: true });
      stage.addEventListener('pointerleave', function () { st.tpx = 0; st.tpy = 0; st.trot = 0; });
    }

    stages.push(st);
    observeVisibility(st);
    return st;
  }

  // Skip a stage's per-frame work entirely while its section is off-screen —
  // otherwise 18 chips keep animating (and repainting) forever, competing
  // with the compositor for scroll/interaction smoothness everywhere else
  // on the page even after the user has scrolled past the hero.
  function observeVisibility(st) {
    if (!('IntersectionObserver' in window)) return; // st.active stays true
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { st.active = e.isIntersecting; });
    }, { rootMargin: '200px 0px 200px 0px', threshold: 0 });
    io.observe(st.stage);
  }

  function render(st, c) {
    // Ambient drift/breathe is deliberately NOT gated on prefers-reduced-motion:
    // it's a slow (~28s cycle), few-pixel sway — not the kind of motion that
    // setting exists to suppress — and it's the whole visual identity of this
    // hero. Gating it made the entire field freeze solid for anyone with that
    // OS/browser preference on, which is the opposite of what was intended.
    var t = performance.now();
    var driftX = Math.sin(t * c.driftSpeed + c.driftPhase) * c.driftAmpX;
    var driftY = Math.cos(t * c.driftSpeed * 0.9 + c.driftPhaseY) * c.driftAmpY;
    // a slow, subtle breathing scale — a second, distinct rhythm from the
    // drift (different speed/phase) so the whole field feels alive rather
    // than mechanically looping in sync
    var breathe = 1 + Math.sin(t * c.driftSpeed * 0.55 + c.driftPhase * 1.7) * 0.018;
    var x = c.homeX + c.dx + driftX + st.cpx * c.d;
    var y = c.homeY + c.dy + driftY + st.cpy * c.d;
    var rot = c.baseRot + st.crot * c.d + (c.dx * 0.02);
    c.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) rotate(' + rot.toFixed(2) + 'deg) scale(' + breathe.toFixed(4) + ')';
  }

  function attachDrag(st, c) {
    var el = c.el;
    var startX = 0, startY = 0, lastX = 0, lastY = 0, lastT = 0, pid = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // let a finger scroll the page, never hijack it
      pid = e.pointerId;
      try { el.setPointerCapture(pid); } catch (_) {}
      c.dragging = true;
      el.classList.add('grabbing');
      startX = e.clientX; startY = e.clientY;
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      c.vx = c.vy = 0;
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) {
      if (!c.dragging || e.pointerId !== pid) return;
      var now = performance.now();
      var mvx = e.clientX - lastX, mvy = e.clientY - lastY;
      c.dx += mvx; c.dy += mvy;
      var dt = Math.max(8, now - lastT);
      c.vx = mvx / dt * 16; c.vy = mvy / dt * 16;
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 6) e.preventDefault();
    });
    function release(e) {
      if (!c.dragging || (pid !== null && e.pointerId !== pid)) return;
      c.dragging = false;
      el.classList.remove('grabbing');
      try { el.releasePointerCapture(pid); } catch (_) {}
      pid = null;
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  function tick() {
    for (var s = 0; s < stages.length; s++) {
      var st = stages[s];
      // section off-screen: nothing to update or paint. Non-interactive
      // stages (the CTA's decorative bokeh) never drag and never receive
      // cursor-parallax either, so the only thing looping would still do for
      // them is the drift/breathe trig — skip it and let them sit at their
      // entrance-settled position. One less continuously-animating field.
      if (!st.active || !st.interactive) continue;
      st.cpx += (st.tpx - st.cpx) * PARALLAX_EASE;
      st.cpy += (st.tpy - st.cpy) * PARALLAX_EASE;
      st.crot += (st.trot - st.crot) * PARALLAX_EASE;
      for (var i = 0; i < st.chips.length; i++) {
        var c = st.chips[i];
        if (!c.dragging) {
          c.vx += (-c.dx) * SPRING_K; c.vy += (-c.dy) * SPRING_K;
          c.vx *= SPRING_DAMP; c.vy *= SPRING_DAMP;
          c.dx += c.vx; c.dy += c.vy;
          if (Math.abs(c.dx) < 0.05 && Math.abs(c.vx) < 0.05) { c.dx = 0; c.vx = 0; }
          if (Math.abs(c.dy) < 0.05 && Math.abs(c.vy) < 0.05) { c.dy = 0; c.vy = 0; }
        }
        render(st, c);
      }
    }
    requestAnimationFrame(tick);
  }

  function start() {
    var heroField = document.getElementById('field');
    if (heroField) buildStage(heroField, HERO_RECIPE, HERO_SLOTS, { interactive: true, eager: true, mobileSlice: 10, rotateMs: 4200 });
    var ctaField = document.getElementById('ctaField');
    if (ctaField) buildStage(ctaField, CTA_RECIPE, CTA_SLOTS, { interactive: false, mobileSlice: 3, rotateMs: 5200 });
    // Always run the loop — reduce only trims the entrance flourish above;
    // without this, prefers-reduced-motion froze the whole field solid
    // (no drift, no cursor-parallax, no drag momentum either).
    requestAnimationFrame(tick);

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var nowMobile = window.innerWidth < 720;
        if (nowMobile !== isMobile) {
          // crossing the mobile/desktop boundary: rebuild the fields in place
          // (never reload — that would nuke scroll position and form state)
          isMobile = nowMobile;
          // crossing the breakpoint swaps the whole arrangement, not just sizes

          stages.forEach(function (st) { clearInterval(st.rotateTimer); st.field.innerHTML = ''; });
          stages.length = 0;
          var hf = document.getElementById('field');
          if (hf) buildStage(hf, HERO_RECIPE, HERO_SLOTS, { interactive: true, eager: true, mobileSlice: 10, rotateMs: 4200 });
          var cf = document.getElementById('ctaField');
          if (cf) buildStage(cf, CTA_RECIPE, CTA_SLOTS, { interactive: false, mobileSlice: 3, rotateMs: 5200 });
          return;
        }
        stages.forEach(function (st) {
          var W = st.field.clientWidth || st.stage.clientWidth, H = st.field.clientHeight || st.stage.clientHeight;
          var slots = st.field.id === 'ctaField' ? CTA_SLOTS : HERO_SLOTS;
          // Same visible-band measurement as buildStage. NOTE the element here
          // is st.field, not fieldEl — that identifier only exists inside
          // buildStage's scope.
          var fieldTop = st.field.getBoundingClientRect().top;
          var visibleH = Math.max(240, Math.min(H, window.innerHeight - fieldTop));
          var chipW = CHIP_W * (isMobile ? 0.65 : 1), chipH = CHIP_H * (isMobile ? 0.65 : 1);
          if (typeof slots === 'function') {
            slots = slots({ stageW: W / 1.2, H: H, visibleH: visibleH, fieldTop: fieldTop, chipW: chipW, chipH: chipH });
          }
          st.chips.forEach(function (c, i) {
            var slot = slots[i % slots.length];
            var w = c.el.clientWidth, h = c.el.clientHeight;
            c.homeX = Math.max(-w * 0.25, Math.min(W - w * 0.75, slot[0] * W - w / 2));
            c.homeY = Math.max(-h * 0.25, Math.min(H - h * 0.75, slot[1] * H - h / 2));
            // same guard rails as buildStage — without this a resize could
            // re-park the top row back under the header
            if (st.interactive) c.homeY = Math.max(DRIFT_MARGIN, Math.min(visibleH - h - DRIFT_MARGIN, c.homeY));
          });
        });
      }, 200);
    });
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();

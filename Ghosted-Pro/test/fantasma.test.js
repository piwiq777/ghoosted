'use strict';
/* El fantasma tiene que estar SIEMPRE en Instagram.
 *
 * Hasta ahora no habia nada en la pagina hasta que aparecia la cookie de
 * sesion Y terminaba de hidratarse el almacen. Quien acababa de pagar abria
 * Instagram, no veia absolutamente nada, y daba por hecho que le habian
 * estafado. Y la unica forma de meter la clave era la ventana del icono, que
 * necesita que el content script conteste: si el content script no habia
 * montado, no contestaba, y el popup decia "recarga la pestaña" para siempre.
 *
 * Esto arranca content.js de verdad —sin sesion, sin licencia, sin almacen— y
 * comprueba que el fantasma sale y que al pulsarlo se puede pegar la clave. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite } = require('./lib/probar');

const SRC = path.join(__dirname, '..', 'src');

/* Un DOM de mentira, lo justo: hijos de verdad, ids buscables y eventos que
   se pueden disparar. Sin esto la prueba no distingue "monta el boton" de
   "llama a appendChild y se lo traga un stub vacio". */
function hacerDom() {
  const porId = new Map();
  const crear = (tag) => {
    const el = {
      tagName: String(tag || 'div').toUpperCase(),
      _id: '', className: '', textContent: '', innerHTML: '', title: '', href: '', value: '',
      type: '', placeholder: '', autocomplete: '', spellcheck: true, disabled: false, hidden: false,
      style: {}, dataset: {}, hijos: [], padre: null, oyentes: {},
      classList: {
        add() {}, remove() {}, toggle() {}, contains: () => false,
      },
      get id() { return el._id; },
      set id(v) { el._id = v; if (v) porId.set(v, el); },
      setAttribute(k, v) { el[k] = v; },
      getAttribute(k) { return el[k]; },
      addEventListener(t, f) { (el.oyentes[t] = el.oyentes[t] || []).push(f); },
      removeEventListener() {},
      appendChild(c) { c.padre = el; el.hijos.push(c); return c; },
      append(c) { return el.appendChild(c); },
      insertBefore(c) { return el.appendChild(c); },
      remove() {
        if (el.padre) el.padre.hijos = el.padre.hijos.filter((h) => h !== el);
        if (el._id) porId.delete(el._id);
        el.padre = null;
      },
      focus() {},
      /* Busca por #id y por .clase, que es todo lo que usa el arranque. */
      querySelector(sel) {
        const todos = [];
        (function bajar(n) { n.hijos.forEach((h) => { todos.push(h); bajar(h); }); })(el);
        if (sel[0] === '#') return todos.find((n) => n._id === sel.slice(1)) || null;
        if (sel[0] === '.') return todos.find((n) => String(n.className).split(/\s+/).includes(sel.slice(1))) || null;
        return todos.find((n) => n.tagName === sel.toUpperCase()) || null;
      },
      querySelectorAll() { return []; },
    };
    return el;
  };
  const body = crear('body');
  const doc = {
    cookie: '', hidden: false, body, head: crear('head'),
    createElement: crear, addEventListener() {}, removeEventListener() {},
    getElementById: (id) => porId.get(id) || null,
    querySelector: (s) => body.querySelector(s),
    querySelectorAll: () => [],
  };
  return { doc, body, porId, crear };
}

function pulsar(el, tipo) {
  (el.oyentes[tipo || 'click'] || []).forEach((f) => f({ preventDefault() {}, key: '' }));
}

module.exports = async () => {
  const s = suite('fantasma de arranque');
  const content = fs.readFileSync(path.join(SRC, 'content.js'), 'utf8');

  /* --- 1 · orden en el fichero: el fantasma va ANTES de la puerta de la
         sesion, o vuelve a no salir nada mientras no haya cookie. */
  s.ok('el fantasma se monta antes de comprobar la sesion',
    content.indexOf('ghdBootArranca();') < content.indexOf('let O = k.getUserId();'));
  s.ok('y antes de esperar a que llegue la sesion',
    content.indexOf('ghdBootArranca();') < content.indexOf('O = await new Promise'));
  s.ok('el panel de verdad lo retira al montarse',
    /function YM\(\) \{\s*ghdBootFuera\(\)/.test(content));
  /* Y el definitivo tampoco puede perderse: Instagram repinta con React y a
     veces se lleva por delante nodos ajenos del body. */
  s.ok('el panel de verdad tambien queda vigilado',
    /function YM\(\) \{\s*ghdBootFuera\(\), ghdVigilaFab\(\);/.test(content)
    && /if \(!document\.getElementById\("ghd-fab"\) && document\.body\) document\.body\.appendChild\(V\);/.test(content));
  /* Un fallo dentro de gk\(\) dejaba la pagina pelada y sin una sola linea en
     consola: la promesa se rechazaba y nadie la recogia. */
  s.ok('un arranque roto deja rastro en la consola',
    /gk\(\)\.catch\(gv => console\.error/.test(content));
  s.ok('y el content script dice que esta vivo al cargar',
    /console\.info\("\[Ghoosted\] content script activo v"/.test(content));

  /* --- 2 · la prueba de verdad: arrancar sin sesion y sin licencia. */
  const { doc, body } = hacerDom();
  const relojes = [];
  const enviados = [];
  let guardado = {};
  const ctx = {
    document: doc,
    addEventListener() {}, removeEventListener() {},
    location: { reload() { ctx.__recargado = true; }, href: '' },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage: async (m) => { enviados.push(m); return ctx.__respuesta || {}; },
        getManifest: () => ({ version: '0' }), getURL: (p) => p,
      },
      storage: {
        local: { get: (k, cb) => { if (typeof cb === 'function') return cb(guardado); return Promise.resolve(guardado); },
          set: async () => {}, remove: async () => {} },
        onChanged: { addListener() {} },
      },
      alarms: { create() {}, onAlarm: { addListener() {} } },
      i18n: { getMessage: () => '', getUILanguage: () => 'es' },
    },
    GhostedI18n: { t: (k) => k, locale: 'es', ready: Promise.resolve() },
    GhostedStore: { get: (k, d) => d, set() {}, del() {}, syncCache() {}, hydrate: () => new Promise(() => {}) },
    GhostedIG: { getUserId: () => ctx.__cookie || null },
    GhostedLicense: { isPro: () => false, feature: () => false, getLicense: () => null, LICENSE_KEY: 'ghosted_license', INSTALL_KEY: 'i' },
    GhostedConfig: { freeMode: false, product: 'pro', buyUrl: 'https://ghoosted.net/#pricing', appUrl: 'https://ghoosted.net' },
    console: { info() {}, error() {}, warn() {}, log() {} },
    setInterval: (f, ms) => { const t = setInterval(f, Math.min(ms, 5)); relojes.push(t); return t; },
    setTimeout: (f, ms) => { const t = setTimeout(f, Math.min(ms, 5)); relojes.push(t); return t; },
    clearInterval, clearTimeout,
    Promise, Date, Math, JSON, String, Number, Object, Array, Error, RegExp, Map, Set,
    TextEncoder, encodeURIComponent, decodeURIComponent, isNaN, parseInt, parseFloat, Boolean, Symbol,
  };
  ctx.__cookie = '';                      // sin sesion de Instagram
  ctx.self = ctx; ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx);

  /* g.hydrate() no resuelve nunca a proposito: asi se comprueba que el
     fantasma no depende de que el almacen cargue. El resto del arranque se
     queda a medias y lanza; se recoge y se sigue. */
  const tragar = () => {};
  process.on('unhandledRejection', tragar);
  process.on('uncaughtException', tragar);
  try { vm.runInContext(content, ctx); } catch (e) { /* el arranque completo no cabe en un stub */ }
  await new Promise((r) => setTimeout(r, 60));

  const fab = doc.getElementById('ghd-boot-fab');
  s.ok('sin sesion y sin licencia, el fantasma esta en la pagina', !!fab);
  s.ok('y cuelga del body, donde se ve', !!fab && body.hijos.indexOf(fab) !== -1);
  s.ok('es un boton, no un div que no se puede pulsar', !!fab && fab.tagName === 'BUTTON');
  s.ok('lleva el dibujo del fantasma dentro', !!fab && /<svg/.test(fab.innerHTML));
  s.ok('y se llama Ghoosted, para reconocerlo', !!fab && fab.title === 'Ghoosted');

  /* --- 3 · pulsarlo abre la activacion. */
  if (fab) pulsar(fab);
  const hoja = doc.getElementById('ghd-boot-sheet');
  s.ok('al pulsarlo se abre la hoja de activacion', !!hoja);
  const campo = hoja && hoja.querySelector('#ghd-boot-key');
  s.ok('con un campo donde pegar la clave', !!campo);
  s.ok('y el formato de la clave a la vista', !!campo && /^GHST-/.test(campo.placeholder));
  const boton = hoja && hoja.querySelector('#ghd-boot-go');
  s.ok('y un boton de activar', !!boton);
  const perdida = hoja && hoja.querySelector('.ghd-boot-pie');
  s.ok('con salida a recuperar la clave', !!perdida && perdida.href === 'https://ghoosted.net/recuperar');
  s.ok('que abre en otra pestaña sin ceder la nuestra', !!perdida && perdida.target === '_blank' && perdida.rel === 'noopener');

  /* --- 4 · sin sesion no se puede activar, y se dice cual es el problema. */
  if (campo) campo.value = 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE';
  if (boton) pulsar(boton);
  await new Promise((r) => setTimeout(r, 20));
  const msg = hoja && hoja.querySelector('#ghd-boot-msg');
  s.eq('sin sesion no se manda nada al servidor', enviados.length, 0);
  s.eq('y se dice que hay que iniciar sesion', msg && msg.textContent, 'popup_need_login');

  /* --- 5 · con sesion si activa, y la cuenta se lee en ese momento. */
  ctx.__cookie = '17841400912730044';
  ctx.__respuesta = { valid: true };
  if (boton) pulsar(boton);
  await new Promise((r) => setTimeout(r, 20));
  s.eq('con sesion ya manda la comprobacion', enviados.length, 1);
  s.eq('pide verificar la licencia', enviados[0] && enviados[0].type, 'verifyLicense');
  s.eq('con la clave escrita', enviados[0] && enviados[0].key, 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE');
  s.eq('y la cuenta leida en ese instante, no al arrancar',
    enviados[0] && enviados[0].accountId, '17841400912730044');
  s.eq('al activarse recarga para montar el panel entero', ctx.__recargado, true);

  /* --- 6 · una clave vacia no gasta una llamada. */
  if (campo) campo.value = '   ';
  if (boton) pulsar(boton);
  await new Promise((r) => setTimeout(r, 20));
  s.eq('una clave vacia no llega al servidor', enviados.length, 1);
  s.eq('y se pide escribirla', msg && msg.textContent, 'unlock_enter_key');

  relojes.forEach((t) => { clearInterval(t); clearTimeout(t); });
  await new Promise((r) => setTimeout(r, 20));
  process.removeListener('unhandledRejection', tragar);
  process.removeListener('uncaughtException', tragar);

  /* --- 7 · el estilo existe, o el fantasma sale invisible. */
  const css = fs.readFileSync(path.join(SRC, 'panel.css'), 'utf8');
  s.ok('el fantasma tiene estilo propio', /#ghd-boot-fab\{/.test(css));
  s.ok('esta fijo abajo a la derecha, como el definitivo', /#ghd-boot-fab\{[^}]*position:fixed[^}]*right:22px[^}]*bottom:22px/.test(css));
  s.ok('y por encima de lo de Instagram', /#ghd-boot-fab\{[^}]*z-index:2147483000/.test(css));
  s.ok('la hoja de activacion tambien tiene estilo', /\.ghd-boot-sheet\{/.test(css));
  s.ok('las variables de color le llegan',
    /#ghd-panel, #ghd-fab, #ghd-backdrop, #ghd-boot-fab, \.ghd-boot-sheet\{/.test(css));

  /* --- 8 · y los textos estan traducidos en los doce idiomas. */
  const idiomas = fs.readdirSync(path.join(__dirname, '..', '_locales'));
  s.eq('doce idiomas', idiomas.length, 12);
  for (const l of idiomas) {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_locales', l, 'messages.json'), 'utf8'));
    const faltan = ['boot_ready', 'boot_lost', 'boot_done'].filter((k) => !d[k] || !d[k].message);
    s.eq(l + ': no falta ningun texto del fantasma', faltan, []);
  }

  return s;
};

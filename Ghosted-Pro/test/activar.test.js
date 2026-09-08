'use strict';
/* Activar la clave recien comprada.
 *
 * Es el unico tramo en el que el cliente ya ha pagado y todavia no tiene nada.
 * Si falla, lo que ve es una extension que no hace "una puta mierda" —palabras
 * del dueño— y un mensaje que le manda abrir Instagram con Instagram delante.
 * Cada comprobacion de aqui corresponde a una de las tres razones por las que
 * fallaba. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const leer = (rel) => fs.readFileSync(path.join(PRO, rel), 'utf8');

module.exports = async () => {
  const s = suite('activar la clave');

  /* 1 · Instagram sirve en los DOS dominios. Con solo www, quien entraba por
         instagram.com a secas no tenia ni content script ni permiso: la
         extension no existia en esa pestaña. */
  const man = JSON.parse(leer('manifest.json'));
  for (const c of man.content_scripts) {
    s.ok('el content script cubre www', c.matches.indexOf('https://www.instagram.com/*') !== -1);
    s.ok('y tambien instagram.com a secas', c.matches.indexOf('https://instagram.com/*') !== -1);
  }
  s.ok('los permisos cubren los dos dominios',
    man.host_permissions.indexOf('https://www.instagram.com/*') !== -1
    && man.host_permissions.indexOf('https://instagram.com/*') !== -1);

  const popup = leer('popup/popup.js');
  s.ok('el popup busca en los dos dominios',
    /'https:\/\/www\.instagram\.com\/\*', 'https:\/\/instagram\.com\/\*'/.test(popup));
  /* 2 · Y si Instagram no es la pestaña de delante, se busca en las demas:
         nadie tiene por que dejarla en primer plano para pegar una clave. */
  s.ok('si no es la pestaña activa, mira las demas',
    /if \(!pestanas\[0\]\) pestanas = await chrome\.tabs\.query\(\{ url: DOMINIOS \}\)/.test(popup));

  /* 3 · El id de la cuenta se releia una sola vez al cargar. Si la sesion no
         estaba lista en ese instante, se quedaba vacio para siempre y ni
         recargando se arreglaba. */
  const content = leer('src/content.js');
  s.ok('el id de la cuenta se relee al preguntarlo, sin cachearlo',
    /gresp\(\{\s*accountId: k\.getUserId\(\) \|\| null\s*\}\)/.test(content));
  /* Chrome IGNORA la promesa que devuelva un listener de onMessage: cierra el
     puerto y sendMessage se rompe. La unica forma que funciona en Chrome —que
     es donde se vende— es sendResponse y devolver true. Con la promesa, el
     popup recibia null y contestaba "recarga la pestaña" para siempre. */
  s.ok('contesta con sendResponse, no devolviendo una promesa',
    /addListener\(\(gm, gs, gresp\)/.test(content) && !/type === "getAccountId"\) return Promise\.resolve/.test(content));
  s.ok('y mantiene el puerto abierto devolviendo true',
    /gresp\(\{[\s\S]{0,80}\}\);\s*return true;/.test(content));
  /* Y el listener va antes del corte por sesion, que es lo que lo mataba. */
  s.ok('el listener se registra antes de comprobar la sesion',
    content.indexOf('getAccountId') < content.indexOf('let O = k.getUserId();'));
  /* Sin sesion ya no se aborta: se espera a que llegue. */
  s.ok('sin sesion espera en vez de abandonar',
    !/if \(!O\) \{\n    console\.info\("\[Ghoosted\] No Instagram session/.test(content)
    && /O = await new Promise/.test(content));

  /* 4 · Mensajes que digan lo que pasa de verdad. "Abre Instagram" con
         Instagram abierto es lo que hace pensar que te han estafado. */
  const en = JSON.parse(leer('_locales/en/messages.json'));
  for (const k of ['popup_need_ig', 'popup_need_reload', 'popup_need_login']) {
    s.ok('existe el mensaje ' + k, !!en[k]);
  }
  /* Tres fallos distintos que antes caian en el mismo mensaje: no hay content
     script (recargar sirve), lo hay pero no contesta (recargar no sirve), y no
     hay pestaña. Decir "recarga" cuando recargar no arregla nada es lo que
     convierte un fallo en una devolucion. */
  s.ok('se distingue "no hay content script" de "esta pero no contesta"',
    /Receiving end does not exist\|context invalidated/.test(popup)
    && /aviso\(t\('popup_need_reload'\), 'err'\); return;/.test(popup)
    && /if \(fallo \|\| !quien\) \{ aviso\(t\('popup_no_answer'\)/.test(popup));
  s.ok('y el fallo real queda escrito en la consola del popup',
    /console\.error\('\[Ghoosted\] la pestaña de Instagram no contesta:'/.test(popup));
  s.ok('y "no has iniciado sesion" de las otras dos',
    /if \(!quien\.accountId\) \{ aviso\(t\('popup_need_login'\)/.test(popup));

  /* 5 · El fantasma tiene que salir SIN licencia: es desde donde se pega la
         clave. Si solo saliera con licencia, no habria forma de activarla. */
  s.ok('el panel se monta antes de comprobar la licencia',
    content.indexOf('YM(), gt(), ghdStatusLoad();') < content.indexOf('if (!v()) {\n      G(Y("unlock_status")'));

  /* 6 · Y la prueba que de verdad importa: arrancar el content script SIN
         cookie de sesion y comprobar que aun asi contesta al popup.
         Esto es lo que estaba roto. El script hacia return al no encontrar la
         cookie, asi que no montaba el panel NI registraba el listener; el
         popup no recibia respuesta y decia "abre Instagram" con Instagram
         delante. Sin salida: no podias activar una clave ya pagada. */
  const vm = require('vm');
  const nodo = () => ({ style: {}, className: '', textContent: '', innerHTML: '', hidden: false,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, append() {},
    querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, remove() {}, insertBefore() {} });

  let cookie = '';
  let escucha = null;
  const relojes = [];
  const ctx = {
    addEventListener() {}, removeEventListener() {},
    document: { cookie: '', hidden: false, addEventListener() {}, removeEventListener() {},
      createElement: nodo, body: nodo(), head: nodo(), querySelector: () => null, querySelectorAll: () => [] },
    chrome: {
      runtime: { onMessage: { addListener: (f) => { escucha = f; } }, sendMessage: async () => ({}),
        getManifest: () => ({ version: '0' }), getURL: (p) => p },
      storage: { local: { get: async () => ({}), set: async () => {}, remove: async () => {} }, onChanged: { addListener() {} } },
      alarms: { create() {}, onAlarm: { addListener() {} } },
    },
    GhostedI18n: { t: (k) => k, locale: 'es', ready: Promise.resolve() },
    GhostedStore: { get: (k, d) => d, set() {}, del() {}, syncCache() {}, hydrate: async () => {} },
    GhostedIG: { getUserId: () => cookie || null },
    GhostedLicense: { isPro: () => false, feature: () => false, getLicense: () => null, LICENSE_KEY: 'l', INSTALL_KEY: 'i' },
    GhostedConfig: { freeMode: false, product: 'pro', buyUrl: '', appUrl: 'https://ghoosted.net' },
    console: { info() {}, error() {}, warn() {}, log() {} },
    /* Los temporizadores del arranque se apuntan para poder matarlos al
       terminar: si siguen vivos, el stub incompleto revienta mas tarde y
       tumba las pruebas que vengan detras. */
    setInterval: (f) => { const t = setInterval(f, 5); relojes.push(t); return t; },
    setTimeout: (f, ms) => { const t = setTimeout(f, ms); relojes.push(t); return t; },
    clearInterval, clearTimeout,
    Promise, Date, Math, JSON, String, Number, Object, Array, Error, RegExp, Map, Set,
    TextEncoder, encodeURIComponent, decodeURIComponent, isNaN, parseInt, parseFloat, Boolean, Symbol,
  };
  ctx.self = ctx; ctx.globalThis = ctx; ctx.window = ctx;
  vm.createContext(ctx);
  /* El arranque completo no cabe en un stub y seguira fallando mas adelante,
     en trozos que a esta prueba no le importan. Lo que se mira aqui es solo el
     listener, asi que esos fallos se recogen en vez de tumbar las pruebas. */
  const tragar = () => {};
  process.on('unhandledRejection', tragar);
  process.on('uncaughtException', tragar);
  try { vm.runInContext(content, ctx); } catch (e) { /* idem */ }
  await new Promise((r) => setTimeout(r, 90));

  s.ok('arranca sin sesion y aun asi escucha al popup', typeof escucha === 'function');
  if (typeof escucha === 'function') {
    /* Se llama como lo llama Chrome: (mensaje, emisor, sendResponse). La
       respuesta llega por sendResponse, no por el valor devuelto. */
    let dicho = null;
    const abierto = escucha({ type: 'getAccountId' }, {}, (r) => { dicho = r; });
    s.eq('sin sesion contesta, no se queda mudo', dicho && 'accountId' in dicho, true);
    s.eq('y dice que no hay cuenta, en vez de nada', dicho.accountId, null);
    s.eq('deja el puerto abierto devolviendo true', abierto, true);
    /* Y en cuanto el usuario inicia sesion, sin recargar la pestaña. */
    cookie = '17841400912730044';
    dicho = null;
    escucha({ type: 'getAccountId' }, {}, (r) => { dicho = r; });
    s.eq('cuando llega la sesion, la ve sin recargar', dicho.accountId, '17841400912730044');
  }
  /* Se paran los relojes ANTES de soltar los recogedores, o el arranque a
     medias seguiria disparando en mitad de las pruebas siguientes. */
  relojes.forEach((t) => { clearInterval(t); clearTimeout(t); });
  await new Promise((r) => setTimeout(r, 30));
  process.removeListener('unhandledRejection', tragar);
  process.removeListener('uncaughtException', tragar);

  return s;
};

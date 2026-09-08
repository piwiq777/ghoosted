'use strict';
/* ===========================================================================
   PRUEBA DE HUMO SOBRE UN PAQUETE YA CONSTRUIDO
   ---------------------------------------------------------------------------
   Carga los content scripts EN EL ORDEN DEL MANIFIESTO y dentro de UN SOLO
   ambito compartido, que es exactamente como los carga Chrome, y comprueba
   que el resultado sirve para algo.

   POR QUE EXISTE ESTO:
     `node --check` mira cada fichero por separado y solo valida la sintaxis.
     La ofuscacion se aplicaba fichero a fichero, cada llamada ciega a las
     demas, y con --string-array emite dos funciones globales con nombres
     deterministas: salian IGUALES en los ocho ficheros. Como comparten ambito,
     el ultimo en cargarse machacaba a los anteriores, ig-api.js acababa
     leyendo la tabla de cadenas de otro fichero y getUserId() dejaba de
     encontrar la cookie de sesion. Sin sesion no se montaba nada.
     Los ocho ficheros pasaban `node --check`. El paquete estaba muerto.
     Solo el de Pro, ademas: Plus no se ofusca, y el fuente tampoco. Estaba
     roto justo lo unico que se vendia, y nada lo miraba.

   Devuelve { ok, motivos[], globales{}, userId }. No lanza.
   =========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CUENTA = '17841400912730044';

function nada() {}
/* Los nodos guardan hijos e id de verdad. Con un appendChild vacio, "monta el
   fantasma" y "llama a appendChild y se lo traga el doble" son indistinguibles
   — y lo que hay que comprobar aqui es justo lo primero. */
function nodo(porId) {
  const el = {
    _id: '', style: {}, className: '', textContent: '', innerHTML: '', dataset: {}, value: '',
    title: '', href: '', target: '', rel: '', type: '', placeholder: '', hijos: [],
    classList: { add: nada, remove: nada, toggle: nada, contains: () => false },
    addEventListener: nada, removeEventListener: nada,
    appendChild(c) { el.hijos.push(c); return c; },
    append(c) { return el.appendChild(c); },
    insertBefore(c) { return el.appendChild(c); },
    remove: nada, setAttribute: nada, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], focus: nada,
  };
  Object.defineProperty(el, 'id', {
    get: () => el._id,
    set: (v) => { el._id = v; if (v && porId) porId.set(v, el); },
  });
  return el;
}

function humo(raiz) {
  const motivos = [];
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(raiz, 'manifest.json'), 'utf8'));
  } catch (e) {
    return { ok: false, motivos: ['no se puede leer el manifiesto: ' + e.message], globales: {}, userId: null };
  }
  const grupo = (manifest.content_scripts || []).find((c) => c.world !== 'MAIN');
  if (!grupo || !grupo.js || !grupo.js.length) {
    return { ok: false, motivos: ['el manifiesto no declara content scripts'], globales: {}, userId: null };
  }

  const porId = new Map();
  const crear = (tag) => nodo(porId);
  const ctx = {
    document: {
      cookie: 'ds_user_id=' + CUENTA + '; csrftoken=abc', hidden: false, readyState: 'complete',
      createElement: crear, body: nodo(porId), head: nodo(porId), documentElement: nodo(porId),
      addEventListener: nada, removeEventListener: nada,
      getElementById: (id) => porId.get(id) || null,
      querySelector: () => null, querySelectorAll: () => [],
    },
    location: { href: 'https://www.instagram.com/', hostname: 'www.instagram.com', reload: nada },
    navigator: { userAgent: 'node', language: 'es' },
    addEventListener: nada, removeEventListener: nada, dispatchEvent: nada,
    chrome: {
      runtime: {
        onMessage: { addListener: nada }, sendMessage: async () => ({}),
        getManifest: () => manifest, getURL: (p) => p, id: 'x', lastError: null,
      },
      storage: {
        local: {
          get: (k, cb) => (typeof cb === 'function' ? cb({}) : Promise.resolve({})),
          set: async () => {}, remove: async () => {},
        },
        onChanged: { addListener: nada },
      },
      alarms: { create: nada, onAlarm: { addListener: nada } },
      i18n: { getMessage: () => '', getUILanguage: () => 'es' },
    },
    console: { info: nada, error: nada, warn: nada, log: nada, debug: nada },
    setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 1)),
    setInterval: () => 0, clearInterval: nada, clearTimeout: nada,
    requestAnimationFrame: (f) => setTimeout(f, 0),
    fetch: async () => ({ ok: false, status: 0, json: async () => ({}), text: async () => '' }),
    Promise, Date, Math, JSON, String, Number, Object, Array, Error, RegExp, Map, Set, WeakMap, WeakSet,
    TextEncoder, TextDecoder, encodeURIComponent, decodeURIComponent, isNaN, parseInt, parseFloat,
    Boolean, Symbol, Intl, URL, URLSearchParams, atob, btoa,
  };
  try { ctx.crypto = require('crypto').webcrypto; } catch (e) { /* sin crypto se sigue */ }
  ctx.self = ctx; ctx.globalThis = ctx; ctx.window = ctx; ctx.top = ctx;
  vm.createContext(ctx);

  /* El arranque completo no cabe en estos dobles y lanzara por otros sitios;
     lo que se mira aqui es solo si los ficheros se pisan entre ellos. */
  const tragar = () => {};
  process.on('unhandledRejection', tragar);
  process.on('uncaughtException', tragar);
  try {
    for (const rel of grupo.js) {
      const abs = path.join(raiz, rel);
      if (!fs.existsSync(abs)) { motivos.push('falta ' + rel); continue; }
      try {
        vm.runInContext(fs.readFileSync(abs, 'utf8'), ctx, { filename: rel, timeout: 20000 });
      } catch (e) {
        motivos.push(rel + ' lanza al cargarse: ' + e.message);
      }
    }

    const globales = {};
    for (const g of ['GhostedI18n', 'GhostedStore', 'GhostedIG', 'GhostedBuild', 'GhostedLicense', 'GhostedConfig']) {
      globales[g] = !!ctx[g];
      if (!ctx[g]) motivos.push('no se ha definido ' + g);
    }

    /* La prueba de fuego. Todo el producto cuelga de esta funcion: si no lee
       la cookie, no hay cuenta; sin cuenta no habia panel, ni fantasma, ni
       manera de activar una clave ya pagada. */
    let userId = null;
    try {
      userId = ctx.GhostedIG && ctx.GhostedIG.getUserId();
    } catch (e) {
      motivos.push('getUserId() lanza: ' + e.message);
    }
    if (userId !== CUENTA) {
      motivos.push('getUserId() devuelve ' + JSON.stringify(userId) + ' con la cookie ds_user_id delante');
    }

    /* El fantasma. Es lo unico que hay en Instagram antes de que el panel este
       listo, y lo unico que hay para quien aun no ha activado la clave. Si no
       sale, el comprador abre Instagram, no ve nada y pide la devolucion. */
    const fab = porId.get('ghd-boot-fab');
    if (!fab) motivos.push('el fantasma de arranque no se monta en la pagina');
    else if (ctx.document.body.hijos.indexOf(fab) === -1) motivos.push('el fantasma se crea pero no se cuelga del body');

    /* Y que los textos salgan del fichero que toca, no del de al lado. */
    try {
      const t = ctx.GhostedI18n && ctx.GhostedI18n.t('unlock_activate');
      if (!t || t === 'unlock_activate') motivos.push('GhostedI18n.t no devuelve el texto de unlock_activate');
    } catch (e) {
      motivos.push('GhostedI18n.t lanza: ' + e.message);
    }

    return { ok: motivos.length === 0, motivos, globales, userId };
  } finally {
    process.removeListener('unhandledRejection', tragar);
    process.removeListener('uncaughtException', tragar);
  }
}

module.exports = { humo, CUENTA };

/* Se ejecuta tambien como programa: `node tools/humo.js <carpeta>`.
   Los que lo usan lo llaman ASI, en un proceso aparte, y no importandolo: un
   paquete roto lanza por dentro de forma asincrona, con temporizadores vivos y
   promesas colgando, y eso ensuciaria a quien lo llame. En un proceso hijo,
   lo unico que sale es el codigo de salida y el informe. */
if (require.main === module) {
  const r = humo(process.argv[2]);
  process.stdout.write(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}

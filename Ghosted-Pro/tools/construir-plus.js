'use strict';
/* ===========================================================================
   CONSTRUIR PLUS  —  Ghosted-Pro  ->  Ghosted-Plus
   ---------------------------------------------------------------------------
   Plus deja de ser un programa aparte. A partir de aqui SE GENERA desde Pro,
   que es la unica fuente de verdad. El Plus anterior era del 26 de julio y no
   tenia ninguna de las correcciones de estas semanas; eso no puede repetirse.

   Que hace Plus distinto de Pro: no esconde funciones, LAS QUITA. El codigo
   sale del paquete. Un revisor de Google lee los fuentes, no la interfaz, y
   una funcion "desactivada por una bandera" sigue estando ahi.

   Fuera de Plus:
     · modo fantasma y visor de historias
     · descargas de fotos, historias y destacados de otras personas
     · ranking de espectadores de historias
     · espejo del movil (qr.js, mobile.js y su canal)
     · punto de mira: vigilancia continuada de cuentas de terceros
     · toda accion de escritura: dejar de seguir y aprobar solicitudes

   Se queda: el analisis de TU cuenta, y la exportacion de tus propios datos
   en JSON, que es un derecho de acceso y portabilidad del RGPD.

   Como se marca lo que se va, en cualquier .js o .css de Pro:

       //#plus-off  motivo
       ...codigo que NO viaja a Plus...
       //#plus-on

   Uso:  node tools/construir-plus.js [--dry]
   =========================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PRO = path.resolve(__dirname, '..');
const PLUS = path.resolve(PRO, '..', 'Ghosted-Plus');
const SECO = process.argv.includes('--dry');

/* Ficheros que no existen en Plus. qr/mobile son el espejo del movil; test,
   tools y package.json son de desarrollo y no deben viajar en el zip. */
const FUERA = new Set([
  'src/qr.js', 'src/mobile.js',
  'package.json', 'LEEME-instalar.txt',
]);
const DIRS_FUERA = new Set(['test', 'tools', 'node_modules', '.git']);

/* Prefijos de claves de idioma que se caen con sus funciones. Se aplican
   tanto a src/i18n.js (los textos por defecto) como a los messages.json
   de _locales. Los ficheros de idioma tambien se leen: dejar ahi una
   frase que describe vigilar cuentas ajenas es igual de malo que dejar el
   codigo, porque explica una funcion que el paquete dice no tener. */
const CLAVES_FUERA = [
  // OJO: se filtra por FUNCION, no por prefijo a ojo. Estas se quedan porque
  // su codigo sigue en Plus: abrir la foto en una pestana es mirar, no bajar;
  // el historial de fotos de perfil es un registro de cambios; y gh_err_rate
  // es el mensaje generico de "vas muy rapido", que Plus tambien necesita.
  /^gh_(?!err_rate$)/,          // visor de historias y modo fantasma
  /^dos_ghost/, /^dos_download$/, /^dos_downloading/, /^dos_downloaded/,
  /^mobile_/, /^settings_connect_mobile$/,
  /^activity_watch_/, /^notif_watch_/, /^watch_toggle_/,
  /^dos_watch/, /^dos_watching/,
  /^pair_/, /^wt_/, /^req_/, /^gs_/,
  /^status_watch_(?!notfound$)/,   // notfound se usa en un error generico
  /^activity_desc$/,           // la version larga invita a anadir cuentas ajenas
  /^empty_unfollow$/,          // habla de "vigilar"; Plus usa la variante _own
  /^activity_remove$/, /^toast_watching$/, /^toast_unwatched$/,  // avisos del punto de mira
];

const avisos = [];
let quitadas = 0;

/* Nombres declarados DENTRO de lo que se recorta. Se guardan para luego
   comprobar que Plus no llama a nada que ya no existe: eso la sintaxis no lo
   ve (el fichero compila) y solo revienta cuando el usuario abre la pestana. */
const declaradosFuera = new Set();
const funcionesFuera = new Set();

function apuntarDeclaraciones(linea) {
  // SOLO lo declarado al nivel de arriba del modulo (sangria de 0 a 2). Las
  // variables locales de dentro de una funcion no valen: se llaman `items` o
  // `part` y coincidirian con medio programa.
  const m = linea.match(/^ {0,2}(?:async )?(?:function|class)\s+([A-Za-z_$][\w$]*)/);
  // Las funciones se guardan aparte: como el codigo esta minificado se llaman
  // Y6, Yq, t4... y por longitud nunca pasarian el filtro. Para estas se busca
  // la llamada, `Y6(`, que no da falsos positivos.
  if (m) { funcionesFuera.add(m[1]); return; }
  const lista = linea.match(/^ {0,2}(?:const|let|var)\s+(.+)$/);
  if (!lista) return;
  for (const trozo of lista[1].split(',')) {
    const nom = trozo.trim().match(/^([A-Za-z_$][\w$]*)\s*=/);
    if (nom) declaradosFuera.add(nom[1]);
  }
}

function quitarRegiones(texto, fichero) {
  const lineas = texto.split('\n');
  const salida = [];
  let dentro = false, abiertaEn = 0, motivo = '';
  lineas.forEach((linea, i) => {
    const ini = linea.match(/^\s*(?:\/\/|\/\*)#plus-off\b\s*(.*?)\s*(?:\*\/)?\s*$/);
    const fin = /^\s*(?:\/\/|\/\*)#plus-on\b/.test(linea);
    if (ini) {
      if (dentro) throw new Error(`${fichero}:${i + 1} #plus-off anidado (el de la linea ${abiertaEn} sigue abierto)`);
      dentro = true; abiertaEn = i + 1; motivo = ini[1] || '(sin motivo)';
      return;
    }
    if (fin) {
      if (!dentro) throw new Error(`${fichero}:${i + 1} #plus-on sin su #plus-off`);
      dentro = false; quitadas++;
      return;
    }
    if (dentro) apuntarDeclaraciones(linea);
    else salida.push(linea);
  });
  if (dentro) throw new Error(`${fichero}:${abiertaEn} #plus-off sin cerrar (${motivo})`);
  return salida.join('\n');
}

function equilibrado(css) {
  let a = 0, cadena = null, comentario = false;
  for (let i = 0; i < css.length; i++) {
    const c = css[i], d = css[i + 1];
    if (comentario) { if (c === '*' && d === '/') { comentario = false; i++; } continue; }
    if (cadena) { if (c === '\\') i++; else if (c === cadena) cadena = null; continue; }
    if (c === '/' && d === '*') { comentario = true; i++; continue; }
    if (c === '"' || c === "'") { cadena = c; continue; }
    if (c === '{') a++;
    else if (c === '}') a--;
  }
  return a === 0;
}

function transformarManifest(txt) {
  const m = JSON.parse(txt);
  m.short_name = 'Ghoosted Plus';
  if (m.action) m.action.default_title = 'Ghoosted Plus';
  // Sin el permiso "downloads": Plus no puede guardar nada en el disco, y esa
  // es la linea que importa. Lo comprueba la prueba de descargas.
  m.permissions = (m.permissions || []).filter((p) => p !== 'downloads' && p !== 'unlimitedStorage');
  // Los CDN SI se quedan. Los quite pensando que solo servian para descargar y
  // dejaron sin fotos de perfil a media interfaz: cuando Instagram rechaza la
  // carga directa de un <img>, el rescate pasa por pedirle la imagen al
  // service worker, y para eso hace falta permiso sobre el CDN. Mostrar un
  // avatar es lo mismo que hace Instagram; guardarlo en el disco es lo que no
  // se puede, y eso ya no es posible por otro camino.
  m.host_permissions = m.host_permissions || [];
  m.content_scripts = (m.content_scripts || []).map((c) => ({
    ...c,
    js: (c.js || []).filter((j) => !FUERA.has(j)),
  }));
  return JSON.stringify(m, null, 2) + '\n';
}

function filtrarIdiomas(txt) {
  const fuera = [];
  const lineas = txt.split('\n').filter((l) => {
    const m = l.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m && CLAVES_FUERA.some((re) => re.test(m[1]))) { fuera.push(m[1]); return false; }
    return true;
  });
  avisos.push(`  i18n.js: ${fuera.length} claves retiradas`);
  return lineas.join('\n');
}

/* Lo mismo, pero sobre los ficheros de traduccion de Chrome. */
function filtrarMensajes(txt, rel) {
  const d = JSON.parse(txt);
  const fuera = Object.keys(d).filter((k) => CLAVES_FUERA.some((re) => re.test(k)));
  for (const k of fuera) delete d[k];
  if (fuera.length) avisos.push(`  ${rel}: ${fuera.length} textos retirados`);
  return JSON.stringify(d, null, 2) + '\n';
}

function recorrer(dir, rel = '') {
  for (const nombre of fs.readdirSync(dir)) {
    const abs = path.join(dir, nombre);
    const r = rel ? `${rel}/${nombre}` : nombre;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      if (DIRS_FUERA.has(nombre)) continue;
      recorrer(abs, r);
      continue;
    }
    if (FUERA.has(r)) { avisos.push(`  fuera: ${r}`); continue; }
    procesar(abs, r);
  }
}

function procesar(abs, rel) {
  const destino = path.join(PLUS, rel);
  const bin = /\.(png|jpg|jpeg|webp|zip|woff2?|ico)$/i.test(rel);
  if (bin) { if (!SECO) { fs.mkdirSync(path.dirname(destino), { recursive: true }); fs.copyFileSync(abs, destino); } return; }

  let txt = fs.readFileSync(abs, 'utf8');
  if (/\.(js|css|html|json|txt|md)$/i.test(rel)) txt = quitarRegiones(txt, rel);

  if (rel === 'manifest.json') txt = transformarManifest(txt);
  if (rel === 'src/i18n.js') txt = filtrarIdiomas(txt);
  if (/^_locales\/[^/]+\/messages\.json$/.test(rel)) txt = filtrarMensajes(txt, rel);
  if (rel === 'src/build.js') {
    txt = txt.replace(/PRODUCT:\s*'pro'/, "PRODUCT: 'plus'");
    if (!/PRODUCT: 'plus'/.test(txt)) throw new Error('build.js: no pude marcar PRODUCT como plus');
  }
  if (/\.css$/.test(rel) && !equilibrado(txt)) throw new Error(`${rel}: llaves descuadradas tras recortar`);

  if (!SECO) {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, txt);
  }
}

/* Lo que quedo en Plus no puede nombrar nada de lo que se fue. */
function comprobarHuerfanos() {
  const rotos = [];
  (function anda(dir) {
    for (const n of fs.readdirSync(dir)) {
      const a = path.join(dir, n);
      if (fs.statSync(a).isDirectory()) { anda(a); continue; }
      if (!/\.(js|html)$/.test(n)) continue;
      const txt = fs.readFileSync(a, 'utf8');
      const mirar = [];
      // funciones: se busca la llamada, sea cual sea la longitud del nombre
      for (const f of funcionesFuera) mirar.push([f, new RegExp('\\b' + f.replace(/\$/g, '\\$') + '\\s*\\(')]);
      // variables: por nombre, y solo si es lo bastante largo para no chocar
      for (const v of declaradosFuera) {
        if (v.length < 4) continue;
        mirar.push([v, new RegExp('\\b' + v.replace(/\$/g, '\\$') + '\\b')]);
      }
      for (const [nombre, re] of mirar) {
        const lineas = txt.split('\n');
        const i = lineas.findIndex((l) => re.test(l) && !/^\s*(\/\/|\*)/.test(l));
        if (i >= 0) rotos.push(`${path.relative(PLUS, a)}:${i + 1} usa ${nombre}, que se recorto`);
      }
    }
  })(PLUS);
  return rotos;
}

function comprobarSintaxis() {
  const malos = [];
  (function anda(dir) {
    for (const n of fs.readdirSync(dir)) {
      const a = path.join(dir, n);
      if (fs.statSync(a).isDirectory()) { anda(a); continue; }
      if (!n.endsWith('.js')) continue;
      try { execFileSync(process.execPath, ['--check', a], { stdio: 'pipe' }); }
      catch (e) { malos.push(`${path.relative(PLUS, a)}: ${String(e.stderr).split('\n')[2] || 'error'}`); }
    }
  })(PLUS);
  return malos;
}

/* ---- ejecucion ---- */
console.log(`\nConstruyendo Plus desde Pro${SECO ? ' (en seco, no escribe)' : ''}\n`);
if (!SECO && fs.existsSync(PLUS)) fs.rmSync(PLUS, { recursive: true, force: true });
recorrer(PRO);
avisos.forEach((a) => console.log(a));
console.log(`  regiones #plus-off retiradas: ${quitadas}`);

if (!SECO) {
  const malos = comprobarSintaxis();
  if (malos.length) {
    console.log(`\n\x1b[31mSINTAXIS ROTA en ${malos.length} fichero(s):\x1b[0m`);
    malos.forEach((m) => console.log('  ' + m));
    process.exit(1);
  }
  const huerfanos = comprobarHuerfanos();
  if (huerfanos.length) {
    console.log(`\n\x1b[31mPlus llama a ${huerfanos.length} cosa(s) que ya no existen:\x1b[0m`);
    huerfanos.forEach((h) => console.log('  ' + h));
    process.exit(1);
  }
  console.log('\n\x1b[32mPlus construido: sintaxis correcta y sin llamadas huerfanas\x1b[0m\n');
}

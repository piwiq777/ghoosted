'use strict';
/* La red de seguridad del paquete Plus.
 *
 * Plus se genera desde Pro con tools/construir-plus.js. Estas comprobaciones
 * son las que impiden que vuelva a pasar lo de julio: que Plus se quede atras,
 * o peor, que una funcion que no puede estar en la Chrome Web Store se cuele
 * en el paquete porque alguien la anadio a Pro sin marcarla.
 *
 * Reconstruye Plus antes de mirarlo, asi que siempre juzga el codigo de hoy. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const RAIZ = path.join(__dirname, '..');
const PLUS = path.join(RAIZ, '..', 'Ghosted-Plus');

const leer = (rel) => {
  const p = path.join(PLUS, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

module.exports = () => {
  const s = suite('paquete Plus · lo que no puede llevar');

  let construyo = null;
  try {
    execFileSync(process.execPath, [path.join(RAIZ, 'tools', 'construir-plus.js')], { stdio: 'pipe' });
  } catch (e) { construyo = String(e.stderr || e.message).slice(0, 200); }
  s.eq('se construye desde Pro sin errores', construyo, null);

  const bg = leer('src/background.js') || '';
  const puente = leer('src/page-api.js') || '';
  const cont = leer('src/content.js') || '';
  const i18n = leer('src/i18n.js') || '';
  const todo = bg + puente + cont + i18n;

  // --- capacidades que NO pueden viajar ---
  s.ok('sin descarga de medios al disco', !/downloadMedia/.test(todo));
  s.ok('sin canal de moviles', !/mobilePush/.test(todo));
  s.ok('sin generador de QR', !fs.existsSync(path.join(PLUS, 'src/qr.js')));
  s.ok('sin modulo del movil', !fs.existsSync(path.join(PLUS, 'src/mobile.js')));

  // El puente tiene que rechazar CUALQUIER escritura, y no por una bandera:
  // porque la lista de rutas permitidas esta vacia.
  const m = puente.match(/var POST_ALLOWED = (\/.*?\/);/);
  s.ok('el puente declara su lista de escritura', !!m);
  if (m) {
    const re = eval(m[1]);
    for (const ruta of [
      'https://www.instagram.com/api/v1/friendships/destroy/123/',
      'https://www.instagram.com/api/v1/friendships/create/123/',
      'https://www.instagram.com/api/v1/web/friendships/123/approve/',
      'https://www.instagram.com/api/v1/web/friendships/123/ignore/',
    ]) s.ok('el puente rechaza ' + ruta.split('/api/v1/')[1], !re.test(ruta));
  }
  s.ok('no queda una segunda lista que la amplie', !/^\s*POST_ALLOWED = /m.test(puente));

  // --- punto de mira: vigilancia de cuentas ajenas ---
  for (const [nombre, aguja] of [
    ['la lista de cuentas vigiladas', 'ghd-watch-form'],
    ['el buscador de vigilancia', 'activity_watch_search'],
    ['los avisos de cuenta vigilada', 'notif_watch_'],
    ['el rastreo de historias ajenas', 'J.storyWatch, gx'],
    ['el conteo de seguidores de vigilados', 'J.watchStats'],
    ['el boton de vigilar del expediente', 'dos_watching'],
  ]) s.ok('sin ' + nombre, !todo.includes(aguja));

  // --- parejas: vigilar la relacion entre dos terceros ---
  for (const t of ['ghdPairs', 'ghdPairScan', 'ghdPairToggle', 'ghd-pair-btn']) {
    s.ok('sin ' + t, !todo.includes(t));
  }

  // --- escritura: nada que modifique la cuenta ---
  for (const [nombre, aguja] of [
    ['dejar de seguir', 'friendships/destroy'],
    ['aprobar solicitudes', 'web/friendships'],
    ['solicitudes pendientes', 'pendingRequests'],
    ['aprobacion automatica', 'ghdReqRun'],
  ]) s.ok('sin ' + nombre, !todo.includes(aguja));

  // --- visor de historias y modo fantasma ---
  for (const [nombre, aguja] of [
    ['visor de historias', 'ghd-gv-btn'],
    ['modo fantasma', 'dos_ghost'],
    ['pestanas de espectadores', 'ghd-pro-tab'],
    ['carga de espectadores', 'J.storyArchive'],
  ]) s.ok('sin ' + nombre, !todo.includes(aguja));

  // --- descargas de contenido ajeno ---
  for (const [nombre, aguja] of [
    ['boton de descargar foto', 'dos-act primary'],
    ['descarga por publicacion', 'dos-post-dl'],
    ['descarga en los visores', 'ghst-dl'],
    ['guardado de la foto de perfil', 'ig_" + gq.username'],
  ]) s.ok('sin ' + nombre, !todo.includes(aguja));

  // --- los ficheros de idioma tambien se leen ---
  // Un texto que describe vigilar cuentas ajenas delata una funcion que el
  // paquete dice no tener, aunque no lo pinte nadie.
  const fs2 = require('fs');
  const dirLoc = path.join(PLUS, '_locales');
  let sospechosos = 0;
  if (fs2.existsSync(dirLoc)) {
    for (const loc of fs2.readdirSync(dirLoc)) {
      const f = path.join(dirLoc, loc, 'messages.json');
      if (!fs2.existsSync(f)) continue;
      const dic = JSON.parse(fs2.readFileSync(f, 'utf8'));
      /* "fantasma" a secas ya no basta como señal: el boton flotante de las
         DOS versiones se llama asi, y es como el comprador lo identifica. Lo
         que no puede aparecer en Plus es el modo fantasma de historias y la
         vigilancia de cuentas ajenas. Estas claves hablan del boton, no de
         esas funciones. */
      const DEL_BOTON = new Set(['popup_no_answer']);
      for (const k of Object.keys(dic)) {
        if (DEL_BOTON.has(k)) continue;
        if (/vigil|watch any|fantasma|ghost mode|spy\b/i.test(dic[k].message || '')) sospechosos++;
      }
    }
  }
  s.eq('ningun idioma describe funciones que no lleva', sospechosos, 0);
  s.ok('los idiomas se han filtrado', !JSON.stringify(
    fs2.existsSync(path.join(dirLoc, 'es', 'messages.json'))
      ? JSON.parse(fs2.readFileSync(path.join(dirLoc, 'es', 'messages.json'), 'utf8'))
      : {}).includes('activity_watch_'));

  // --- ningun texto puede quedarse sin traducir ---
  // Este es el que faltaba: al filtrar los idiomas se puede quitar una clave
  // cuyo boton sigue existiendo, y entonces el usuario ve el nombre crudo de
  // la clave en pantalla ("dos_openpic"). Paso una vez; no vuelve a pasar.
  const dicEs = fs2.existsSync(path.join(dirLoc, 'en', 'messages.json'))
    ? Object.keys(JSON.parse(fs2.readFileSync(path.join(dirLoc, 'en', 'messages.json'), 'utf8')))
    : [];
  const pedidas = new Set();
  const alVuelo = new Set();
  for (const f of ['src/content.js', 'src/ig-api.js', 'src/background.js']) {
    const t = leer(f) || '';
    for (const m of t.matchAll(/Y\(["']([a-z0-9_]+)["']/g)) pedidas.add(m[1]);
    for (const m of t.matchAll(/Y\(["']([a-z0-9_]+)["']\s*\+/g)) alVuelo.add(m[1]);
  }
  const enDefecto = new Set();
  for (const m of (leer('src/i18n.js') || '').matchAll(/^\s*([a-z0-9_]+)\s*:/gm)) enDefecto.add(m[1]);
  const huerfanas = [...pedidas]
    .filter((k) => !dicEs.includes(k) && !enDefecto.has(k) && !alVuelo.has(k))
    .sort();
  s.eq('ningun texto se queda sin traducir', huerfanas, []);

  // Ninguna descarga al disco salvo la exportacion de los datos propios,
  // que es un derecho de acceso del RGPD y tiene que quedarse.
  const descargas = [...(cont.matchAll(/\.download\s*=\s*"([^"]*)/g))].map((m) => m[1]);
  s.eq('solo se descarga la exportacion propia', descargas, ['ghosted-']);

  // --- huecos vacios en la interfaz ---
  // Al recortar es facil dejar un elemento que SE CREA pero se queda sin
  // clase ni texto, porque esas lineas estaban dentro del recorte. Compila,
  // no da error, y el usuario ve un rectangulo gris. Ya paso con el boton de
  // descargar foto. Aqui se comprueba que todo boton creado recibe su clase.
  const sinClase = [];
  for (const m of cont.matchAll(/const ([A-Za-z0-9_$]+) = document\.createElement\("button"\)/g)) {
    const v = m[1];
    const tieneClase = new RegExp('\\b' + v.replace(/\$/g, '\\$') + '\\.(className|classList)\\b').test(cont);
    const tieneTexto = new RegExp('\\b' + v.replace(/\$/g, '\\$') + '\\.(textContent|innerHTML)\\b').test(cont);
    if (!tieneClase && !tieneTexto) sinClase.push(v);
  }
  s.eq('ningun boton se queda sin clase ni texto', sinClase, []);

  // Tampoco pueden quedar NOMBRES de claves de funciones recortadas: un
  // revisor que haga grep encuentra "watchedProfiles" y pregunta por que una
  // extension que dice no vigilar a nadie tiene una lista de vigilados.
  for (const k of ['watchedProfiles', 'pairWatch', 'watchStats', 'reqRule', 'spyCursor']) {
    s.ok('sin la clave de almacenamiento ' + k, !cont.includes('"' + k + '"'));
  }

  // --- el manifiesto ---
  const man = JSON.parse(leer('manifest.json') || '{}');
  s.ok('sin permiso de descargas', !(man.permissions || []).includes('downloads'));
  // Los CDN se quedan: sin ellos no se ven las fotos de perfil. Lo que no
  // puede estar es el permiso de descargas, comprobado arriba y reforzado por
  // la prueba de que no hay ningun .download aparte de la exportacion propia.
  s.ok('puede mostrar fotos de perfil', (man.host_permissions || []).some((h) => /cdninstagram/.test(h)));
  s.eq('se anuncia como Plus', man.short_name, 'Ghoosted Plus');
  s.ok('no declara qr.js ni mobile.js', !JSON.stringify(man.content_scripts || []).match(/qr\.js|mobile\.js/));

  // --- la bandera de producto ---
  const build = leer('src/build.js') || '';
  s.ok("build.js dice PRODUCT 'plus'", /PRODUCT:\s*'plus'/.test(build));

  // --- y que NO se haya quedado atras respecto a Pro ---
  // Una muestra del trabajo reciente: si algo de esto falta, Plus volvio a
  // ser un programa viejo en vez de Pro recortado.
  for (const fn of ['ghdNorm', 'ghdToast', 'ghdLoadShow', 'ghdFaceRun', 'ghdVerCmp']) {
    s.ok('hereda ' + fn + ' de Pro', cont.includes(fn));
  }

  // --- y que no esté ofuscado, que es lo que lo habría tumbado en revisión ---
  const ofusca = [
    ['!![] en vez de true', /!!\[\]/],
    ['numeros en hexadecimal', /:\s*0x[0-9a-f]{2,}/i],
    ['propiedades por corchetes', /window\['[a-zA-Z_]/],
  ];
  for (const [nombre, re] of ofusca) s.ok('sin ' + nombre, !re.test(cont));
  s.ok('el fuente viene en varias lineas, legible', cont.split('\n').length > 500);

  return s;
};

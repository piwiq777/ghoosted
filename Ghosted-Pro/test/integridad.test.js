'use strict';
/* Vigila los fallos que no se ven leyendo: sintaxis rota, dos funciones con
 * el mismo nombre (el minificador usa nombres de dos letras y ya ha pasado
 * tres veces), idiomas descuadrados y textos usados pero no traducidos. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');

module.exports = () => {
  const s = suite('integridad del paquete');

  // --- sintaxis ---
  const clasicos = ['content.js', 'ig-api.js', 'page-api.js', 'i18n.js', 'storage.js', 'license.js', 'build.js'];
  for (const f of clasicos) {
    let err = null;
    try { new Function(fs.readFileSync(path.join(SRC, f), 'utf8')); } catch (e) { err = e.message; }
    s.eq('sintaxis correcta · ' + f, err, null);
  }
  { let err = null;
    try { new (require('vm').Script)(fs.readFileSync(path.join(SRC, 'background.js'), 'utf8'), { importModuleDynamically: () => {} }); }
    catch (e) { err = /import|export/.test(e.message) ? null : e.message; }
    s.eq('sintaxis correcta · background.js (es módulo)', err, null); }

  // --- nombres repetidos: el fallo que rompió el expediente y el repintado ---
  const contenido = fs.readFileSync(path.join(SRC, 'content.js'), 'utf8');
  const declaradas = {};
  for (const m of contenido.matchAll(/(?<![A-Za-z0-9_$])function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) {
    declaradas[m[1]] = (declaradas[m[1]] || 0) + 1;
  }
  const repetidas = Object.entries(declaradas).filter(([, n]) => n > 1).map(([k]) => k);
  s.eq('ninguna función declarada dos veces en content.js', repetidas, []);

  // --- idiomas ---
  const dir = path.join(RAIZ, '_locales');
  const idiomas = fs.readdirSync(dir).sort();
  const claves = {};
  for (const l of idiomas) claves[l] = Object.keys(JSON.parse(fs.readFileSync(path.join(dir, l, 'messages.json'), 'utf8'))).sort();
  s.ok('hay 12 idiomas', idiomas.length === 12);
  const base = claves.en || [];
  for (const l of idiomas) {
    const faltan = base.filter((k) => !claves[l].includes(k));
    const sobran = claves[l].filter((k) => !base.includes(k));
    s.eq('mismas claves que en inglés · ' + l, { faltan, sobran }, { faltan: [], sobran: [] });
  }
  // ningún texto vacío
  for (const l of idiomas) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, l, 'messages.json'), 'utf8'));
    const vacias = Object.keys(d).filter((k) => !String(d[k] && d[k].message || '').trim());
    s.eq('sin textos vacíos · ' + l, vacias, []);
  }

  // --- textos que el código pide y no existen ---
  const usadas = new Set();
  for (const f of ['content.js', 'ig-api.js', 'background.js']) {
    const t = fs.readFileSync(path.join(SRC, f), 'utf8');
    // comillas simples Y dOBLES: el fuente minificado usa dobles, asi que la
    // version que solo miraba simples no comprobaba practicamente nada.
    for (const m of t.matchAll(/Y\(["']([a-z0-9_]+)["']/g)) usadas.add(m[1]);
  }
  // se descartan las claves que el código construye al vuelo, como Y('eng_'+x)
  const construidas = new Set();
  for (const f of ['content.js', 'ig-api.js', 'background.js']) {
    const t = fs.readFileSync(path.join(SRC, f), 'utf8');
    for (const m of t.matchAll(/Y\(["']([a-z0-9_]+)["']\s*\+/g)) construidas.add(m[1]);
  }
  const sinTraducir = [...usadas].filter((k) => !base.includes(k) && !construidas.has(k)).sort();
  s.eq('todo texto pedido por el código está traducido', sinTraducir, []);

  // --- manifiesto ---
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.json'), 'utf8'));
  s.eq('versión con tres números', /^\d+\.\d+\.\d+$/.test(man.version), true);
  s.eq('los ficheros del manifiesto existen',
    [...(man.content_scripts || []).flatMap((c) => [...(c.js || []), ...(c.css || [])]),
     (man.background || {}).service_worker].filter(Boolean)
      .filter((f) => !fs.existsSync(path.join(RAIZ, f))), []);
  s.eq('los iconos existen', Object.values(man.icons || {}).filter((f) => !fs.existsSync(path.join(RAIZ, f))), []);
  /* Los tres sitios donde se declara el dominio tienen que decir lo mismo. Si
     web_accessible_resources se queda solo con www, quien entre por
     instagram.com a secas no puede cargar relations.html ni el icono: el
     navegador los bloquea sin decir por que. */
  const manDom = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.json'), 'utf8'));
  const DOMINIOS = ['https://www.instagram.com/*', 'https://instagram.com/*'];
  const cubre = (lista) => DOMINIOS.every((d) => (lista || []).indexOf(d) !== -1);
  s.ok('los content scripts cubren los dos dominios de Instagram',
    manDom.content_scripts.every((c) => cubre(c.matches)));
  s.ok('los permisos de host, tambien', cubre(manDom.host_permissions));
  s.ok('y los recursos accesibles desde la pagina',
    (manDom.web_accessible_resources || []).every((w) => cubre(w.matches)));

  return s;
};

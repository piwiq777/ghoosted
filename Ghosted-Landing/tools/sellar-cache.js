/* ===========================================================================
   Sella las versiones de cache (?v=N) contra el contenido real.
   Uso:  node tools/sellar-cache.js          sube las que hayan cambiado
         node tools/sellar-cache.js --ver    solo dice cuales estan sin sellar

   Por que existe: los navegadores se quedan con styles.css y con los ficheros
   de idioma hasta que cambia el ?v=. Si se traduce algo nuevo y no se sube el
   numero, el visitante que ya habia entrado sigue viendo el texto viejo — en
   ingles, con la maqueta antigua — y parece que la web esta rota. Ha pasado.

   Esto lo hace automatico: se calcula un hash del contenido y, si no coincide
   con el sellado, se sube el numero y se reescriben todas las referencias.
   =========================================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WEB = path.resolve(__dirname, '..');
const SELLO = path.join(WEB, 'lib', 'cache.json');
const SOLO_VER = process.argv.includes('--ver');

/* Cada grupo: que ficheros lo componen y como se escribe su ?v= por ahi. */
const GRUPOS = {
  'styles.css': { ficheros: ['styles.css'], patron: /styles\.css\?v=\d+/g, plantilla: (v) => `styles.css?v=${v}` },
  'legal.css': { ficheros: ['legal.css'], patron: /legal\.css\?v=\d+/g, plantilla: (v) => `legal.css?v=${v}` },
  /* El guion delante es imprescindible: sin el, este patron encaja tambien
     dentro de "legal-i18n.js?v=N" y le pisaba el numero al otro grupo. */
  'i18n.js': { ficheros: ['i18n.js'], patron: /(?<!-)i18n\.js\?v=\d+/g, plantilla: (v) => `i18n.js?v=${v}` },
  'app.js': { ficheros: ['app.js'], patron: /app\.js\?v=\d+/g, plantilla: (v) => `app.js?v=${v}` },
  'legal-i18n.js': { ficheros: ['legal-i18n.js'], patron: /legal-i18n\.js\?v=\d+/g, plantilla: (v) => `legal-i18n.js?v=${v}` },
  // Los idiomas van juntos: cambiar uno obliga a refrescar el numero, y son
  // el mismo parametro en todas las paginas que los piden.
  locales: {
    ficheros: fs.readdirSync(path.join(WEB, 'locales')).sort().map((f) => 'locales/' + f),
    patron: /\.json\?v=\d+/g, plantilla: (v) => `.json?v=${v}`,
  },
};

/* Donde se escriben las referencias. */
const DONDE = fs.readdirSync(WEB)
  .filter((f) => /\.(html|js)$/.test(f))
  .concat(['i18n.js']);

/* Los propios ?v= se borran antes de medir. i18n.js lleva dentro el numero de
   los idiomas, asi que sellar los idiomas ensuciaba i18n.js y obligaba a
   ejecutar esto dos veces seguidas. */
function hash(ficheros) {
  const h = crypto.createHash('sha256');
  for (const f of ficheros) {
    h.update(fs.readFileSync(path.join(WEB, f), 'utf8').replace(/\?v=\d+/g, '?v='));
  }
  return h.digest('hex').slice(0, 16);
}

/* Si no hay sello, NO se empieza por 1: se lee el numero que ya esta escrito
   en las paginas. Empezar de cero rebaja styles.css de v97 a v2, y quien
   tuviera cacheado un v2 de hace meses se lo comeria otra vez. */
function versionEnUso(g) {
  for (const f of DONDE) {
    const m = fs.readFileSync(path.join(WEB, f), 'utf8').match(g.patron);
    /* Los digitos van tras el ?v=, no los primeros de la cadena: en
       "i18n.js?v=36" el primer numero que aparece es el 18 de "i18n". */
    if (m) { const n = Number((String(m[0]).match(/\?v=(\d+)/) || [])[1]); if (n) return n; }
  }
  return 1;
}

const sello = fs.existsSync(SELLO) ? JSON.parse(fs.readFileSync(SELLO, 'utf8')) : {};
const sucios = [];

for (const [nombre, g] of Object.entries(GRUPOS)) {
  const actual = hash(g.ficheros);
  const guardado = sello[nombre] || { v: versionEnUso(g) - 1, hash: null };
  if (guardado.hash === actual) continue;
  sucios.push(nombre);
  if (SOLO_VER) continue;
  const v = guardado.v + 1;
  sello[nombre] = { v, hash: actual };
  for (const f of new Set(DONDE)) {
    const p = path.join(WEB, f);
    const txt = fs.readFileSync(p, 'utf8');
    const nuevo = txt.replace(g.patron, g.plantilla(v));
    if (nuevo !== txt) fs.writeFileSync(p, nuevo);
  }
  console.log(`  ${nombre} → v${v}`);
}

if (SOLO_VER) {
  if (sucios.length) {
    console.log(`\n\x1b[31mSin sellar: ${sucios.join(', ')}\x1b[0m`);
    console.log('  node tools/sellar-cache.js\n');
    process.exit(1);
  }
  console.log('  cache sellada\n');
} else {
  fs.writeFileSync(SELLO, JSON.stringify(sello, null, 2) + '\n');
  console.log(sucios.length ? '\n  sellado\n' : '  nada que sellar\n');
}

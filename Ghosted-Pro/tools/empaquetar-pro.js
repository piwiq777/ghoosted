'use strict';
/* ===========================================================================
   EMPAQUETAR PRO  —  el ZIP que se descarga el cliente
   ---------------------------------------------------------------------------
   Pro no va a la Chrome Web Store, va desde ghoosted.net con clave. Eso
   permite ofuscar el codigo, cosa que la tienda prohibe.

   POR QUE SOLO AQUI, Y NO EN EL FUENTE:
     · el repositorio se queda legible, que es como se mantiene
     · Ghosted-Plus se genera desde el fuente ANTES de este paso, asi que
       llega a la tienda sin ofuscar, que es como tiene que llegar
     · si algun dia hay que depurar algo, el codigo de verdad esta intacto

   QUE PROTEGE Y QUE NO — importa no enganarse:
     NO impide copiar el ZIP y pasarlo. Nada lo impide.
     SI dificulta que alguien encuentre el interruptor FREE_MODE o la llamada
     de verificacion y los desactive. Eso es lo unico que se compra aqui.
     La proteccion de verdad es la licencia: una clave queda atada a UNA
     cuenta de Instagram en el servidor, y eso no se puede parchear desde el
     cliente.

   Uso:  node tools/empaquetar-pro.js [--claro]
         --claro  empaqueta sin ofuscar (para depurar un fallo de un cliente)
   =========================================================================== */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const PRO = path.resolve(__dirname, '..');
const SALIDA = path.resolve(PRO, '..', 'Ghosted-Landing', 'api', '_private');
const CLARO = process.argv.includes('--claro');

const version = JSON.parse(fs.readFileSync(path.join(PRO, 'manifest.json'), 'utf8')).version;

/* Fuera del paquete: desarrollo, no producto. */
const FUERA_DIR = new Set(['test', 'tools', 'node_modules', '.git']);
const FUERA = new Set(['package.json', 'package-lock.json']);

/* Estos NO se ofuscan.
   page-api.js corre en el mundo de la pagina de Instagram y toca sus modulos
   internos; el renombrado agresivo lo ha roto antes. build.js queda legible a
   proposito: es de dos lineas y ofuscarlo no esconde nada que no se vea. */
const SIN_TOCAR = new Set(['src/page-api.js', 'src/build.js']);

function copiar(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function recorrer(dir, base, fn) {
  for (const n of fs.readdirSync(dir)) {
    const abs = path.join(dir, n);
    const rel = path.relative(base, abs).split(path.sep).join('/');
    if (fs.statSync(abs).isDirectory()) {
      if (FUERA_DIR.has(n)) continue;
      recorrer(abs, base, fn);
      continue;
    }
    if (FUERA.has(rel) || n.startsWith('.')) continue;
    fn(abs, rel);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghoosted-pro-'));
let js = 0, otros = 0, ofuscados = 0;

recorrer(PRO, PRO, (abs, rel) => {
  const dst = path.join(tmp, rel);
  if (rel.endsWith('.js') && !SIN_TOCAR.has(rel)) js++; else otros++;
  copiar(abs, dst);
});

if (!CLARO) {
  const objetivo = [];
  recorrer(tmp, tmp, (abs, rel) => {
    if (rel.endsWith('.js') && !SIN_TOCAR.has(rel)) objetivo.push(abs);
  });
  /* UN PREFIJO DISTINTO POR FICHERO. No es cosmetica: es lo que mantiene vivo
     el paquete.
     El ofuscador se llama una vez por fichero, cada llamada sin saber nada de
     las demas, y con --string-array emite DOS funciones globales (la tabla de
     cadenas y su descodificador). Con nombres deterministas salen IGUALES en
     todos: a0a y a0b. Pero los ocho content scripts de una extension comparten
     UN SOLO ambito, asi que el ultimo en cargarse machacaba a los anteriores:
     la tabla de mobile.js pisaba la de storage.js y la de ig-api.js, y la de
     content.js pisaba la de i18n.js. Resultado: ig-api.js leia cadenas de
     otro fichero y getUserId() dejaba de encontrar la cookie de sesion. Sin
     sesion no se montaba nada — ni fantasma, ni panel, ni forma de activar.
     El paquete de Pro llevaba muerto desde que se ofusca, y no se veia porque
     Plus no se ofusca y el fuente tampoco: solo estaba roto lo que se vendia.
     `node --check` no lo puede ver: cada fichero por separado es correcto. */
  let ghSufijo = 0;
  for (const f of objetivo) {
    execFileSync('npx', ['--yes', 'javascript-obfuscator@5.7.0', f, '--output', f,
      '--identifiers-prefix', 'gh' + (ghSufijo++) + '_',
      // Conservador a proposito. Las opciones agresivas (control flow
      // flattening, dead code) multiplican el tamano y han roto extensiones
      // reales; lo que interesa aqui es que no se lea de un vistazo.
      '--compact', 'true',
      '--identifier-names-generator', 'mangled',
      '--string-array', 'true',
      '--string-array-threshold', '0.75',
      '--string-array-encoding', 'base64',
      '--self-defending', 'false',
      '--control-flow-flattening', 'false',
      '--dead-code-injection', 'false',
    ], { stdio: 'pipe' });
    ofuscados++;
  }
}

/* Comprobacion antes de empaquetar: si algo no compila, no sale de aqui. */
const malos = [];
recorrer(tmp, tmp, (abs, rel) => {
  if (!rel.endsWith('.js')) return;
  try { execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' }); }
  catch (e) { malos.push(rel); }
});
if (malos.length) {
  console.error('\n\x1b[31mLa ofuscacion ha roto ' + malos.length + ' fichero(s):\x1b[0m');
  malos.forEach((m) => console.error('  ' + m));
  process.exit(1);
}

/* Y que el paquete ARRANQUE. `node --check` de ahi arriba solo mira sintaxis,
   fichero a fichero: los ocho ficheros del paquete que dejo a los clientes sin
   nada durante semanas pasaban esa comprobacion. Esto los carga en un solo
   ambito, como Chrome, y comprueba que leen la cookie de sesion. */
let prueba = { ok: false, motivos: ['no se ha podido ejecutar la prueba de humo'] };
try {
  /* En un proceso aparte a proposito: un paquete roto lanza de forma
     asincrona y con temporizadores vivos, y eso contaminaria al empaquetador. */
  execFileSync(process.execPath, [path.join(__dirname, 'humo.js'), tmp], { stdio: 'pipe' });
  prueba = { ok: true, motivos: [] };
} catch (e) {
  try { prueba = JSON.parse(String(e.stdout || '')) || prueba; } catch (x) { /* se queda el generico */ }
}
if (!prueba.ok) {
  console.error('\n\x1b[31mEl paquete no arranca:\x1b[0m');
  prueba.motivos.forEach((m) => console.error('  ' + m));
  console.error('\n  No se empaqueta. Un zip que no arranca es peor que no tener zip.\n');
  process.exit(1);
}

/* Y que el manifiesto siga apuntando a todo lo que dice. */
const man = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
const declarados = [
  ...(man.content_scripts || []).flatMap((c) => [...(c.js || []), ...(c.css || [])]),
  (man.background || {}).service_worker,
  ...Object.values(man.icons || {}),
].filter(Boolean);
const faltan = declarados.filter((f) => !fs.existsSync(path.join(tmp, f)));
if (faltan.length) {
  console.error('\n\x1b[31mFaltan ficheros que el manifiesto declara:\x1b[0m', faltan);
  process.exit(1);
}

fs.mkdirSync(SALIDA, { recursive: true });
const zip = path.join(SALIDA, `Ghoosted-Pro-v${version}${CLARO ? '-claro' : ''}.zip`);
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-qr', zip, '.'], { cwd: tmp });
fs.rmSync(tmp, { recursive: true, force: true });

const kb = Math.round(fs.statSync(zip).size / 1024);
console.log(`\n  Ghoosted Pro v${version}${CLARO ? ' (sin ofuscar)' : ''}`);
console.log(`  ${js} ficheros js · ${ofuscados} ofuscados · ${otros} recursos`);
console.log(`  ${path.relative(process.cwd(), zip)} · ${kb} KB\n`);

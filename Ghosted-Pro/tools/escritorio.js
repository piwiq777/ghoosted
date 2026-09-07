/* ===========================================================================
   Copia las tres carpetas al escritorio, con la fecha de hoy en el nombre.
   Uso:  node tools/escritorio.js

   La copia de Pro y de Plus sale con la PUERTA ABIERTA (FREE_MODE: true), a
   proposito: es la copia con la que se trabaja, y con la puerta cerrada haria
   falta una clave activada para abrir el panel. Lo que se vende NO sale de
   aqui — sale de tools/empaquetar-pro.js y tools/construir-plus.js, que leen
   src/build.js tal cual esta, o sea cerrado.

   Se excluye lo que no debe salir del repositorio: .git, node_modules, las
   claves (.env*), la carpeta de Vercel y los zip del producto.
   =========================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PRO = path.resolve(__dirname, '..');
const RAIZ = path.resolve(PRO, '..');
const ESCRITORIO = path.join(require('os').homedir(), 'Escritorio');

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const hoy = new Date();
const fecha = `${hoy.getDate()}-${MESES[hoy.getMonth()]}-${hoy.getFullYear()}`;

const CARPETAS = [
  { origen: 'Ghosted-Pro', prefijo: 'GHOOSTED PRO - version de pago', abrir: true },
  { origen: 'Ghosted-Plus', prefijo: 'GHOOSTED PLUS - version nueva', abrir: true },
  { origen: 'Ghosted-Landing', prefijo: 'GHOOSTED LANDING - web actual', abrir: false },
];

/* El LEEME solo vive en el escritorio: ni se copia ni se borra. */
const SOLO_ALLI = 'LEEME - QUE ES ESTO.txt';
/* Esto NO tiene que estar en una carpeta del escritorio. Las claves de
   Stripe y del almacen viven en .env.local, y una carpeta del escritorio es
   justo lo que se comprime y se manda por ahi sin mirar dentro. Los zip del
   producto tampoco: pesan y siempre son de una version vieja. */
const EXCLUIR = ['.git', 'node_modules', '.env*', '.vercel', 'api/_private'];

if (!fs.existsSync(ESCRITORIO)) {
  console.log(`\nNo encuentro el escritorio en ${ESCRITORIO}\n`);
  process.exit(1);
}

console.log(`\nCopiando al escritorio (${fecha})\n`);

for (const c of CARPETAS) {
  const origen = path.join(RAIZ, c.origen);
  if (!fs.existsSync(origen)) { console.log(`  ${c.origen}: no existe, salto`); continue; }

  /* Si ya hay una copia de otro dia, se reaprovecha y se le cambia la fecha:
     asi no se acumulan carpetas viejas en el escritorio. */
  const anterior = fs.readdirSync(ESCRITORIO).find((n) => n.startsWith(c.prefijo));
  const destino = path.join(ESCRITORIO, `${c.prefijo} ${fecha}`);
  if (anterior && path.join(ESCRITORIO, anterior) !== destino) {
    fs.renameSync(path.join(ESCRITORIO, anterior), destino);
  }
  fs.mkdirSync(destino, { recursive: true });

  /* --delete-excluded ademas BORRA del destino lo excluido, que es como se
     limpia una copia vieja que ya se llevo las claves dentro. */
  const args = ['-a', '--delete', '--delete-excluded', '--filter', 'P ' + SOLO_ALLI, '--exclude', SOLO_ALLI];
  EXCLUIR.forEach((e) => args.push('--exclude', e));
  args.push(origen + '/', destino + '/');
  execFileSync('rsync', args);

  if (c.abrir) {
    const build = path.join(destino, 'src', 'build.js');
    const txt = fs.readFileSync(build, 'utf8').replace('FREE_MODE: false', 'FREE_MODE: true');
    if (!/FREE_MODE: true/.test(txt)) throw new Error(`${c.origen}: no pude abrir la puerta en build.js`);
    fs.writeFileSync(build, txt);
  }

  console.log(`  ${path.basename(destino)}${c.abrir ? '  · puerta abierta, sin clave' : ''}`);
}

console.log('\nEsto es tu copia. Lo que se vende sale cerrado, de empaquetar-pro.js\n');

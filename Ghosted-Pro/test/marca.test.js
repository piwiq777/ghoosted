'use strict';
/* La marca de cada descarga.
 *
 * Lo que hay que garantizar es lo de siempre con los formatos binarios: que el
 * ZIP siga siendo un ZIP. Un fallo aqui no da un error visible — da un archivo
 * que Chrome rechaza DESPUES de que el cliente haya pagado. */
const fs = require('fs');
const path = require('path');
const os = require('node:os');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const { marcar, crc32 } = require(path.join(WEB, 'lib', 'marcar.js'));

module.exports = () => {
  const s = suite('marca de descarga');

  /* Contra un valor conocido: si el CRC esta mal, unzip da "bad CRC" y el
     usuario cree que la descarga vino rota. */
  s.eq('el CRC-32 es el que dice la norma', crc32(Buffer.from('123456789')), 0xCBF43926);

  const zips = fs.readdirSync(path.join(WEB, 'api', '_private')).filter((f) => f.endsWith('.zip'));
  s.ok('hay zips que marcar', zips.length >= 2);

  for (const nombre of zips) {
    const orig = fs.readFileSync(path.join(WEB, 'api', '_private', nombre));
    const key = 'GHST-A1B2-C3D4-E5F6-A7B8-C9D0';
    const out = marcar(orig, { key, plan: 'pro', producto: 'Ghoosted Pro', comprada: '2026-01-01T00:00:00.000Z' });

    s.ok(nombre + ': el marcado crece, no encoge', out.length > orig.length);

    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'marca-')), nombre);
    fs.writeFileSync(tmp, out);

    /* El juez es unzip, no nosotros. */
    let integro = true;
    try { execFileSync('unzip', ['-t', tmp], { stdio: 'pipe' }); } catch (e) { integro = false; }
    s.ok(nombre + ': unzip lo da por bueno', integro);

    const lista = execFileSync('unzip', ['-Z1', tmp], { encoding: 'utf8' }).trim().split('\n');
    const listaOrig = execFileSync('unzip', ['-Z1', path.join(WEB, 'api', '_private', nombre)], { encoding: 'utf8' }).trim().split('\n');
    s.eq(nombre + ': entra un fichero y solo uno', lista.length, listaOrig.length + 1);
    s.ok(nombre + ': y es la licencia', lista.indexOf('LICENCIA.txt') !== -1);
    /* Ni uno de los originales puede desaparecer ni cambiar de nombre. */
    s.eq(nombre + ': los de antes siguen todos', listaOrig.filter((f) => lista.indexOf(f) === -1), []);

    const marca = execFileSync('unzip', ['-p', tmp, 'LICENCIA.txt'], { encoding: 'utf8' });
    s.ok(nombre + ': la marca lleva la clave', marca.indexOf(key) !== -1);
    /* Tambien en el comentario del ZIP, que se lee sin descomprimir. */
    const coment = execFileSync('unzip', ['-z', tmp], { encoding: 'utf8' });
    s.ok(nombre + ': y el comentario del zip tambien', coment.indexOf(key) !== -1);

    /* El manifiesto es lo que Chrome lee primero: si se corrompe, no instala. */
    const man = JSON.parse(execFileSync('unzip', ['-p', tmp, 'manifest.json'], { encoding: 'utf8' }));
    s.ok(nombre + ': el manifiesto sigue leyendose', !!man.manifest_version);

    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }

  /* Dos compradores, dos marcas distintas: si fueran iguales no serviria. */
  const uno = marcar(fs.readFileSync(path.join(WEB, 'api', '_private', zips[0])), { key: 'GHST-1111-1111-1111-1111-1111', plan: 'pro', producto: 'P' });
  const dos = marcar(fs.readFileSync(path.join(WEB, 'api', '_private', zips[0])), { key: 'GHST-2222-2222-2222-2222-2222', plan: 'pro', producto: 'P' });
  s.ok('cada comprador se lleva su marca', !uno.equals(dos));

  /* Si le llega basura, devuelve lo que le dieron en vez de romper la venta. */
  const basura = Buffer.from('esto no es un zip');
  s.ok('con un fichero que no es zip, no revienta', marcar(basura, { key: 'x' }).equals(basura));

  return s;
};

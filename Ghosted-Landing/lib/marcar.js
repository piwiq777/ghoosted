'use strict';
/* Marca cada descarga con la clave de quien la pide.
 *
 * Para que: si mañana aparece el ZIP de Pro colgado en un foro, se sabe de que
 * compra salio y esa clave se revoca desde el panel. No impide copiarlo —nada
 * lo impide, es JavaScript que el navegador tiene que leer— pero convierte una
 * copia anonima en una copia con nombre.
 *
 * Se hace AL VUELO, sobre el ZIP que ya esta en disco: no se guarda una copia
 * por comprador. Se le añade una entrada LICENCIA.txt y un comentario en el
 * propio ZIP, sin tocar ninguno de los 49 ficheros que ya lleva.
 *
 * Sin dependencias: aqui no hay node_modules, solo lo que trae Node. Por eso
 * la entrada va STORED (sin comprimir) — para un texto de 300 bytes no cambia
 * nada y ahorra tener que acertar con el deflate crudo.
 */

/* CRC-32, que el formato ZIP exige por entrada. */
let TABLA = null;
function crc32(buf) {
  if (!TABLA) {
    TABLA = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      TABLA[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* La fecha va en el formato de MS-DOS de 1980, que es lo que guarda el ZIP. */
function fechaDos(d) {
  const hora = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
  const dia = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { hora, dia };
}

function textoLicencia({ key, plan, producto, comprada }) {
  return [
    'Ghoosted — copia con licencia',
    '',
    'Clave:    ' + key,
    'Producto: ' + producto + ' (' + plan + ')',
    'Comprada: ' + (comprada || '—'),
    'Descarga: ' + new Date().toISOString(),
    '',
    'Esta copia esta ligada a la clave de arriba. Compartir el archivo o la',
    'clave permite identificar de que compra salio, y la clave se anula.',
    'La licencia es para una sola cuenta de Instagram.',
    '',
    'https://ghoosted.net',
  ].join('\r\n');
}

/* Devuelve un ZIP nuevo con la entrada añadida. Si algo no cuadra, devuelve el
   original: mejor entregar el producto sin marca que no entregarlo. */
function marcar(zip, datos) {
  try {
    const fin = zip.lastIndexOf(Buffer.from('PK\x05\x06', 'latin1'));
    if (fin < 0 || fin + 22 > zip.length) return zip;
    /* Un ZIP64 lleva otras cabeceras y otros tamaños; no se toca. */
    if (zip.indexOf(Buffer.from('PK\x06\x06', 'latin1')) !== -1) return zip;

    const entradas = zip.readUInt16LE(fin + 10);
    const dirTam = zip.readUInt32LE(fin + 12);
    const dirOff = zip.readUInt32LE(fin + 16);
    if (dirOff + dirTam > zip.length) return zip;

    const nombre = Buffer.from('LICENCIA.txt', 'utf8');
    const cuerpo = Buffer.from(textoLicencia(datos), 'utf8');
    const suma = crc32(cuerpo);
    const { hora, dia } = fechaDos(new Date());

    const local = Buffer.alloc(30 + nombre.length);
    local.write('PK\x03\x04', 0, 'latin1');
    local.writeUInt16LE(20, 4);          // version necesaria
    local.writeUInt16LE(0, 6);           // sin banderas
    local.writeUInt16LE(0, 8);           // metodo 0 = sin comprimir
    local.writeUInt16LE(hora, 10);
    local.writeUInt16LE(dia, 12);
    local.writeUInt32LE(suma, 14);
    local.writeUInt32LE(cuerpo.length, 18);
    local.writeUInt32LE(cuerpo.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);          // sin campo extra
    nombre.copy(local, 30);

    const central = Buffer.alloc(46 + nombre.length);
    central.write('PK\x01\x02', 0, 'latin1');
    central.writeUInt16LE(20, 4);        // version que lo creo
    central.writeUInt16LE(20, 6);        // version necesaria
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(hora, 12);
    central.writeUInt16LE(dia, 14);
    central.writeUInt32LE(suma, 16);
    central.writeUInt32LE(cuerpo.length, 20);
    central.writeUInt32LE(cuerpo.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt16LE(0, 30);        // extra
    central.writeUInt16LE(0, 32);        // comentario
    central.writeUInt16LE(0, 34);        // disco
    central.writeUInt16LE(0, 36);        // atributos internos
    central.writeUInt32LE(0o644 << 16, 38); // permisos, como los del resto
    central.writeUInt32LE(dirOff, 42);   // donde empieza su cabecera local
    nombre.copy(central, 46);

    /* La entrada nueva se cuela justo donde empezaba el directorio, y el
       directorio entero se desplaza ese tanto. */
    const desplazado = local.length + cuerpo.length;
    const comentario = Buffer.from('Ghoosted · ' + datos.key, 'utf8');

    const cola = Buffer.alloc(22 + comentario.length);
    cola.write('PK\x05\x06', 0, 'latin1');
    cola.writeUInt16LE(0, 4);
    cola.writeUInt16LE(0, 6);
    cola.writeUInt16LE(entradas + 1, 8);
    cola.writeUInt16LE(entradas + 1, 10);
    cola.writeUInt32LE(dirTam + central.length, 12);
    cola.writeUInt32LE(dirOff + desplazado, 16);
    cola.writeUInt16LE(comentario.length, 20);
    comentario.copy(cola, 22);

    return Buffer.concat([
      zip.subarray(0, dirOff),           // los 49 ficheros, intactos
      local, cuerpo,                     // el nuevo
      zip.subarray(dirOff, dirOff + dirTam), // el directorio de siempre
      central,                           // mas su entrada
      cola,
    ]);
  } catch (e) {
    console.error('marcar_fallo', e && e.message);
    return zip;
  }
}

module.exports = { marcar, crc32 };

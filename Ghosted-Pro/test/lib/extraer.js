'use strict';
/* Saca una función suelta del código de la extensión para poder probarla
 * aislada. El código va minificado en una sola línea, así que no vale contar
 * llaves a lo bruto: hay literales como N.startsWith('{') que descuadran la
 * cuenta. Este lector va carácter a carácter y se salta lo que hay dentro de
 * comillas, expresiones regulares y comentarios. */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', 'src');

function leer(fichero) {
  return fs.readFileSync(path.join(RAIZ, fichero), 'utf8');
}

// Un '/' abre una expresión regular sólo si lo anterior no es un valor.
const ANTES_DE_REGEX = /[([{,;:=!&|?+\-*%~^<>]$/;

function finDelBloque(src, desde) {
  let i = src.indexOf('{', desde);
  if (i === -1) throw new Error('no hay bloque que leer desde ' + desde);
  let prof = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const cierre = c;
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === cierre) break;
      }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i === -1) i = src.length; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '/') {
      const previo = src.slice(0, i).replace(/\s+$/, '');
      if (ANTES_DE_REGEX.test(previo) || previo === '') {
        for (i++; i < src.length; i++) {
          if (src[i] === '\\') { i++; continue; }
          if (src[i] === '[') { for (i++; i < src.length && src[i] !== ']'; i++) if (src[i] === '\\') i++; continue; }
          if (src[i] === '/') break;
        }
        continue;
      }
    }
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) return i; }
  }
  throw new Error('bloque sin cerrar');
}

/* Devuelve el texto completo de `function nombre(...){...}`. */
function funcion(src, nombre) {
  const re = new RegExp('(?<![A-Za-z0-9_$])(async\\s+)?function\\s+' + nombre + '\\s*\\(');
  const m = re.exec(src);
  if (!m) throw new Error('no encuentro la función ' + nombre);
  return src.slice(m.index, finDelBloque(src, m.index) + 1);
}

/* Igual pero para varias, en el orden pedido. */
function funciones(src, nombres) {
  return nombres.map((n) => funcion(src, n)).join('\n');
}

/* Busca sin mirar los espacios: así una marca escrita como `const a=1` sigue
 * encontrando `const a = 1`. Las pruebas no deben romperse porque se formatee
 * el código. Devuelve la posición en el texto original. */
function buscar(src, marca, desde = 0) {
  const limpio = [], mapa = [];
  for (let i = desde; i < src.length; i++) {
    if (/\s/.test(src[i])) continue;
    limpio.push(src[i]); mapa.push(i);
  }
  const aguja = marca.replace(/\s+/g, '');
  const donde = limpio.join('').indexOf(aguja);
  if (donde === -1) return -1;
  return { inicio: mapa[donde], fin: mapa[donde + aguja.length - 1] + 1 };
}

/* Un trozo entre dos marcas, para bloques que no son una función. */
function tramo(src, desde, hasta) {
  const a = buscar(src, desde);
  if (a === -1) throw new Error('no encuentro el inicio: ' + desde);
  const b = buscar(src, hasta, a.fin);
  if (b === -1) throw new Error('no encuentro el final: ' + hasta);
  return src.slice(a.inicio, b.inicio);
}

/* Evalúa el trozo con las dependencias que le pasemos de mentira. */
function montar(codigo, deps, devuelve) {
  const nombres = Object.keys(deps);
  const cuerpo = codigo + '\n; return (' + devuelve + ');';
  return new Function(...nombres, cuerpo)(...nombres.map((n) => deps[n]));
}

module.exports = { leer, funcion, funciones, tramo, buscar, montar, finDelBloque };

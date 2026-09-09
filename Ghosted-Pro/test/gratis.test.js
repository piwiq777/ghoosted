'use strict';
/* EL ESCALON GRATIS.
 *
 * Antes de esto, sin clave no habia NADA: el panel se montaba, pintaba "activa
 * tu clave" y no analizaba una sola cuenta. Se pedia el dinero antes de que
 * nadie hubiera visto un solo nombre — la forma mas cara de vender algo que se
 * entiende en cuanto lo ves.
 *
 * Ahora se instala, se analiza, y se ven las TRES primeras de cada lista. El
 * gancho no es una promesa: es su propio dato, tapado, con el numero delante.
 *
 * Lo que vigila esto es que el embudo siga entero por los dos lados: que sin
 * clave se vea algo, y que con la version gratis NO se llegue a lo que se
 * paga. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const src = (f) => fs.readFileSync(path.join(PRO, 'src', f), 'utf8');

module.exports = () => {
  const s = suite('el escalon gratis');
  const c = src('content.js');
  const css = src('panel.css');

  /* 1 · el corte */
  s.ok('el corte es de tres', /const GHD_GRATIS = 3;/.test(c));
  s.ok('y solo se aplica sin clave', /function ghdLibre\(\) \{\s*return !v\(\);/.test(c));
  s.ok('con clave no se corta nada',
    /if \(!ghdLibre\(\) \|\| gq\.length <= GHD_GRATIS\) return \{[\s\S]{0,60}faltan: 0/.test(c));

  /* 2 · las tres listas cortan y ponen el candado */
  s.eq('las tres listas ponen su candado', (c.match(/ghdCandado\(g\w+\.faltan\)/g) || []).length, 3);
  s.eq('y las tres cortan antes de pintar', (c.match(/= ghdCorta\(/g) || []).length, 3);
  /* El numero es lo que engancha: tres nombres de verdad y "+34" debajo. */
  s.ok('el candado enseña cuantas faltan', /gz\.textContent = "\+" \+ gq;/.test(c));

  /* 3 · sin clave TAMBIEN se analiza. Si no, no hay nada que enseñar. */
  s.ok('no queda ninguna puerta que corte el panel entero', !/if \(!v\(\)\) \{/.test(c));
  s.ok('la recogida de datos ya no pide licencia',
    !/async function YL\(gq\) \{\s*if \(!v\(\)\)/.test(c));
  s.ok('y la primera comprobacion se programa igual',
    !/\{\s*G\(Y\("unlock_status"\), "alert"\);\s*return;\s*\}/.test(c));

  /* 4 · lo que sigue siendo de pago */
  s.ok('dejar de seguir en lote sigue costando dinero',
    /async function g2\(gq\) \{[\s\S]{0,200}if \(ghdLibre\(\)\) return void ghdAbreLlave\(\);/.test(c));
  s.ok('los espectadores de historias, tambien', /if \(!N\("storyViewers"\)\)/.test(c));

  /* 5 · EL AGUJERO QUE CAZO EL CHROME DE VERDAD.
     El candado solo sale cuando sobran filas. Quien acaba de instalar y de
     pagar no tiene ninguna: se encontraba una lista vacia y ni un sitio donde
     pegar la clave. La barra va SIEMPRE que no hay clave. */
  s.ok('hay una barra de version gratuita', /function ghdBarraGratis\(\)/.test(c));
  s.ok('que se pinta con datos o sin ellos',
    /m\.classList\.remove\("ghd-locked"\);\s*ghdBarraGratis\(\);/.test(c));
  s.ok('y desaparece en cuanto hay clave',
    /if \(!ghdLibre\(\)\) return void \(gv && gv\.remove\(\)\);/.test(c));
  s.ok('con su boton para pegar la clave', /ghd-gratis-btn/.test(c) && /\.ghd-gratis-btn\{/.test(css));

  /* 6 · y salida. Antes la pantalla de la clave era el estado por defecto y no
     habia vuelta: se entraba y ahi te quedabas. */
  s.ok('la pantalla de la clave tiene salida', /ghd-unlock-back/.test(c) && /\.ghd-unlock-back\{/.test(css));
  s.ok('y la salida devuelve la lista y la barra',
    /function ghdCierraLlave\(\) \{\s*m\.classList\.remove\("ghd-locked"\), ghdBarraGratis\(\), g5\(\);/.test(c));

  /* 7 · el boton principal vuelve a servir para comprobar */
  s.ok('el boton solo dice "activar" dentro de la pantalla de la clave',
    /if \(m\.classList\.contains\("ghd-locked"\)\) \{\s*A\.textContent = Y\("unlock_activate"\);/.test(c));

  /* 8 · el estilo existe, o el candado sale sin forma */
  for (const cl of ['.ghd-candado{', '.ghd-candado-n{', '.ghd-candado-btn{', '.ghd-gratis{']) {
    s.ok('estilo ' + cl.slice(0, -1), css.indexOf(cl) !== -1);
  }

  /* 9 · los doce idiomas */
  const CLAVES = ['free_more', 'free_more_d', 'free_back', 'free_bar', 'free_have_key'];
  const loc = path.join(PRO, '_locales');
  const idiomas = fs.readdirSync(loc).filter((l) => fs.existsSync(path.join(loc, l, 'messages.json')));
  s.eq('doce idiomas', idiomas.length, 12);
  for (const l of idiomas) {
    const d = JSON.parse(fs.readFileSync(path.join(loc, l, 'messages.json'), 'utf8'));
    s.eq(l + ': estan los textos del escalon gratis', CLAVES.filter((k) => !d[k] || !d[k].message), []);
  }
  const i18n = src('i18n.js');
  s.eq('y el respaldo en ingles de todas', CLAVES.filter((k) => i18n.indexOf(k + ':') === -1), []);
  /* El texto dice cuantas se ven, y el numero sale de la constante: si un dia
     el corte pasa a cinco y el texto sigue diciendo tres, miente. */
  s.ok('el texto de la barra recibe el numero, no lo lleva escrito',
    /Y\("free_bar", String\(GHD_GRATIS\)\)/.test(c));

  return s;
};

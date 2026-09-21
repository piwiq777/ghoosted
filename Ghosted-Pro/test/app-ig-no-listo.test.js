'use strict';
/* "INSTAGRAM NO CONTESTA" CUANDO SI CONTESTABA.
 *
 * El codigo que carga page-api.js e ig-api.js dentro de la pagina de
 * Instagram iba envuelto asi:
 *
 *     if (!window.__ghdCargado) { window.__ghdCargado = 1;  <-- marca ANTES
 *        ...page-api...  ...ig-api...
 *     }
 *
 * La marca se ponia antes de ejecutar nada. Si esos ficheros reventaban a
 * mitad, la marca se quedaba puesta PARA SIEMPRE y window.GhostedIG no se
 * definia nunca mas en esa pagina. Todas las llamadas contestaban
 * "ig_no_listo", que en la app se lee como "Instagram no contesta", y no
 * habia forma de salir salvo recargar Instagram a mano.
 *
 * Y el guardian de Java solo miraba el puente (que si estaba), asi que nunca
 * volvia a inyectar. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite } = require('./lib/probar');

const APP = path.join(__dirname, '..', '..', 'Ghosted-App');

module.exports = () => {
  const s = suite('la API de Instagram se recupera sola · app');
  const puente = fs.readFileSync(path.join(APP, 'ig', 'puente-ig.js'), 'utf8');
  const java = fs.readFileSync(path.join(APP, 'android', 'app', 'src', 'main', 'java', 'net', 'ghoosted', 'app', 'MainActivity.java'), 'utf8');
  const motor = fs.readFileSync(path.join(APP, 'web', 'motor.js'), 'utf8');

  /* LA RAIZ: la condicion tiene que mirar lo que de verdad hace falta. */
  s.ok('la carga se decide por si existe GhostedIG', /if\(!window\.GhostedIG\)\{/.test(java));
  // Se mira la linea que construye el guion, no los comentarios que la explican.
  const linea = (java.split('\n').find((l) => l.indexOf('scriptsIg = "window.__ghdAppId') !== -1) || '');
  s.ok('  y ya no por una marca puesta de antemano', !!linea && !/__ghdCargado/.test(linea));
  s.ok('el guardian comprueba el puente Y la API',
    /!!\(window\.GhdIGRecibir && window\.GhostedIG\)/.test(java));

  /* Y EL ARREGLO QUE LLEGA SIN CAMBIAR EL APK: el puente se borra a si mismo
     si falta la API, para que la siguiente inyeccion lo recargue todo. */
  const ctx = { window: { __ghdCargado: 1, GhdIGRecibir: function () {}, __ghdPuenteIG: false } };
  vm.createContext(ctx);
  vm.runInContext(puente, ctx);
  s.ok('sin la API, se borra la marca que bloqueaba la recarga', !ctx.window.__ghdCargado);
  s.ok('  se retira el puente, para que el movil vuelva a inyectar', !ctx.window.GhdIGRecibir);
  s.ok('  y no se instala a medias', ctx.window.__ghdPuenteIG === false);

  /* Y mientras se recupera, la app reintenta una vez sola. */
  s.ok('una llamada que pilla la pagina sin API se reintenta',
    /if \(!e \|\| e\.kind !== 'transport'\) throw e;/.test(motor));
  s.ok('  una sola vez, no en bucle',
    (motor.slice(motor.indexOf('async function ig('), motor.indexOf('function espera(')).match(/Puente\.ig\(m, a, p\)/g) || []).length === 2);
  s.ok('  y queda apuntado en el registro', /registrar\('ig no listo'/.test(motor));

  return s;
};

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

  /* LA LLAMADA NO PUEDE SALIR ANTES DE QUE LA PAGINA ESTE.
     Se pedia el dato en el mismo instante en que se mandaba a recargar
     Instagram. La recarga es asincrona, asi que la llamada caia en una
     pagina a medio cargar y se perdia: o contestaba "ig_no_listo", o no
     contestaba nadie y el usuario se comia un planton de cuatro minutos. */
  s.ok('hay cola para lo que llega antes de tiempo', /private final java\.util\.ArrayList<String> igCola/.test(java));
  s.ok('  y se sabe cuando la pagina esta lista', /private boolean igListo/.test(java));
  s.ok('  se marca al empezar y al terminar de cargar',
    /igFallo = false; igListo = false;/.test(java) && /igListo = true;\s*\n\s*soltarCola\(\);/.test(java));
  s.ok('  sin pagina de Instagram, se encola y se carga', /igCola\.add\(mensaje\);\s*\n\s*igFallo = false;/.test(java));
  s.ok('  y se suelta todo junto al acabar', /private void soltarCola/.test(java));
  s.ok('la llamada va DENTRO del callback, no en paralelo',
    /if \(!"true"\.equals\(v\)\) \{\s*\n\s*inyectar\(\);/.test(java));
  s.ok('  y se le da un respiro a la inyeccion', /postDelayed\(\(\) -> ig\.evaluateJavascript\(llamada, null\), 250\)/.test(java));

  /* Y que el aviso diga CUAL de los dos es: diagnosticar a ciegas costo
     varias vueltas. */
  const app = fs.readFileSync(path.join(APP, 'web', 'app.js'), 'utf8');
  s.ok('el aviso distingue transport de network',
    /k === 'transport'\) return 'La página de Instagram no estaba lista/.test(app)
    && /k === 'network'\) return 'Instagram no contesta · network/.test(app));

  /* EL FRENO PROPIO SE DISFRAZABA DE FALLO DE INSTAGRAM.
     page-api rechaza cuando se pasa del tope (tope_min/hora/dia), pero
     ig-api etiquetaba TODO rechazo como "network". Y J() reintenta por el
     otro camino cuando ve "network": en la extension iba al fondo — o sea
     que el freno se saltaba —, y en la app, que no tiene fondo, salia
     "sin_fondo" y se le enseñaba al usuario como "Instagram no contesta".
     Horas buscando un fallo de red que no existia. */
  const igApi = fs.readFileSync(path.join(APP, '..', 'Ghosted-Pro', 'src', 'ig-api.js'), 'utf8');
  s.ok('el freno lleva su propia etiqueta',
    /indexOf\("tope_"\) === 0 \? "tope" : "network"/.test(igApi));
  s.ok('  asi no se reintenta por el otro camino (saltarselo es lo contrario de frenar)',
    /N\.kind !== "network" && N\.kind !== "transport"\) throw N;/.test(igApi));
  s.ok('y el aviso dice que somos nosotros, no Instagram',
    /Me he frenado solo: hoy ya he pedido mucho/.test(app)
    && /Me he frenado solo: demasiadas peticiones esta hora/.test(app));
  s.ok('el diagnostico enseña cuanto se ha pedido ya',
    /function lineaGasto/.test(app) && /Pedido a Instagram/.test(app));
  s.ok('  y se pide al abrirlo, no solo desde Ajustes',
    /'diag': function \(\) \{[\s\S]{0,260}P\.ig\('gasto'/.test(app));

  return s;
};

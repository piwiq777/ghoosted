'use strict';
/* La ventana del icono es donde el comprador mete su clave. Si esta pantalla
 * falla, quien ha pagado no puede entrar — y el fallo no se ve, porque con la
 * puerta abierta (FREE_MODE) la ventana se pinta igual de bien.
 *
 * Iba ofuscada en el fuente y con FREE_MODE escrito a mano dentro, asi que
 * cerrar la puerta en build.js no la cerraba aqui: seguia diciendo "Pro" y
 * escondiendo el campo de la clave. Esto lo ata. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const RAIZ = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(RAIZ, 'popup', 'popup.js'), 'utf8');
const html = fs.readFileSync(path.join(RAIZ, 'popup', 'popup.html'), 'utf8');

module.exports = () => {
  const s = suite('ventana del icono');

  /* Una sola fuente para la bandera: si vuelve a escribirse aqui dentro, se
     desincroniza con build.js sin que nadie se entere. */
  s.ok('lee la bandera de build.js', /globalThis\.GhostedBuild/.test(js));
  s.ok('no escribe FREE_MODE a mano', !/FREE_MODE\s*=\s*(!!\[\]|true|false)/.test(js));
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  s.eq('build.js se carga antes que popup.js', scripts, ['../src/build.js', 'popup.js']);

  /* Plus viaja tal cual a la Chrome Web Store, y alli el codigo ilegible es
     motivo de rechazo. Pro se ofusca al empaquetar, no en el fuente. */
  s.ok('no esta ofuscada', !/!!\[\]|\['[a-zA-Z]+'\]\(/.test(js));
  s.ok('sin cadenas en hexadecimal', !/\\x[0-9a-f]{2}/.test(js));

  /* El campo tiene que enseñar la forma de clave que de verdad se entrega. */
  s.ok('el hueco de la clave tiene la forma real', /placeholder="GHST-XXXX-XXXX-XXXX-XXXX-XXXX"/.test(html));

  /* Un texto que no existe sale como el nombre de la clave, en crudo. */
  const en = JSON.parse(fs.readFileSync(path.join(RAIZ, '_locales', 'en', 'messages.json'), 'utf8'));
  const usadas = [...new Set([...js.matchAll(/\bt\('([a-z0-9_]+)'\)/g)].map((m) => m[1]))];
  const marcadas = [...new Set([...html.matchAll(/data-i18n="([a-z0-9_]+)"/g)].map((m) => m[1]))];
  s.ok('usa textos traducidos', usadas.length > 5);
  s.eq('ningun texto de la ventana sin traducir',
    [...usadas, ...marcadas].filter((k) => !(k in en)), []);

  /* NUNCA el nombre de la clave en pantalla. Al cargar la extension
     descomprimida el navegador no la actualiza sola, asi que es normal que
     popup.js sea mas nuevo que los textos instalados — y ahi es donde salia
     "popup_buy_pro" escrito en un boton rosa, en una captura del tutorial. */
  s.ok('el respaldo no es el nombre de la clave', !/getMessage\(clave\) \|\| clave/.test(js));
  s.ok('t() acepta un texto de respaldo', /const t = \(clave, respaldo\)/.test(js));
  s.ok('los data-i18n caen en el texto del HTML', /t\(el\.getAttribute\('data-i18n'\), el\.textContent\)/.test(js));
  /* El respaldo se escribe aqui porque este boton no tiene texto en el HTML:
     lo pone el script, y sin respaldo se quedaria en blanco. El precio va en
     lib/precios.js, y precios.test.js vigila que nada lo contradiga. */
  s.ok('el boton de comprar lleva su propio respaldo', /'Get Ghoosted Pro · €5'/.test(js));

  /* El precio no es el mismo en las dos versiones. */
  s.ok('el boton de comprar distingue Pro de Plus',
    /popup_buy_plus/.test(js) && /popup_buy_pro/.test(js));
  /* Los importes no se escriben aqui: salen de lib/precios.js, que es la
     unica fuente, y precios.test.js comprueba que ningun fichero la
     contradiga. Aqui solo importa que sean DISTINTOS y que ninguno vaya
     vacio: si los dos dijeran lo mismo, media tienda estaria mal y nadie se
     enteraria. */
  const { PRECIOS, digitos } = require(path.resolve(RAIZ, '..', 'Ghosted-Landing', 'lib', 'precios.js'));
  s.ok('el boton de Pro lleva el precio de Pro', en.popup_buy_pro.message.indexOf(digitos(PRECIOS.pro)) !== -1);
  s.ok('el de Plus, el de Plus', en.popup_buy_plus.message.indexOf(digitos(PRECIOS.plus)) !== -1);
  s.ok('y no son el mismo', en.popup_buy_pro.message !== en.popup_buy_plus.message);

  return s;
};

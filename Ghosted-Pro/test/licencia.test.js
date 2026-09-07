'use strict';
/* El interruptor de lanzamiento. Con FREE_MODE en true la extension esta
 * abierta para cualquiera: la clave se cobra, se envia y no abre nada, porque
 * no habia nada cerrado. Y el fallo no se ve probando — todo funciona, que es
 * justo el problema.
 *
 * Se comprueba en el fuente Y en Plus, porque Plus se genera aparte y podria
 * quedarse atras. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const PLUS = path.resolve(PRO, '..', 'Ghosted-Plus');

const bandera = (fichero, nombre) => {
  const m = fs.readFileSync(fichero, 'utf8').match(new RegExp(nombre + ":\\s*([^,\\n]+)"));
  return m ? m[1].trim().replace(/'/g, '') : null;
};

module.exports = () => {
  const s = suite('licencia · el interruptor');

  s.eq('lo que se vende va cerrado', bandera(path.join(PRO, 'src', 'build.js'), 'FREE_MODE'), 'false');
  s.eq('Pro se declara como pro', bandera(path.join(PRO, 'src', 'build.js'), 'PRODUCT'), 'pro');

  if (fs.existsSync(PLUS)) {
    s.eq('Plus tambien va cerrado', bandera(path.join(PLUS, 'src', 'build.js'), 'FREE_MODE'), 'false');
    /* Si Plus se declarara 'pro', el servidor rechazaria las claves de Plus
       (wrongProduct) y el comprador se quedaria fuera con la clave buena. */
    s.eq('Plus se declara como plus', bandera(path.join(PLUS, 'src', 'build.js'), 'PRODUCT'), 'plus');
  }

  /* La puerta se lee de build.js en todos los sitios donde se decide. Si
     alguno vuelve a escribirla a mano, se desincroniza en silencio. */
  for (const rel of ['src/license.js', 'popup/popup.js']) {
    const txt = fs.readFileSync(path.join(PRO, rel), 'utf8');
    s.ok(`${rel} lee la bandera de build.js`, /GhostedBuild/.test(txt));
  }

  /* Con la puerta cerrada y sin clave hay que poder meterla: en la ventana del
     icono y dentro del propio panel. */
  s.ok('el panel tiene donde meter la clave', /ghd-unlock-input/.test(fs.readFileSync(path.join(PRO, 'src', 'content.js'), 'utf8')));
  s.ok('la ventana tiene donde meter la clave', /id="key"/.test(fs.readFileSync(path.join(PRO, 'popup', 'popup.html'), 'utf8')));

  return s;
};

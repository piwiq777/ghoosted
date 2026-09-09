'use strict';
/* Recuperar la clave, y que repartirla no sirva de nada.
 *
 * Los dos casos que hay que cubrir: al comprador se le va la luz antes de
 * copiar la clave, y el comprador la reparte entre sus amigos. El primero se
 * arregla dejandole pedirla otra vez; el segundo ya esta resuelto por el
 * enganche a una sola cuenta de Instagram, y aqui se comprueba que sigue
 * estandolo, porque es lo que sostiene el negocio. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

module.exports = () => {
  const s = suite('recuperar la clave · y no repartirla');

  const recover = leer('api/license/recover.js');
  const licencias = leer('lib/licenses.js');
  const descarga = leer('api/download.js');
  const pagina = leer('recuperar.html');

  /* Si la respuesta cambiara segun exista o no la compra, esta pagina seria
     una forma de averiguar quien es cliente probando correos. */
  s.eq('responde lo mismo haya compra o no',
    (recover.match(/json\(res, 200, \{ ok: true \}\)/g) || []).length >= 3, true);
  s.ok('la clave no se devuelve en la respuesta', recover.indexOf('key:') === -1);
  s.ok('la clave tampoco se pinta en la pagina', pagina.indexOf('GHST-') === -1);

  /* Sin freno, esto sirve para inundar el buzon de cualquiera. */
  s.ok('freno por IP', /frenar\(req, 'recuperar'/.test(recover));
  s.ok('freno tambien por correo', /recuperar-email/.test(recover));

  /* El indice para buscar por correo no guarda el correo en claro. */
  s.ok('el indice de correos va por hash', /createHash\('sha256'\)/.test(licencias));
  s.ok('solo devuelve licencias activas', /status === 'active'/.test(licencias));

  /* El nucleo del asunto: una clave abre UNA cuenta de Instagram. */
  s.ok('la clave se engancha a una sola cuenta', /bindingKey\(found\.key\), account, 'NX'/.test(licencias));
  s.ok('otra cuenta con la misma clave es rechazada', /error: 'bound'/.test(licencias));
  s.ok('y el intento queda apuntado', /apuntarIntento\(found\.key, account\)/.test(licencias));
  s.ok('apuntarlo no puede tumbar la activacion',
    /try \{ await apuntarIntento[\s\S]{0,60}catch/.test(licencias));

  /* El enlace de descarga si sirve a cualquiera que lo tenga, asi que se
     limita: una clave no puede acabar de espejo publico del ZIP de pago. */
  s.ok('hay tope de descargas por clave', /freno:descargas/.test(descarga));
  s.ok('el tope se reinicia cada dia', /'86400'/.test(descarga));
  s.ok('si el almacen falla, se deja descargar', /catch \(e\) \{ \/\* si el almacen no responde/.test(descarga));

  /* Reenviar a peticion del comprador tiene que saltarse el "ya enviado". */
  s.ok('la reentrega se puede forzar', /entregar\(ficha, \{ forzar: true \}\)/.test(recover));
  s.ok('y sin forzar no se repite', /if \(!forzar && record\.sent && record\.sent\.at\)/.test(leer('lib/entrega.js')));

  /* La pagina de gracias tiene que dejar guardarla, no solo copiarla. */
  const gracias = leer('success.html');
  s.ok('se puede guardar la clave como fichero', /ghoosted-clave\.txt/.test(gracias));
  s.ok('y se dice donde recuperarla', /\/recuperar/.test(gracias));

  /* Y antes de pagar hay que saber que la clave se ata a una cuenta. */
  const es = JSON.parse(leer('locales/es.json'));
  /* Vivia en el bloque de tres columnas de despues del precio, que se quito.
     Ahora es una clausula del pie que va debajo de los botones de compra —
     mejor sitio, en realidad: es donde se decide. */
  s.ok('la web lo avisa antes de comprar', /una clave, una cuenta/i.test(es.price_foot));

  return s;
};

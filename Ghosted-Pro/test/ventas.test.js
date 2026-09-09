'use strict';
/* El panel de ventas.
 *
 * Detras hay correos de clientes y un boton que anula claves ya pagadas. Lo
 * que se comprueba aqui es la puerta, no la tabla: que sin token no exista,
 * que el token no se compare de forma que se pueda adivinar, y que ninguna
 * accion destructiva se pueda disparar sin pasar por ella. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

module.exports = () => {
  const s = suite('panel de ventas');

  const admin = leer('lib/admin.js');
  /* Los dos endpoints del panel se juntaron en uno: Vercel crea una funcion
     por fichero bajo api/ y el plan gratuito corta en doce. Al añadir el
     programa de creadores pasamos a trece y el despliegue dejo de subir, sin
     error visible. Este era el par que menos dolia juntar. */
  const lista = leer('api/admin.js');
  const accion = lista;
  const pagina = leer('admin.html');

  /* Sin token puesto, el panel no existe. Es mejor que quede inaccesible por
     olvido que abierto por olvido. */
  for (const [nombre, txt] of [['licencias', lista], ['accion', accion]]) {
    s.ok(nombre + ': sin token configurado responde 404',
      /if \(!configurado\(\)\) return json\(res, 404/.test(txt));
    s.ok(nombre + ': comprueba el token', /if \(!autorizado\(req\)\)/.test(txt));
    s.ok(nombre + ': tiene freno', /frenar\(req, 'admin'/.test(txt));
  }

  /* Comparar con === filtra por cuanto tarda en fallar, y con eso se adivina
     el token letra a letra. */
  s.ok('el token se compara en tiempo constante', /timingSafeEqual/.test(admin));
  s.ok('un token corto no vale', /length >= 24/.test(admin));
  /* En la URL acabaria en los registros del servidor y en el Referer. */
  s.ok('el token viaja en la cabecera', /headers.*authorization/i.test(admin));
  s.ok('la pagina lo manda como Bearer', /Authorization: 'Bearer '/.test(pagina));
  s.ok('y no lo pone en la URL', !/token=/.test(pagina));

  /* KEYS bloquea el almacen mientras dura; con miles de fichas se nota. */
  s.ok('recorre con SCAN, no con KEYS', /'SCAN'/.test(admin) && !/'KEYS'/.test(admin));

  /* Solo estas cuatro cosas, y solo sobre una clave bien formada. */
  s.ok('la lista de acciones es cerrada', /const ACCIONES = new Set\(/.test(accion));
  s.ok('valida el formato de la clave', /GHST-\(\?:\[A-Z0-9\]\{4\}-\)\{4\}/.test(accion));
  for (const a of ['revocar', 'reactivar', 'soltar', 'reenviar']) {
    s.ok('sabe ' + a, accion.indexOf("'" + a + "'") !== -1);
  }
  /* Soltar borra el enganche, NO la licencia. */
  s.ok('soltar solo quita el enganche', /'DEL', 'ghosted:binding:'/.test(accion));
  s.ok('y deja constancia de cuantas veces', /releases/.test(accion));

  /* Un buscador no tiene nada que hacer aqui. */
  s.ok('la pagina va sin indexar', /noindex/.test(pagina));
  s.ok('y robots.txt tambien lo dice', /Disallow: \/admin/.test(leer('robots.txt')));

  return s;
};

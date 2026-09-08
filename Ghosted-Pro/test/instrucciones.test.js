'use strict';
/* Que quien compra sepa que hacer con lo que acaba de pagar.
 *
 * Con la puerta cerrada esto dejo de ser un detalle: quien instala y no sabe
 * que hay que pegar una clave ve una extension que no hace nada, y pide la
 * devolucion. Son cuatro vias y las cuatro tienen que llevar a lo mismo. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const WEB = path.resolve(PRO, '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

module.exports = () => {
  const s = suite('instrucciones al comprador');

  /* 1 · La pantalla de gracias: los pasos y el enlace a la guia entera. */
  const gracias = leer('success.html');
  for (const k of ['sx_step1', 'sx_step2', 'sx_step3', 'sx_step4']) {
    s.ok('la pantalla de gracias trae ' + k, gracias.indexOf(k) !== -1);
  }
  s.ok('y enlaza a la guia con capturas', /href="\/instalar"/.test(gracias));
  /* Como boton, no como nota al pie de 12px: quien nunca ha cargado una
     extension descomprimida necesita el tutorial, no un enlace enterrado. */
  s.ok('la guia es un boton, no una nota', /id="guiaLink" class="dl-btn/.test(gracias));
  /* Y se abre sola al descargar, que es el momento en que acaba de bajarse un
     .zip y no sabe que hacer con el. Dentro del gesto del clic, o el navegador
     lo bloquea. */
  s.ok('la guia se abre al pulsar descargar',
    /dlBtn\.addEventListener\('click'[\s\S]{0,200}window\.open\('\/instalar'/.test(gracias));

  /* 2 · El correo: pasos y enlace. */
  const correo = leer('lib/correo.js');
  s.ok('el correo trae los pasos', /s1:/.test(correo) && /s3:/.test(correo));
  s.ok('el correo enlaza a la guia', /\/instalar/.test(correo));
  s.ok('y dice donde recuperar la clave', /\/recuperar/.test(correo));

  /* 3 · Dentro del ZIP, que es lo unico que le queda a quien perdio el correo
         y cerro la pestaña. LOS DOS planes: Plus se quedaba sin el. */
  const zips = fs.readdirSync(path.join(WEB, 'api', '_private')).filter((f) => f.endsWith('.zip'));
  s.eq('estan los dos paquetes', zips.length, 2);
  for (const z of zips) {
    const lista = execFileSync('unzip', ['-Z1', path.join(WEB, 'api', '_private', z)], { encoding: 'utf8' });
    s.ok(z + ': lleva las instrucciones dentro', lista.indexOf('LEEME-instalar.txt') !== -1);
  }

  /* 4 · Y que esas instrucciones digan lo que ahora hace falta de verdad. */
  const leeme = fs.readFileSync(path.join(PRO, 'LEEME-instalar.txt'), 'utf8');
  s.ok('avisa de que el .zip hay que descomprimirlo', /descomprim/i.test(leeme));
  s.ok('dice que no se borre la carpeta', /no la vayas a borrar|desaparece/i.test(leeme));
  s.ok('explica el modo de desarrollador', /desarrollador/i.test(leeme));
  /* Lo que faltaba: sin clave la extension no hace nada, y no se decia. */
  s.ok('dice que hay que activar la clave', /ACTIVA TU CLAVE/.test(leeme));
  s.ok('y donde encontrarla', /GHST-/.test(leeme) && /LICENCIA\.txt/.test(leeme));
  s.ok('y como recuperarla si se pierde', /\/recuperar/.test(leeme));
  s.ok('manda a soporte, no al desarrollador', /hello@ghoosted\.net/.test(leeme));
  s.ok('con el nombre bien escrito', /GHOOSTED/.test(leeme) && !/^GHOSTED /m.test(leeme));

  /* 5 · La guia web, en los 12 idiomas y con sus capturas. */
  const guia = leer('instalar.html');
  s.eq('la guia esta en 12 idiomas', (guia.match(/<article class="legal lang-/g) || []).length, 12);
  s.eq('y con capturas en los cinco pasos', (guia.match(/assets\/guia\/paso\d\.jpg/g) || []).length, 60);

  /* Quien llega a /success sin compra —favoritos, un enlace viejo, el
     session_id perdido— se encontraba "Pago recibido" de titulo, que es
     mentira, un "vuelve a la pagina" sin enlace y una pista sobre una clave
     que no existe. Sin una sola salida. */
  s.ok('sin compra, el titulo deja de decir que se pago', /sx_h1_lost/.test(gracias));
  s.ok('y explica por que no hay nada', /sx_notfound2/.test(gracias));
  s.ok('con salida a recuperar la clave', /href="\/recuperar"/.test(gracias));
  s.ok('y a los precios', /href="\/#pricing"/.test(gracias));
  s.ok('la pista de la clave se esconde si no hay clave', /genericHint\.hidden = true/.test(gracias));
  /* Y si el sondeo se rinde tras cuatro minutos, tampoco se deja colgado. */
  /* Dos sitios abren las salidas: el que llega sin session_id, y el sondeo
     cuando se rinde a los cuatro minutos. Contarlas es mas robusto que medir
     cuanto codigo hay entre medias. */
  s.eq('las salidas se abren en los dos callejones',
    (gracias.match(/salidas'\)\.hidden = false/g) || []).length, 2);

  return s;
};

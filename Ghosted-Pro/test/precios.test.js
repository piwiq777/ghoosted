'use strict';
/* Lo que la web dice que cuesta.
 *
 * El precio esta escrito a mano en veinticuatro sitios: dos repositorios, doce
 * idiomas y unos cuantos literales de HTML sin traducir. Lo que se COBRA sale
 * de otro lado: un identificador de precio de Stripe en una variable de
 * entorno. Son dos verdades que nadie compara.
 *
 * Cambiar una y olvidarse de la otra da el peor fallo posible de una tienda:
 * anunciar un precio y cobrar otro. Eso es una reclamacion al banco por cada
 * compra y, en la UE, publicidad enganosa.
 *
 * Aqui se vigila la mitad que se puede vigilar sin claves: que NINGUN fichero
 * contradiga lib/precios.js. La otra mitad —lo que Stripe cobra de verdad— la
 * dice /api/status?salud=1, que llama a Stripe y compara. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const WEB = path.resolve(PRO, '..', 'Ghosted-Landing');
const { PRECIOS, digitos } = require(path.join(WEB, 'lib', 'precios.js'));

module.exports = () => {
  const s = suite('el precio, en un solo sitio');

  s.eq('Pro son 5 euros', PRECIOS.pro, 500);
  s.eq('Plus son 3,50', PRECIOS.plus, 350);
  s.eq('los digitos de Pro', digitos(PRECIOS.pro), '5');
  s.eq('los digitos de Plus', digitos(PRECIOS.plus), '3.50');

  /* Cualquier importe en euros que aparezca en un texto de cara al usuario
     tiene que ser uno de los dos. Un 7 olvidado en un idioma es una promesa
     que la pasarela no cumple. */
  const validos = new Set(['5', '3.50', '3,50', '3٫50']);
  const sospechosos = [];
  const mirar = (fichero, texto) => {
    /* Importes con simbolo de euro, en las dos posiciones que usan los doce
       idiomas: "5 €", "€5", "5€". */
    const re = /(?:€\s?([\d]+(?:[.,]\d{2})?)|([\d]+(?:[.,]\d{2})?)\s?€)/g;
    let m;
    while ((m = re.exec(texto))) {
      const v = (m[1] || m[2]).trim();
      if (!validos.has(v)) sospechosos.push(fichero + ' → ' + v);
    }
  };

  /* La web: los doce idiomas y los literales del HTML.
     Los textos del programa de creadores se saltan: su "20 €" es el minimo
     para cobrar una comision, no lo que cuesta nada. */
  for (const f of fs.readdirSync(path.join(WEB, 'locales')).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(WEB, 'locales', f), 'utf8'));
    for (const [k, v] of Object.entries(d)) {
      if (k.indexOf('cr_') === 0) continue;
      mirar('locales/' + f + ' · ' + k, String(v));
    }
  }
  mirar('index.html', fs.readFileSync(path.join(WEB, 'index.html'), 'utf8'));
  /* Y la pagina de creadores tampoco: ahi el euro es una comision. */

  /* La extension: los doce idiomas, el respaldo del popup y el del panel. */
  const loc = path.join(PRO, '_locales');
  for (const l of fs.readdirSync(loc)) {
    const p = path.join(loc, l, 'messages.json');
    if (fs.existsSync(p)) mirar('_locales/' + l, fs.readFileSync(p, 'utf8'));
  }
  mirar('popup/popup.js', fs.readFileSync(path.join(PRO, 'popup', 'popup.js'), 'utf8'));
  mirar('src/i18n.js', fs.readFileSync(path.join(PRO, 'src', 'i18n.js'), 'utf8'));

  s.eq('ningun texto anuncia un precio que no se cobra', sospechosos, []);

  /* Y que exista la unica via de comprobar la otra mitad. */
  const status = fs.readFileSync(path.join(WEB, 'api', 'status.js'), 'utf8');
  s.ok('?salud=1 pregunta a Stripe cuanto cobra de verdad',
    /api\.stripe\.com\/v1\/prices\//.test(status));
  s.ok('y lo compara con lo que dice la web', /coinciden/.test(status) && /PRECIOS\[p\]/.test(status));
  /* Si Stripe no contesta, no puede decir que coincide: eso seria peor que no
     mirarlo, porque da una tranquilidad que nadie ha comprobado. */
  s.ok('sin respuesta de Stripe no se inventa un "coincide"',
    /mira\.some\(\(v\) => v === null\) \? null/.test(status));
  /* El mensaje de error de Stripe trae el id de la cuenta y el final de la
     clave. Esto lo puede pedir cualquiera: sale un codigo corto, no el texto. */
  s.ok('el motivo no repite lo que dice Stripe',
    /error: motivo\(d, r\.status\)/.test(status) && !/d\.error\.message/.test(status));
  s.ok('y hay un codigo para cada arreglo distinto',
    /la_clave_no_puede_leer_precios/.test(status) && /ese_precio_no_existe/.test(status));

  return s;
};

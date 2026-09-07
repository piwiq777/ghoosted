'use strict';
/* Lo que no se puede romper.
 *
 * Cada comprobacion de aqui corresponde a algo que, si se cae, cuesta dinero o
 * datos de clientes: el panel que puede revocar licencias, el webhook que
 * emite claves, y los endpoints abiertos a internet. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

module.exports = () => {
  const s = suite('seguridad');

  /* El correo del comprador lo escribe EL COMPRADOR en Stripe, y el panel lo
     pinta en una tabla. Quien logre ejecutar algo en esa pagina se lleva el
     token y puede revocar todas las licencias. */
  const admin = leer('admin.html');
  s.ok('el panel tiene funcion de escape', /function esc\(v\)/.test(admin));
  const tabla = admin.slice(admin.indexOf('function filtrar'), admin.indexOf("$('tabla').innerHTML"));
  const crudos = [...tabla.matchAll(/\+ (l\.[a-zA-Z.]+|fecha\([^)]*\))/g)]
    .map((m) => m[1]).filter((x) => !/^l\.(estado|abuso|email|telefono|cuenta)$/.test(x));
  s.eq('nada del comprador se pinta sin escapar', crudos, []);
  s.ok('el correo va escapado', /esc\(l\.email\)/.test(admin));
  s.ok('el telefono va escapado', /esc\(l\.telefono\)/.test(admin));
  s.ok('las cuentas del aviso de abuso, tambien', /title="' \+ esc\(/.test(admin));

  /* Un webhook sin firma verificada = cualquiera se emite licencias gratis. */
  const wh = leer('api/stripe-webhook.js');
  s.ok('el webhook comprueba la firma', /createHmac\('sha256'/.test(wh));
  s.ok('y la compara en tiempo constante', /timingSafeEqual/.test(wh));
  s.ok('y rechaza firmas viejas (repeticion)', /> 300/.test(wh));

  /* Endpoints abiertos a internet: todos con freno. El de pedido ademas llama
     a Stripe cuando no encuentra la licencia. */
  for (const [rel, cubo] of [['api/checkout.js', 'pagar'], ['api/license/activate.js', 'activar'],
    ['api/license/verify.js', 'verificar'], ['api/license/recover.js', 'recuperar'],
    ['api/license/order.js', 'pedido'], ['api/admin/licencias.js', 'admin'],
    ['api/admin/accion.js', 'admin']]) {
    s.ok(rel + ': tiene freno', new RegExp("frenar\\(req, '" + cubo + "'").test(leer(rel)));
  }
  /* La descarga se frena por CLAVE, no por IP: el tope es del producto. */
  s.ok('la descarga tiene tope por clave', /freno:descargas/.test(leer('api/download.js')));

  /* El token del panel: nunca en la URL, comparado en tiempo constante. */
  const adminLib = leer('lib/admin.js');
  s.ok('el token se compara en tiempo constante', /timingSafeEqual/.test(adminLib));
  s.ok('el token no viaja en la URL', !/req\.query.*token|token.*req\.query/.test(adminLib));

  /* El espejo del movil pinta nombres de Instagram, que los elige un tercero. */
  const m = leer('m.html');
  s.ok('el espejo escapa lo que pinta', /function esc\(s\)/.test(m));

  /* El puente al mundo de la pagina corre en instagram.com, donde hay mas
     scripts que los nuestros. */
  const puente = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'page-api.js'), 'utf8');
  s.ok('el puente comprueba el origen del mensaje', /event\.source !== window/.test(puente));
  s.ok('y solo deja pasar lo de la lista', /GET_ALLOWED\.test\(url\) : POST_ALLOWED\.test\(url\)/.test(puente));

  /* La cabecera Host la manda el cliente. Si se usa para construir el
     success_url de Stripe, un atacante manda al comprador —despues de pagar de
     verdad— a su propia web CON el session_id en la URL, que es lo unico que
     hace falta para pedir esa clave a /api/license/order. */
  const http = leer('lib/http.js');
  s.ok('el dominio de vuelta no sale de la cabecera Host',
    /PERMITIDOS\.test\(host\)/.test(http));
  const { origin } = require(path.join(WEB, 'lib', 'http.js'));
  const dominio = (h) => origin({ headers: h });
  s.eq('un host inyectado no cuela', dominio({ 'x-forwarded-host': 'malo.com' }), 'https://www.ghoosted.net');
  s.eq('ni un sufijo que se le parezca', dominio({ host: 'ghoosted.net.malo.com' }), 'https://www.ghoosted.net');
  s.eq('ni un host con puerto', dominio({ host: 'www.ghoosted.net:8080' }), 'https://www.ghoosted.net');
  s.eq('el dominio bueno si pasa', dominio({ host: 'www.ghoosted.net' }), 'https://www.ghoosted.net');
  s.eq('y el apex tambien', dominio({ host: 'ghoosted.net' }), 'https://ghoosted.net');

  return s;
};

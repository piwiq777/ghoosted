'use strict';
/* LA CLAVE NO SE PUEDE PERDER SOLA.
 * reverificar() se llama cada vez que llega el estado de la sesion —
 * incluido "desconectado", que es lo PRIMERO que llega al abrir la app y lo
 * que llega al cerrar sesion. Con S.yo a null se preguntaba por la clave sin
 * cuenta, el servidor contestaba {valid:false, error:'account'} (su
 * comprobacion exige un id numerico) y eso se guardaba tal cual: la clave
 * quedaba invalida PARA SIEMPRE. Quien habia pagado volvia a entrar en su
 * cuenta y ya no tenia Pro.
 *
 * Esto es dinero de un cliente, asi que se comprueba sobre el codigo real. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const MOTOR = path.join(__dirname, '..', '..', 'Ghosted-App', 'web', 'motor.js');
const API = path.join(__dirname, '..', '..', 'Ghosted-Landing', 'lib', 'licenses.js');

module.exports = () => {
  const s = suite('la licencia de la app');
  const src = fs.readFileSync(MOTOR, 'utf8');
  const rever = src.slice(src.indexOf('async function reverificar'), src.indexOf('/* ---------------- sesion'));

  s.ok('sin sesion no se pregunta por la clave', /if \(!S\.yo\) return;/.test(rever));
  s.ok('  y esa salida va ANTES de llamar al servidor',
    rever.indexOf('if (!S.yo) return;') < rever.indexOf("LIC_API + 'verify'"));
  s.ok('sin respuesta clara del servidor, se queda como estaba',
    /if \(!j \|\| typeof j\.valid !== 'boolean'\) return;/.test(rever));
  s.ok('un "no" que no habla de la clave no quita el Pro',
    /if \(!j\.valid && !NO_DE_VERDAD\[j\.error\]\) return;/.test(rever));

  /* La lista de motivos tiene que ser EXACTAMENTE la de los "no" del
     servidor que hablan de la clave. Si el servidor añade uno nuevo y aqui
     no esta, el usuario se queda con Pro cuando no le toca; si se mete aqui
     uno que no es de la clave, se lo quitamos a quien ha pagado. */
  const lista = src.slice(src.indexOf('var NO_DE_VERDAD'), src.indexOf('async function reverificar'));
  for (const m of ['invalid', 'revoked', 'bound', 'expired', 'wrong_product']) {
    s.ok('motivo de la clave contemplado: ' + m, new RegExp(m + ': 1').test(lista));
  }
  s.ok('y NO esta el que provoco el fallo (account)', !/account: 1/.test(lista));
  s.ok('ni el de red', !/\bred: 1/.test(lista));

  /* Los motivos tienen que existir en el servidor con ese nombre exacto. */
  const api = fs.readFileSync(API, 'utf8');
  const activate = api.slice(api.indexOf('async function activate'), api.indexOf('async function revokePayment'));
  for (const m of ['invalid', 'revoked', 'bound', 'expired', 'wrong_product', 'account']) {
    s.ok('el servidor contesta ese motivo: ' + m, new RegExp("error: '" + m + "'").test(activate));
  }

  /* Y a quien ya se quedo sin Pro hay que devolverselo: arreglar el fallo no
     borra el false que tiene guardado. */
  const rep = src.slice(src.indexOf('function repararLicencia'), src.indexOf('var guardarT = 0;'));
  s.ok('existe la reparacion', /function repararLicencia/.test(rep));
  s.ok('  y se ejecuta al arrancar', /^\s*repararLicencia\(\);/m.test(src));
  s.ok('  solo toca a quien tiene clave marcada invalida', /l\.valid !== false\) return;/.test(rep));
  s.ok('  y respeta las claves que estan mal de verdad', /NO_DE_VERDAD\[l\.error\]\) return;/.test(rep));
  s.ok('  dejando que la proxima comprobacion con sesion decida', /vts: 0/.test(rep));

  /* Y que el aviso al pegar una clave diga QUE pasa, no siempre lo mismo. */
  const app = fs.readFileSync(path.join(__dirname, '..', '..', 'Ghosted-App', 'web', 'app.js'), 'utf8');
  s.ok('cada motivo tiene su mensaje', /bound: 'Esa clave ya está en uso/.test(app)
    && /wrong_product: 'Esa clave es de Ghoosted Plus/.test(app)
    && /account: 'Entra antes en tu Instagram/.test(app));

  return s;
};

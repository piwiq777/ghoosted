'use strict';
/* NO CREAR SESIONES SIN NECESIDAD.
 * Instagram restringio la cuenta con un motivo muy concreto: "no puedes
 * crear varias sesiones". Eso no lo dispara pedir datos — lo dispara ENTRAR
 * muchas veces. Y cerrar sesion en la app borra las cookies, asi que la
 * siguiente entrada es una sesion de cero. Encadenar varias en un rato es
 * exactamente el patron que Meta marca.
 * Se comprueba que la app cuenta las entradas, avisa antes de sumar otra, y
 * se para sola en cuanto Instagram pone una restriccion. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const APP = path.join(__dirname, '..', '..', 'Ghosted-App', 'web');

module.exports = () => {
  const s = suite('sesiones de Instagram · app');
  const motor = fs.readFileSync(path.join(APP, 'motor.js'), 'utf8');
  const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');

  /* Contar las entradas. */
  s.ok('se apunta cada vez que se entra', /if \(!antes && S\.yo\) \{/.test(motor));
  s.ok('  y se cuentan las de las ultimas 24 h', /function sesionesHoy/.test(motor)
    && /Date\.now\(\) - t < 86400000/.test(motor));
  s.ok('  sin guardarlas para siempre', /7 \* 86400000/.test(motor));

  /* Avisar antes de crear otra. Las dos puertas que cierran sesion tienen
     que pasar por el aviso: si una se escapa, no sirve de nada. */
  s.ok('existe el aviso', /function avisoSesiones/.test(app));
  const cierran = app.match(/P\.nativo\('cerrarSesion'/g) || [];
  s.eq('hay dos sitios que cierran sesion', cierran.length, 2);
  const salir = app.slice(app.indexOf("'salir': function"), app.indexOf("'salir': function") + 260);
  const cambiar = app.slice(app.indexOf("'cambiar': function"), app.indexOf("'cambiar': function") + 700);
  s.ok('  "salir" pasa por el aviso', /avisoSesiones\(/.test(salir));
  s.ok('  "cambiar de cuenta" tambien', /avisoSesiones\(/.test(cambiar));
  s.ok('y el aviso dice el motivo de verdad, no "¿seguro?"',
    /no puedes crear varias sesiones/.test(app) && /no tiene que ver con revisar/i.test(app));

  /* El freno de emergencia: si Instagram pone una restriccion, la app se
     para sola. Insistir despues de eso es lo que convierte un aviso de un
     dia en una cuenta desactivada. */
  const captura = motor.slice(motor.indexOf('} catch (e) {'), motor.indexOf('S.nextCheck = Math.max'));
  s.ok('se para sola ante una restriccion',
    /e\.kind === 'challenge' \|\| e\.kind === 'auth'/.test(captura) && /S\.pausa = true/.test(captura));
  s.ok('  y queda escrito en el registro', /pausa automatica/.test(captura));

  /* Y en pausa no se le pide NADA a Instagram, ni a mano. */
  s.ok('en pausa no se pide nada, ni pulsando el boton',
    /if \(S\.pausa\) \{ avisar\(\{ fin: true, pausada: true \}\); return; \}/.test(motor));

  return s;
};

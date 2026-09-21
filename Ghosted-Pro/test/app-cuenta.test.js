'use strict';
/* LA CUENTA DE GHOOSTED.
 * El plan vive en el servidor, no en el telefono. Esto importa mas de lo que
 * parece: la clave publica de Supabase va DENTRO del APK y cualquiera la
 * saca en dos minutos. Lo que la protege no es que este escondida — es que
 * con ella no se puede hacer nada. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.join(__dirname, '..', '..', 'Ghosted-App', 'web');

module.exports = () => {
  const s = suite('la cuenta de Ghoosted · app');
  const cuenta = fs.readFileSync(path.join(WEB, 'cuenta.js'), 'utf8');
  const app = fs.readFileSync(path.join(WEB, 'app.js'), 'utf8');
  const motor = fs.readFileSync(path.join(WEB, 'motor.js'), 'utf8');
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');

  s.ok('existe el modulo de cuenta', /window\.Cuenta = /.test(cuenta));
  s.ok('  y esta enchufado antes que el motor',
    html.indexOf('cuenta.js') < html.indexOf('motor.js'));
  s.ok('sin libreria: se habla con la API a pelo',
    /fetch\(URL \+ ruta/.test(cuenta) && !/supabase-js/.test(html));

  /* LA CONTRASEÑA NO SE GUARDA. Ni un momento. */
  s.ok('la contraseña no se guarda en el telefono',
    !/clave/.test(cuenta.slice(cuenta.indexOf('function guardarSesion'), cuenta.indexOf('async function registrar'))));
  s.ok('  lo que se guarda son los pases y el plan',
    /S\.token = j\.access_token/.test(cuenta) && /S\.refresco = j\.refresh_token/.test(cuenta));

  /* EL PLAN LO DICE EL SERVIDOR. */
  s.ok('el plan se pregunta al servidor', /rest\/v1\/perfiles\?select=plan/.test(cuenta));
  s.ok('  y el motor lo usa para decidir si eres Pro', /var c = window\.Cuenta;\s*\n\s*if \(c && c\.esPro\(\)\) return true;/.test(motor));
  s.ok('  sin red, se queda el ultimo que se supo', /sin red: se queda como estaba/.test(cuenta));
  s.ok('un plan caducado deja de ser Pro', /function caducado/.test(cuenta)
    && /Date\.now\(\) > Date\.parse\(S\.planHasta\)/.test(cuenta));

  /* QUIEN YA PAGO CON CLAVE NO SE QUEDA FUERA. */
  s.ok('la clave de siempre sigue valiendo', /l\.valid && !l\.refunded && !l\.revoked/.test(motor));

  /* LA SESION SE RENUEVA SOLA: nadie tiene que volver a entrar cada hora. */
  s.ok('el pase se renueva solo', /grant_type=refresh_token/.test(cuenta));
  s.ok('  y si el refresco ya no vale, se cierra la sesion', /la sesion se acabo de verdad/.test(cuenta));

  /* LA PANTALLA. */
  s.ok('la cuenta va ANTES que Instagram',
    /!C\.dentro\(\) \? pantallaCuenta\(\)/.test(app));
  s.ok('entrar y crear cuenta son la misma pantalla', /function pantallaCuenta/.test(app)
    && /\[\['entrar', 'Entrar'\], \['crear', 'Crear cuenta'\]\]/.test(app));
  s.ok('si hay que confirmar el correo, se dice', /Mira tu correo/.test(app));
  s.ok('los avisos estan en castellano, no en ingles',
    /Ese correo o esa contraseña no son/.test(cuenta) && /La contraseña es muy corta/.test(cuenta));
  s.ok('se puede salir de la cuenta desde Ajustes', /'salir-cuenta': function/.test(app));
  s.ok('  y se avisa de que los datos de Instagram se quedan',
    /Tus datos de Instagram se quedan en el móvil/.test(app));
  s.ok('en el navegador no se pide cuenta: es para mirar el diseño',
    /window\.Puente && window\.Puente\.demo/.test(cuenta));

  /* VER LA CONTRASEÑA. En un movil se teclea a ciegas y es donde mas se
     falla; sin poder mirarla, no hay forma de saber por que no entra. */
  const css = fs.readFileSync(path.join(WEB, 'app.css'), 'utf8');
  s.ok('se puede ver la contraseña', /'ver-clave': function/.test(app) && /\.ojo\{/.test(css));
  s.ok('  y el icono cambia segun este visible o no', /U\.verClave \? I\.ojo_no : I\.ojo/.test(app));
  s.ok('  lo escrito no se pierde al enseñarla',
    /if \(ev\.target\.id === 'cClave'\) U\.cClave = ev\.target\.value;/.test(app));
  s.ok('  y se olvida al entrar, no se queda dando vueltas',
    /U\.cClave = ''; U\.verClave = false;/.test(app));

  /* CON EL TECLADO ABIERTO NO CABE NADA, y el navegador aplasta lo que puede:
     el boton se subia hasta pegarse al campo de la contraseña. */
  s.ok('el bloque del medio no se deja aplastar',
    /\.intro-medio\{flex:1 1 auto/.test(css));
  s.ok('  hay aire entre el formulario y el boton', /\.intro-bajo\{[^}]*margin-top:26px/.test(css));
  s.ok('  y con poca altura se deja de centrar y se desplaza',
    /@media \(max-height:620px\)/.test(css) && /\.intro\{overflow-y:auto/.test(css));

  /* LA SALIDA DE EMERGENCIA.
     Poner la cuenta delante de todo dejo el boton de actualizar DETRAS de
     ella. O sea que un fallo en esta pantalla no se podia arreglar
     actualizando, que es como se arregla todo lo demas: la app quedaba
     encerrada. Paso de verdad — el registro se quedo sin correos que mandar
     y no habia forma de salir. */
  s.ok('desde la pantalla de cuenta se puede buscar actualizacion',
    /function salidaEmergencia/.test(app) && /data-a="buscar-act"/.test(app));
  s.ok('  y el aviso de version nueva tambien se ve ahi', /U\.actu/.test(app.slice(app.indexOf('function salidaEmergencia'), app.indexOf('function pantallaCuenta'))));
  s.ok('  esta en las DOS variantes de la pantalla',
    (app.slice(app.indexOf('function pantallaCuenta'), app.indexOf('function sinSesion')).match(/salidaEmergencia\(\)/g) || []).length === 2);

  return s;
};

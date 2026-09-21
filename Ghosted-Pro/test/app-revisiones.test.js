'use strict';
/* CADA CUANTO SE LE PIDE ALGO A INSTAGRAM.
 * Una automatica por la mañana y UNA manual mas pasadas unas horas. Dos al
 * dia como mucho. Antes era una cada 24 h a secas: si te enterabas de algo a
 * mediodia no podias volver a mirar hasta el dia siguiente. Pero tampoco se
 * puede abrir la mano — la cuenta viene de dos restricciones. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.join(__dirname, '..', '..', 'Ghosted-App', 'web');

module.exports = () => {
  const s = suite('cada cuanto se revisa · app');
  const motor = fs.readFileSync(path.join(WEB, 'motor.js'), 'utf8');
  const app = fs.readFileSync(path.join(WEB, 'app.js'), 'utf8');
  const css = fs.readFileSync(path.join(WEB, 'app.css'), 'utf8');

  s.ok('la automatica es por la mañana', /HORA_AUTO = 9/.test(motor));
  s.ok('  y solo una vez al dia', /S\.autoDia !== hoyClave\(Date\.now\(\)\)/.test(motor));
  s.ok('  no salta antes de esa hora', /ahora\.getHours\(\) < HORA_AUTO\) return false/.test(motor));
  s.ok('a mano hay que esperar horas', /ESPERA_MANUAL = 6 \* 3600000/.test(motor));
  s.ok('  y solo queda UNA manual al dia', /manualesHoy\(\) >= 1/.test(motor));
  s.ok('  gastada, se espera a mañana', /m\.setHours\(24, 0, 0, 0\)/.test(motor));
  s.ok('lo gastado se apunta por dia, no para siempre',
    /S\.manualDia === hoy \? \(S\.manuales \|\| 0\) : 0/.test(motor));
  s.ok('si la ultima salio mal se puede reintentar ya',
    /if \(S\.parcial \|\| S\.error\) return 0;/.test(motor));
  s.ok('el boton dice lo que pasa, no se queda mudo',
    /Ya has revisado hoy · mañana más/.test(app) && /Puedes volver en/.test(app));
  s.ok('  y en pausa no se pide nada', /if \(S\.pausa\) \{ avisar/.test(motor));

  /* EL VISOR SE ABRIA DOS VECES.
     El aviso de sesion llega cada segundo y medio SIEMPRE, y se repintaba la
     pantalla entera cada vez. Mientras mirabas una historia, cada repintado
     recreaba el visor por dentro y le relanzaba la animacion de entrada. */
  s.ok('no se repinta si no ha cambiado quien esta dentro',
    /if \(antes !== M\.estado\.yo\) pintar\(\);/.test(app));
  s.ok('la animacion va en la caja que NO se recrea',
    /#visor\{animation:entraVisor/.test(css) && !/#visor \.visor\{animation/.test(css));

  /* Y donde van las fotos, dicho como lo ve el usuario: un album en su
     galeria, no una ruta de carpetas. */
  s.ok('se dice donde queda la foto guardada', /En tu galería, álbum «Ghoosted»/.test(app));

  /* LA LISTA DE HISTORIAS CADUCA.
     Las historias duran 24 h, pero la lista se pedia UNA vez y no se volvia
     a pedir jamas: al rato, todos los circulos de la pantalla apuntaban a
     historias que ya no existen, y al abrir cualquiera salia "no
     disponible". Parecia que la funcion estaba rota. */
  s.ok('la lista se refresca si esta vieja',
    /Date\.now\(\) - \(M\.estado\.tray\.ts \|\| 0\) > 30 \* 60000/.test(app));
  s.ok('  y ya no se pide solo cuando no existe',
    !/U\.tab === 'historias' && !M\.estado\.tray &&/.test(app));
  s.ok('si una historia ya no esta, se rehace la lista sola',
    /Esa historia ya no está\. Actualizando la lista/.test(app)
    && /M\.bandeja\(\)\.then/.test(app));
  s.ok('  y se dice de cuando es la lista', /lista de hace ' \+ hace\(S\.tray\.ts\)/.test(app));

  return s;
};

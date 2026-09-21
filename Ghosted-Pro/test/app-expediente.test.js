'use strict';
/* EL EXPEDIENTE DE UNA PERSONA.
 * Antes, tocar a alguien te SACABA de Ghoosted y abria Instagram: la app no
 * servia para mirar a nadie. Ahora se abre dentro, con todo lo que ya
 * sabemos de esa persona SIN pedir nada, y lo que hay que preguntarle a
 * Instagram va detras de un boton.
 * Esto ultimo importa: la cuenta viene de dos restricciones, y abrir
 * perfiles en cadena es de las cosas que Instagram mira. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const APP = path.join(__dirname, '..', '..', 'Ghosted-App');

module.exports = () => {
  const s = suite('expediente de una persona · app');
  const app = fs.readFileSync(path.join(APP, 'web', 'app.js'), 'utf8');
  const motor = fs.readFileSync(path.join(APP, 'web', 'motor.js'), 'utf8');
  const puente = fs.readFileSync(path.join(APP, 'ig', 'puente-ig.js'), 'utf8');

  /* Tocar a alguien ya no te echa de la app. */
  s.ok('tocar a alguien abre su ficha dentro', /U\.hojaAbierta = 'perfil'/.test(app));
  s.ok('  y la hoja existe', /function hojaPerfil/.test(app) && /perfil: hojaPerfil/.test(app));
  s.ok('  pero se puede ir a Instagram si se quiere', /'abrir-ig': function/.test(app));

  /* Lo que ya sabemos sale SIN pedir nada. Es la mitad del valor y es
     gratis: si te sigue, si le sigues, como se porta con tus historias. */
  s.ok('lo que ya sabemos no cuesta una peticion', /function loQueSe/.test(motor));
  s.ok('  mira seguidores, seguidos, vigilados y lo ocurrido',
    /buscar\(\(S\.followers \|\| \{\}\)\.users\)/.test(motor)
    && /buscar\(\(S\.following \|\| \{\}\)\.users\)/.test(motor)
    && /S\.stories\.viewers/.test(motor));

  /* El expediente, detras de un boton y con freno. */
  s.ok('el expediente va detras de un boton', /data-a="ver-exp"/.test(app));
  s.ok('  y es de Pro', /'ver-exp': function[\s\S]{0,140}abrirPro\('El expediente de una persona'\)/.test(app));
  s.ok('  es UNA sola peticion', /ig\('fetchDossier'/.test(motor));
  s.ok('  permitida en el puente', /fetchDossier: 1/.test(puente));
  s.ok('lo ya pedido se guarda un dia', /Date\.now\(\) - e\.ts < 86400000/.test(motor));
  s.ok('  asi que reabrir a la misma persona no cuesta otra',
    /var ya = expedienteGuardado\(pk\);\s*\n\s*if \(ya\) return ya;/.test(motor));
  s.ok('  y no se guardan para siempre', /2 \* 86400000/.test(motor));
  s.ok('hay tope de expedientes al dia', /EXP_DIA = 15/.test(motor)
    && /expedientesHoy\(\) >= EXP_DIA\) throw/.test(motor));
  s.ok('  y al llegar al tope se explica por que', /Ya has abierto ' \+ M\.EXP_DIA \+ ' expedientes hoy/.test(app));

  /* LAS ACCIONES, como en la extension. Lo de TikTok es para lo que se usa
     de verdad: encuentras a alguien en Instagram y lo siguiente que quieres
     es ver si esta en TikTok. Van DOS, porque el @ no tiene por que ser el
     mismo en las dos redes: una al perfil directo y otra al buscador. */
  s.ok('esta TikTok, al perfil directo', /tiktok\.com\/@' \+ esc\(tt\)/.test(app));
  s.ok('  y buscar en TikTok, por si el @ no coincide', /tiktok\.com\/search\/user\?q=' \+ esc\(tt\)/.test(app));
  s.ok('  con el nombre escapado para la URL', /var tt = encodeURIComponent\(p\.username\)/.test(app));
  s.ok('se puede vigilar desde la ficha', /'vigilar-a': function/.test(app));
  s.ok('se puede copiar el ID', /'copiar-id': function/.test(app));
  s.ok('  y si todavia no se sabe, se dice', /Todavía no sé su ID: abre el expediente/.test(app));
  s.ok('se puede guardar la foto de perfil en HD', /'bajar-foto': function/.test(app)
    && /d\.pic_hd \|\| d\.pic/.test(app));
  s.ok('  y eso es de Pro', /abrirPro\('Descargar la foto de perfil'\)/.test(app));

  /* Y del expediente se enseña TODO lo que esa unica peticion trae: si se
     pide y no se pinta, es gasto tirado. */
  for (const campo of ['pronouns', 'external_url', 'bio_links', 'category', 'public_email', 'public_phone', 'address']) {
    s.ok('se enseña el campo ' + campo, new RegExp('d\\.' + campo).test(app));
  }

  /* PUBLICACIONES Y DESTACADAS, EN EL MISMO BOTON.
     Pedirlas aparte obligaria a pulsar otra vez y esperar otra vez para ver
     media ficha. Son dos peticiones mas, con calma entre una y otra. */
  s.ok('el expediente trae tambien las publicaciones', /ig\('fetchUserPosts'/.test(motor));
  s.ok('  y las destacadas', /ig\('fetchHighlights'/.test(motor) && /fetchHighlights: 1/.test(puente));
  s.ok('  con calma entre peticiones, no de golpe',
    (motor.match(/await espera\(azar\(700, 1400\)\)/g) || []).length >= 2);
  s.ok('  y las destacadas solo si tiene', /if \(d\.has_highlights\)/.test(motor));
  s.ok('a una cuenta privada que no sigues ni se le piden',
    /!d\.is_private \|\| \(S\.following/.test(motor));
  s.ok('  y se dice por que no hay nada', /Es privada y no la sigues/.test(app));
  s.ok('si una de las dos falla, el expediente sale igual',
    (motor.match(/\.catch\(function \(\) \{ return \[\]; \}\)/g) || []).length >= 2);

  /* EL ENGAGEMENT NO CUESTA NADA. Los me gusta y los comentarios vienen
     DENTRO de cada publicacion: calcular la media no es otra peticion. Si
     alguien lo "mejora" pidiendo los likers uno a uno, esto se pone rojo. */
  s.ok('la media sale de las publicaciones ya pedidas',
    /x\.likes \|\| 0/.test(app) && /x\.comments \|\| 0/.test(app));
  s.ok('  sin pedir los likers de cada publicacion',
    !/fetchPostLikers/.test(motor.slice(motor.indexOf('async function expediente'), motor.indexOf('function loQueSe'))));
  s.ok('  y si esconde los me gusta, se dice', /Esconde los me gusta/.test(app));
  s.ok('  la tasa se calcula sobre sus seguidores', /\/ d\.followers \* 100/.test(app));

  s.ok('tocar una publicacion la abre en el visor', /'ver-post': function/.test(app));

  /* LA HOJA APLASTABA LO QUE LLEVA DENTRO.
     Es un flex en columna CON altura maxima, asi que el navegador encogia a
     los hijos para que cupieran: los botones se quedaban en una rayita de
     8 px, las destacadas cortadas por la mitad y las filas de datos
     enseñaban el titulo sin el valor. Cada bloque tiene que mantener su alto
     y dejar que la hoja haga scroll, que para eso lo tiene. */
  const css = fs.readFileSync(path.join(APP, 'web', 'app.css'), 'utf8');
  const noAplastar = css.slice(css.indexOf('.hoja > .pf-cab'), css.indexOf('.hoja > .pf-cab') + 260);
  for (const bloque of ['pf-cab', 'pf-etqs', 'pf-acciones', 'pf-cifras', 'pf-bio', 'pf-datos', 'pf-sec', 'pf-dest', 'pf-posts']) {
    s.ok('la hoja no aplasta ' + bloque, new RegExp('\\.hoja > \\.' + bloque + '[,{ ]').test(noAplastar));
  }
  s.ok('  y lo hace con flex:0 0 auto, no con alturas a dedo', /\{flex:0 0 auto\}/.test(noAplastar));

  /* Y los botones se ven TODOS. En una fila que se desliza, el ultimo se
     queda cortado en el borde y parece que no hay nada mas: nadie lo busca.
     Se envuelven en varias filas. */
  const acc = css.slice(css.indexOf('.pf-acciones{'), css.indexOf('.pf-acciones{') + 400);
  s.ok('los botones se envuelven, no se deslizan',
    /flex-wrap:wrap/.test(acc) && !/overflow-x:auto/.test(acc));
  s.ok('  y ninguno se queda a medias', /min-width:calc\(50% - 4px\)/.test(acc));

  return s;
};

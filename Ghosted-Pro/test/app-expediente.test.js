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

  return s;
};

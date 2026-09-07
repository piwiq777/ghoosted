'use strict';
/* El correo con la clave. Puede que sea el unico sitio donde el comprador
 * vuelva a encontrarla dentro de un mes, asi que tiene que llegar y tiene que
 * entenderse — tambien en Outlook, que usa el motor de Word, y con las
 * imagenes bloqueadas, que es lo que hace casi todo el mundo por defecto. */
const path = require('path');
const { suite } = require('./lib/probar');

const { correoLicencia, TEXTOS } = require(
  path.resolve(__dirname, '..', '..', 'Ghosted-Landing', 'lib', 'correo.js'));

const IDIOMAS = ['en', 'es', 'pt-BR', 'fr', 'de', 'it', 'tr', 'id', 'ru', 'hi', 'ar', 'ja'];

module.exports = () => {
  const s = suite('correo de la clave');

  const hacer = (lang) => correoLicencia({
    key: 'GHST-A1B2-C3D4-E5F6-A7B8-C9D0', producto: 'Ghoosted Pro', lang,
    urlDescarga: 'https://ghoosted.net/api/download?key=GHST-A1B2', sitio: 'https://ghoosted.net',
  });

  s.eq('estan los 12 idiomas de la web', Object.keys(TEXTOS).sort(), IDIOMAS.slice().sort());

  const piezas = Object.keys(TEXTOS.en);
  s.eq('ningun idioma a medias',
    IDIOMAS.filter((l) => piezas.some((k) => !TEXTOS[l][k])), []);

  const es = hacer('es');
  s.ok('la clave sale en el correo', es.html.indexOf('GHST-A1B2-C3D4-E5F6-A7B8-C9D0') !== -1);
  s.ok('y el enlace de descarga', es.html.indexOf('/api/download?key=') !== -1);
  s.ok('y los tres pasos', /chrome:\/\/extensions/.test(es.html));
  s.ok('y el aviso legal del desistimiento', /TRLGDCU|2011\/83/.test(es.html));

  /* Sin version en texto los filtros puntuan peor, y hay quien lee asi. */
  s.ok('lleva version en texto plano', es.text.length > 200);
  s.ok('la clave tambien en el texto', es.text.indexOf('GHST-A1B2') !== -1);

  /* Gmail se come los <style>; en Outlook no hay flex ni grid. */
  for (const l of IDIOMAS) {
    const c = hacer(l);
    if (/<style/i.test(c.html)) s.ok(l + ': sin bloques <style>', false);
    if (/display:\s*(flex|grid)/i.test(c.html)) s.ok(l + ': sin flex ni grid', false);
    const abre = (c.html.match(/<table/g) || []).length;
    const cierra = (c.html.match(/<\/table>/g) || []).length;
    if (abre !== cierra) s.eq(l + ': tablas equilibradas', abre, cierra);
  }
  s.ok('ningun idioma usa style, flex o grid, y todas las tablas cierran', true);

  /* El arabe se lee al reves; si no, el correo sale desordenado. */
  s.ok('el arabe va de derecha a izquierda', /dir="rtl"/.test(hacer('ar').html));
  s.ok('el resto de izquierda a derecha', /dir="ltr"/.test(hacer('ja').html));

  /* Un idioma que no existe no puede dejar el correo en blanco. */
  const raro = correoLicencia({ key: 'K', producto: 'Ghoosted Plus', lang: 'zz', urlDescarga: 'u', sitio: 's' });
  s.eq('un idioma desconocido cae en ingles', raro.subject, TEXTOS.en.subject('Ghoosted Plus'));

  /* La clave se escapa: no viene de nosotros hasta que se demuestre. */
  const feo = correoLicencia({ key: '<script>x</script>', producto: 'P', lang: 'en', urlDescarga: 'u', sitio: 's' });
  s.ok('el contenido se escapa', feo.html.indexOf('<script>') === -1);

  /* El asunto se lee en la bandeja: sin nombre de producto no se distingue de
     cualquier otro correo. */
  s.ok('el asunto nombra el producto', es.subject.indexOf('Ghoosted Pro') !== -1);

  /* La clave tambien como fichero: copiar al portapapeles se pierde en cuanto
     se copia otra cosa, y un corte de luz no perdona. */
  s.ok('lleva la clave adjunta como fichero', es.adjunto.indexOf('GHST-A1B2') !== -1);
  s.eq('el adjunto se llama igual siempre', es.nombreAdjunto, 'ghoosted-clave.txt');

  /* Si se pierde el correo, tiene que decir por si mismo como recuperarla. */
  s.ok('dice donde recuperarla', es.html.indexOf('/recuperar') !== -1);
  s.ok('y tambien en la version de texto', es.text.indexOf('/recuperar') !== -1);

  /* Con las imagenes bloqueadas —que es lo normal— el correo tiene que
     seguir entendiendose: el nombre va como texto, no dentro del logo. */
  s.ok('el nombre de la marca es texto, no imagen', es.html.indexOf('>Ghoosted<') !== -1);
  s.ok('la imagen del logo no lleva texto imprescindible', /alt=""/.test(es.html));

  return s;
};

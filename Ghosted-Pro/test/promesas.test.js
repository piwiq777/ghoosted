'use strict';
/* Lo que se promete, y lo que se puede cumplir.
 *
 * El modo fantasma depende de como funcione Instagram HOY. Los propios
 * Terminos lo dicen, y la FAQ tambien. Pero el marketing lo contaba en
 * absoluto — "abre historias sin dejar rastro", y dentro del propio panel,
 * "Instagram no sabe que has visto esto".
 *
 * Eso es un problema de dos filos. Uno: Instagram cambia algo y la promesa se
 * cae sola, con el cliente delante. Y dos: en la UE, cuando el anuncio y las
 * condiciones se contradicen, se resuelve a favor del consumidor (art. 61
 * TRLGDCU) — o sea que la promesa absoluta gana sobre el descargo, y con ella
 * el derecho a devolucion que precisamente se queria excluir.
 *
 * Asi que se promete el DISEÑO, no el resultado. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const WEB = path.resolve(PRO, '..', 'Ghosted-Landing');

/* Formas absolutas que no puede tener ningun texto. No es una lista completa
   de todos los idiomas del mundo; es la de las que ya estuvieron escritas y
   las variantes obvias de cada una. */
const PROHIBIDAS = [
  /instagram no (?:lo )?sabr[áa]/i,
  /instagram no sabe/i,
  /instagram (?:will )?never knows?/i,
  /instagram is (?:never|not) told/i,
  /leaves no trace/i,
  /instagram (?:won't|will not|doesn't|does not) know/i,
  /instagram (?:erf[äa]hrt|weiß) (?:es )?nicht/i,
  /instagram ne (?:le )?saura/i,
  /instagram non (?:lo )?sapr[àa]/i,
  /instagram n[ãa]o (?:vai )?sab/i,
];

module.exports = () => {
  const s = suite('lo que se promete');

  /* Las cuatro claves que hablan del modo fantasma de cara al usuario. */
  const clavesWeb = ['fx_ghost_d', 'price_f9', 'a3'];
  const clavesExt = ['dos_ghost_note', 'gh_watch_note'];

  const malas = [];
  const revisar = (donde, texto) => {
    for (const re of PROHIBIDAS) if (re.test(texto)) malas.push(donde + ' → ' + texto.slice(0, 60));
  };

  /* La web, los doce idiomas. */
  const locales = path.join(WEB, 'locales');
  const idiomas = fs.readdirSync(locales).filter((f) => f.endsWith('.json'));
  s.eq('once idiomas ademas del ingles', idiomas.length, 11);
  for (const f of idiomas) {
    const d = JSON.parse(fs.readFileSync(path.join(locales, f), 'utf8'));
    for (const k of Object.keys(d)) revisar('locales/' + f + ' · ' + k, String(d[k]));
  }
  revisar('index.html', fs.readFileSync(path.join(WEB, 'index.html'), 'utf8'));

  /* Y la extension, que es donde estaba la peor: dentro del producto. */
  const loc = path.join(PRO, '_locales');
  for (const l of fs.readdirSync(loc)) {
    const p = path.join(loc, l, 'messages.json');
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const k of Object.keys(d)) revisar('_locales/' + l + ' · ' + k, String(d[k].message || ''));
  }
  /* Y el respaldo en ingles que vive dentro del propio codigo: es el que se
     lee cuando chrome.i18n no tiene la clave, asi que una promesa absoluta ahi
     sale igual de publicada que en los doce ficheros de idioma. Se escapo la
     primera vez porque solo se miraban los _locales. */
  revisar('src/i18n.js', fs.readFileSync(path.join(PRO, 'src', 'i18n.js'), 'utf8'));
  revisar('popup/popup.js', fs.readFileSync(path.join(PRO, 'popup', 'popup.js'), 'utf8'));
  s.eq('nadie promete que Instagram no se entere', malas, []);

  /* Y lo contrario: que la dependencia se diga donde se vende la funcion. Un
     descargo escondido en la FAQ no cuenta si la tarjeta promete otra cosa. */
  const sinAviso = [];
  for (const f of idiomas) {
    const d = JSON.parse(fs.readFileSync(path.join(locales, f), 'utf8'));
    for (const k of ['fx_ghost_d', 'a3']) {
      if (d[k] && !/instagram/i.test(d[k])) sinAviso.push(f + ' · ' + k);
    }
  }
  s.eq('donde se vende el modo fantasma se dice de que depende', sinAviso, []);

  /* La linea de confianza: existia traducida a doce idiomas y no se pintaba en
     ningun sitio. "Sin contraseña" es lo que mas frena a quien desconfia de
     una herramienta de Instagram, y estaba escrita y guardada en un cajon. */
  const html = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8');
  s.ok('la linea de confianza se pinta', /class="hero-trust" data-i18n="hero_trust"/.test(html));

  /* El titular estaba limitado a 14ch —lo que medía "Quién te mira.", el de
     antes— y con balance encima. Con una frase entera eso lo estrangulaba a
     tres lineas estrechas y apiladas en medio de la pagina. */
  const css = fs.readFileSync(path.join(WEB, 'styles.css'), 'utf8');
  s.ok('el titular no lleva un ancho pensado para otra frase',
    /\.hero-title\{[^}]*max-width:none/.test(css) && !/\.hero-title\{[^}]*max-width:1\dch/.test(css));
  s.ok('y no se parte antes de tiempo por equilibrar',
    /\.hero-title\{[^}]*text-wrap:pretty/.test(css));
  /* En el subtitulo es al reves: son cuatro frases cortas seguidas y sin
     equilibrar se quedaba "Que ha cambiado." colgando sola. */
  s.ok('el subtitulo si se equilibra', /\.hero-sub\{[^}]*text-wrap:balance/.test(css));
  s.ok('y va debajo de los botones, que es lo ultimo que se lee',
    html.indexOf('hero-cta') < html.indexOf('hero-trust'));
  /* Raices, no palabras enteras: el ruso declina —"Без пароля" no contiene
     "пароль"— y una comprobacion que falla por gramatica no vigila nada, solo
     molesta hasta que alguien la borra. */
  const sinClave = idiomas.filter((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(locales, f), 'utf8'));
    return !d.hero_trust || !/contrase|passwor|mot de passe|senha|парол|パスワード|şifre|पासवर्ड|kata sandi|كلمة مرور/i.test(d.hero_trust);
  });
  s.eq('y en los once idiomas dice lo de la contraseña', sinClave, []);

  return s;
};

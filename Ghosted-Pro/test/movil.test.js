'use strict';
/* La visita desde un movil.
 *
 * Ghoosted se instala en un ordenador. Quien llega desde un telefono no puede
 * comprarlo aunque quiera: leia, se iba, y la visita se perdia entera. Ahora
 * lo primero que ve es que esto es para ordenador, con la unica accion util
 * que puede hacer ahora mismo — mandarse el enlace.
 *
 * Y bajo el titular, la frase que dice QUE ES. hero_sub llevaba traducida a
 * doce idiomas sin pintarse en ningun sitio: la portada abria con "La verdad ·
 * Detras del perfil", que no explica nada a quien llega de nuevas.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');
const CLAVES = ['mob_h', 'mob_p', 'mob_send', 'mob_copy', 'mob_copied', 'mob_share'];
const CHROMES = [
  path.join(os.homedir(), '.cache/puppeteer/chrome/linux-151.0.7922.77/chrome-linux64/chrome'),
  path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
  '/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
];

module.exports = () => {
  const s = suite('la visita desde un movil');
  const html = leer('index.html');
  const js = leer('app.js');
  const css = leer('styles.css');

  /* 1 · La frase que explica que es. */
  s.ok('el titular lleva debajo la frase que dice que es',
    /<p class="hero-sub" data-i18n="hero_sub">/.test(html));
  s.ok('y va entre el titular y los botones, no suelta al final',
    html.indexOf('hero-title') < html.indexOf('hero-sub')
    && html.indexOf('hero-sub') < html.indexOf('hero-cta'));
  s.ok('con estilo propio, no heredando el del titular', /\.hero-sub\{/.test(css));

  /* 2 · El aviso del movil, y que vaya ARRIBA DEL TODO. */
  s.ok('existe el aviso del movil', /<aside class="movil" id="movil" hidden>/.test(html));
  s.ok('va antes que la barra de navegacion',
    html.indexOf('id="movil"') < html.indexOf('class="nav-wrap"'));
  s.ok('nace oculto, para que no parpadee en un ordenador', /id="movil" hidden/.test(html));
  s.ok('trae los dos botones', /id="movilEnviar"/.test(html) && /id="movilCopiar"/.test(html));

  /* 3 · Que se enseñe por el aparato, no por el ancho. Una ventana estrecha en
        un portatil sigue siendo un ordenador: decirle ahi "esto es para
        ordenador" es ruido, y encima resta ventas. */
  s.ok('se decide por puntero grueso y sin hover, no solo por el ancho',
    /\(pointer: coarse\) and \(hover: none\)/.test(js));
  s.ok('y ademas por pantalla de movil', /max-width: 900px/.test(js));

  /* 4 · Las tres vias de copiado, en orden. Sin la ultima, un boton que no
        hace nada parece una web rota. */
  s.ok('copia con el portapapeles moderno', /navigator\.clipboard\.writeText\(ENLACE\)/.test(js));
  s.ok('y si falla, con el campo temporal de toda la vida',
    /document\.execCommand && document\.execCommand\('copy'\)/.test(js));
  s.ok('y si tampoco, enseña el enlace para copiarlo a mano', /decir\(ENLACE\)/.test(js));

  /* 5 · Compartir: menu nativo, y correo donde no lo haya. */
  s.ok('usa el menu de compartir del telefono', /navigator\.share\(\{/.test(js));
  s.ok('cerrarlo no se cuenta como error', /e\.name !== 'AbortError'/.test(js));
  s.ok('y sin menu, queda el correo', /'mailto:\?subject='/.test(js));

  /* 6 · Lo que se comparte es la portada limpia: quien llega con #pricing o
        con parametros de una campaña no puede mandarse eso. */
  s.ok('se manda el enlace canonico, no la URL actual',
    /link\[rel="canonical"\]/.test(js) && !/location\.href;/.test(js.split('ENLACE')[0] || ''));

  /* 7 · Los doce idiomas. */
  const idiomas = fs.readdirSync(path.join(WEB, 'locales')).filter((f) => f.endsWith('.json'));
  s.eq('once idiomas ademas del ingles', idiomas.length, 11);
  for (const f of idiomas) {
    const d = JSON.parse(leer(path.join('locales', f)));
    s.eq(f + ': estan los textos del aviso', CLAVES.filter((k) => !d[k]), []);
    s.ok(f + ': y la frase del titular', !!d.hero_sub);
  }
  for (const k of CLAVES) s.ok('el ingles de ' + k + ' esta en el HTML o en app.js',
    html.indexOf(k) !== -1 || js.indexOf(k) !== -1);

  /* 6 bis · La vitrina. Antes esto eran doce tarjetas con parrafo y seis
     capturas del tamaño de un sello dentro de un bento: mucha letra y ninguna
     imagen legible, que es al reves de como se vende algo que se entiende
     mirandolo. */
  s.ok('ya no queda el bento ni las tarjetas de texto',
    !/fb-bento|fb-grid|features-head/.test(html));
  s.eq('la vitrina tiene seis capturas', (html.match(/class="show-slide/g) || []).length, 6);
  s.eq('con su pestaña cada una', (html.match(/class="show-tab[ "]/g) || []).length, 6);
  s.ok('la imagen se ve ENTERA, no recortada', /\.show-slide img\{[^}]*object-fit:contain/.test(css));
  s.ok('y grande: el escenario ocupa casi toda la altura', /height:min\(74vh,700px\)/.test(css));
  /* Las imagenes pasan DE LADO. Antes aparecian y desaparecian en el sitio, y
     la navegacion era una lista vertical de seis nombres a la derecha que se
     leia como un menu y le robaba a la foto 300px de ancho. */
  s.ok('las capturas van en una pista que se desplaza', /class="show-pista"/.test(html)
    && /\.show-pista\{display:flex/.test(css));
  s.ok('y app.js la mueve un ancho por paso',
    /pista\.style\.transform = 'translateX\(' \+ \(-idx \* 100\) \+ '%\)'/.test(js));
  s.eq('con una flecha a cada lado', (html.match(/class="show-nav"/g) || []).length, 2);
  s.ok('y las dos pasan de verdad', /showPrev.*go\(idx - 1\)/s.test(js) && /showNext.*go\(idx \+ 1\)/s.test(js));
  /* En un movil, 52px de flecha por lado son 104px menos de imagen: se ponen
     encima de la foto en vez de al lado. */
  s.ok('en el movil las flechas no le roban ancho a la imagen',
    /@media \(max-width:700px\)[\s\S]{0,400}\.show-nav\{position:absolute/.test(css));
  /* La misma captura estaba dos veces en la portada: en su propia seccion y
     como diapositiva de la vitrina. */
  s.ok('la imagen duplicada ya no tiene seccion propia',
    !/class="film"/.test(html) && !/\.film-card\{/.test(css));
  /* El nombre y la explicacion van ARRIBA y cambian con la captura. Debajo de
     la imagen no queda ni una letra: solo los puntos. */
  s.ok('el texto va antes de la imagen, no debajo',
    html.indexOf('class="show-copy"') < html.indexOf('class="show-carro"'));
  s.ok('y debajo de la imagen solo quedan los puntos',
    html.indexOf('class="show-tabs"') > html.indexOf('class="show-carro"')
    && !/class="show-mas"/.test(html));
  s.eq('los puntos no llevan texto', (html.match(/class="show-tab[^"]*"[^>]*>\s*<span class="show-bar">/g) || []).length, 6);
  /* Pero el nombre sigue estando para quien navega a ciegas. */
  s.eq('cada punto dice su nombre en aria-label',
    (html.match(/data-i18n-attr="aria-label\|fx_/g) || []).length, 6);
  /* Los seis bloques comparten celda y se cruzan por opacidad: si fuera
     display:none, el titulo pegaria un salto en cada cambio. */
  s.ok('el titulo no salta al cambiar de captura',
    /\.show-copy\{display:grid/.test(css) && /\.show-lede\{grid-area:1\/1;opacity:0;visibility:hidden/.test(css));
  /* Lo que quitamos de la portada sigue enumerado donde importa: en el precio,
     antes de pagar. Si no, se estarian vendiendo funciones que no se nombran. */
  const precios = html.slice(html.indexOf('class="price-grid"'));
  s.ok('las funciones sin captura siguen listadas en el precio',
    ['price_f10', 'price_f11', 'price_f5', 'price_f6'].every((k) => precios.indexOf(k) !== -1));
  /* El titulo de la seccion se queda para el esquema del documento, invisible. */
  s.ok('la seccion conserva su encabezado para lectores de pantalla',
    /class="show-oculto" id="showTitle" data-i18n="show_title"/.test(html)
    && /\.show-oculto\{position:absolute/.test(css));
  /* EL APARTADO DEL MOVIL, FUERA ENTERO.
     Era un dibujo de un movil con un boton al lado y medio metro de hueco en
     medio, y lo que decia ya lo dice el bloque negro del final: la app, gratis,
     y el boton. Dos veces lo mismo, y la fea primero. Si vuelve, que vuelva
     con algo que enseñar dentro, no con un espacio vacio. */
  s.ok('sin el apartado del movil', !/id="pair"|class="pair/.test(html));
  s.ok('y sin sus estilos', !/\.pair-|@keyframes pair/.test(css));
  s.ok('ni su enlace en el menu', !/href="#pair"/.test(html));
  s.ok('ni el teatro del emparejado en el guion', !/pairStage|is-scanning|pair-card/.test(js));
  s.ok('sin traducciones huerfanas del apartado',
    idiomas.every((f) => {
      const d = JSON.parse(leer(path.join('locales', f)));
      return !['pair_title', 'pair_sub', 'pair_badge_app', 'pair_qr_label', 'pair_qr_note',
        'pair_trust_1', 'pair_trust_2', 'pair_trust_3', 'pair_step_1', 'pair_step_2', 'pair_step_3',
        'nav_pair', 'app_dl', 'app_ios', 'app_pill'].some((k) => k in d);
    }));
  s.ok('y sin el generador de QR colgando de la portada',
    !/src="qr\.js"/.test(html) && !/GhostedQR/.test(js));

  /* Pero lo que vendia NO puede desaparecer con el: la descarga de la app
     tiene que seguir a un clic desde la portada, y hay que seguir diciendo
     que de iPhone no hay. Eso vive ahora en el bloque negro del final. */
  s.ok('la portada sigue ofreciendo la app',
    /class="bajar-b[^"]*"[^>]*href="\/movil\/Ghoosted\.apk"/.test(html));
  s.ok('y sigue diciendo que de iPhone todavia no hay', /data-i18n="dl_ios"/.test(html));
  s.ok('quien entra desde un Android tiene boton de descarga',
    /id="movilApp"[^>]*href="\/movil\/Ghoosted\.apk"/.test(html) && /\/android\/i\.test\(navigator\.userAgent/.test(js));
  // En arabe "Android" se escribe con su alfabeto, no en latino.
  s.ok('y el requisito antes de pagar ya nombra la app',
    idiomas.every((f) => /android|أندرويد/i.test(JSON.parse(leer(path.join('locales', f))).price_req || '')));

  /* Texto muerto: lo que se quedo sin sitio al quitar el bento. */
  const MUERTAS = ['feat_kicker', 'more_title', 'feat_intro', 'show_lede_0', 'show_tab_0',
    'fx_download_d', 'fx_tiktok_d', 'm7_d'];
  s.ok('no quedan traducciones de lo que ya no existe',
    idiomas.every((f) => {
      const d = JSON.parse(leer(path.join('locales', f)));
      return !MUERTAS.some((k) => k in d);
    }));
  /* Y lo contrario: que no falte ninguna de las que la portada sigue pidiendo. */
  const pedidas = [...new Set([...html.matchAll(/data-i18n(?:-html)?="([a-z0-9_]+)"/g)].map((m) => m[1]))];
  for (const f of idiomas) {
    const d = JSON.parse(leer(path.join('locales', f)));
    s.eq(f + ': no falta ningun texto de la portada', pedidas.filter((k) => !d[k]), []);
  }

  /* 6 ter · LA ESTRUCTURA.
     El hero es position:sticky y se queda pegado detras de todo lo que viene
     despues; lo que lo tapa es <div class="over">, que lleva fondo solido y
     z-index:2. Si algo se sale de ese envoltorio, deja de tener suelo y el
     hero se le pinta ENCIMA — titular, botones y fotos flotando sobre el
     precio. Es lo que paso al quitar un bloque y dejarse un </div> suelto:
     .over cerraba dentro del apartado del movil y el precio, el FAQ y la
     llamada final se quedaban fuera.
     Contar llaves no vale: hay que mirar el anidamiento. */
  const cierraDiv = (txt, desde) => {
    let prof = 0;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = desde;
    let m;
    while ((m = re.exec(txt))) {
      prof += m[0] === '</div>' ? -1 : 1;
      if (prof === 0) return m.index + m[0].length;
    }
    return -1;
  };
  const abreOver = html.indexOf('<div class="over">');
  s.ok('la portada tiene el envoltorio que tapa el hero', abreOver !== -1);
  const cierraOver = cierraDiv(html, abreOver);
  s.ok('y ese envoltorio cierra', cierraOver !== -1);
  for (const [que, marca] of [['el precio', 'class="pricing"'], ['el FAQ', 'id="faq"'], ['la llamada final', 'class="cta-band"']]) {
    const i = html.indexOf(marca);
    s.ok(que + ' va dentro del envoltorio, o el hero se le pinta encima',
      i > abreOver && i < cierraOver);
  }
  /* Y que ninguna seccion se quede con un </div> de mas o de menos, que es de
     donde salio el desaguisado. */
  const descuadradas = [];
  for (const m of html.matchAll(/<section\b[^>]*class="([^"]*)"[^>]*>/g)) {
    const fin = html.indexOf('</section>', m.index);
    const dentro = html.slice(m.index, fin);
    const abre = (dentro.match(/<div\b/g) || []).length;
    const cierra = (dentro.match(/<\/div>/g) || []).length;
    if (abre !== cierra) descuadradas.push(m[1].split(' ')[0] + ' (' + abre + '/' + cierra + ')');
  }
  s.eq('ninguna seccion tiene divs descuadrados', descuadradas, []);

  /* 7 bis · La transparencia se fue a los Terminos, pero el enlace se queda
     DELANTE del precio. En la UE lo que se dice antes de cobrar obliga (art.
     61 TRLGDCU): esconder los limites detras del boton de pagar es justo lo
     que tumba una exclusion de reembolso cuando alguien reclama. */
  const terms = leer('terms.html');
  s.ok('la portada ya no lleva la seccion de transparencia', html.indexOf('class="compat"') === -1);
  /* El enlace que la anunciaba desde el precio tambien se retiro. La
     informacion sigue entera en los Terminos, enlazados desde el pie. */
  s.ok('la portada ya no lo enlaza desde el precio', !/price-tp/.test(html));
  s.ok('pero los Terminos siguen a un clic desde el pie', /href="terms\.html"/.test(html));
  /* Lo que NO puede desaparecer: que la clave se ata a una cuenta. Enterarse
     de eso despues de pagar es una devolucion. */
  s.ok('y antes de pagar se sigue avisando de una clave por cuenta',
    idiomas.every((f) => /una clave|one key|ein Schl|une cl|uma chave|una chiave|один ключ|bir anahtar|satu kunci|एक कुंजी|مفتاح واحد|キー1つ/i
      .test(JSON.parse(leer(path.join('locales', f))).price_foot || '')));
  /* Y las tres columnas de despues del precio, fuera. */
  s.ok('sin el bloque de tres columnas bajo el precio',
    !/after-buy/.test(html) && !/\.after-buy\{/.test(css));
  /* Mas aire arriba y abajo de la vitrina que en el resto de secciones: es una
     foto grande sola, y pegada a lo de al lado parece un trozo de otra cosa. */
  s.ok('la vitrina respira mas que el resto',
    /\.show\{max-width:1280px[^}]*padding:calc\(var\(--sec\) \+ 48px\) 24px calc\(var\(--sec\) \+ 24px\)/.test(css));
  s.eq('el bloque esta en los doce idiomas de los Terminos',
    (terms.match(/<h3 class="tp-anchor">/g) || []).length, 12);
  s.eq('con sus tres columnas cada uno',
    (terms.match(/<div class="tp-c">/g) || []).length, 36);
  /* Un id repetido doce veces no es valido, y el ancla saltaba al articulo
     ingles — oculto para quien lee en otro idioma. */
  s.eq('sin ids repetidos', (terms.match(/id="transparencia"/g) || []).length, 0);
  s.ok('y el salto busca el articulo que se ve',
    /irAlAncla/.test(leer('legal-i18n.js')) && /style\.display === 'none'/.test(leer('legal-i18n.js')));
  s.ok('sin traducciones huerfanas de lo retirado',
    idiomas.every((f) => {
      const d = JSON.parse(leer(path.join('locales', f)));
      return !['price_tp', 'after_key', 'after_store', 'after_upd'].some((k) => k in d);
    }));
  /* Y que no quede texto muerto: los compat_* ya no los usa nadie, porque
     terms.html es HTML fijo por idioma, no traducido al vuelo. */
  s.ok('no quedan traducciones huerfanas de la seccion movida',
    idiomas.every((f) => !Object.keys(JSON.parse(leer(path.join('locales', f)))).some((k) => /^compat_/.test(k))));

  /* 8 · Y la prueba que no se puede hacer de otra forma: el portapapeles exige
        que el toque venga del usuario, y un click por codigo no cuenta. Esto
        arranca Chrome, emula un movil y da toques de verdad. */
  if (!CHROMES.some((c) => fs.existsSync(c))) {
    console.log('    \x1b[33msin Chrome: el aviso del movil no se ha probado con toques reales\x1b[0m');
    s.ok('aviso: la prueba con toques reales no se ha ejecutado', true);
    return s;
  }
  let salida = '', ok = false;
  try {
    salida = execFileSync(process.execPath, [path.join(WEB, 'tools', 'probar-movil.js'), WEB],
      { encoding: 'utf8', timeout: 240000 });
    ok = true;
  } catch (e) {
    salida = String((e.stdout || '') + (e.stderr || ''));
  }
  const fallos = salida.replace(/\x1b\[\d+m/g, '').split('\n')
    .filter((l) => /^\s*NO /.test(l)).map((l) => l.replace(/^\s*NO\s+/, ''));
  s.eq('en un movil de verdad: sale el aviso y copiar copia', ok ? [] : fallos, []);

  return s;
};

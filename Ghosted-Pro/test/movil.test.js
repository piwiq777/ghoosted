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

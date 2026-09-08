'use strict';
/* El paquete, en un Chrome de verdad.
 *
 * Es la unica prueba que ejerce lo que se rompio: la inyeccion del content
 * script, el DOM real y el paso de mensajes entre la ventana del icono y la
 * pagina. Todo lo demas del proyecto —647 comprobaciones— pasaba en verde
 * mientras el paquete de Pro estaba muerto, porque miraban el fuente y Plus,
 * que no se ofusca. Estaba roto justo lo unico que se cobra.
 *
 * Arranca Chrome con la extension cargada, sirve Instagram desde local para
 * que la pagina tenga su origen autentico, pone la cookie de sesion y mira si
 * el fantasma aparece y si el popup recibe respuesta.
 *
 * Sin Chrome en la maquina no se puede hacer, y se dice en vez de callarse:
 * una prueba que se salta en silencio es peor que no tenerla. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const PRIVADO = path.resolve(PRO, '..', 'Ghosted-Landing', 'api', '_private');
const ARNES = path.join(PRO, 'tools', 'probar-en-chrome.js');

const CHROMES = [
  path.join(os.homedir(), '.cache/puppeteer/chrome/linux-151.0.7922.77/chrome-linux64/chrome'),
  path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
  '/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
];

module.exports = () => {
  const s = suite('el paquete en un Chrome de verdad');

  const hayChrome = CHROMES.some((c) => fs.existsSync(c));
  if (!hayChrome) {
    /* Sin navegador esto no se puede comprobar. Se deja dicho, no aprobado. */
    console.log('    \x1b[33msin Chrome en esta maquina: no se ha podido probar el paquete de verdad\x1b[0m');
    console.log('    \x1b[33m(npx @puppeteer/browsers install chrome@stable)\x1b[0m');
    s.ok('aviso: la prueba en navegador no se ha ejecutado', true);
    return s;
  }

  const zips = fs.existsSync(PRIVADO) ? fs.readdirSync(PRIVADO).filter((f) => f.endsWith('.zip')) : [];
  s.eq('estan los dos paquetes', zips.length, 2);

  for (const z of zips) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghcrom-'));
    try {
      execFileSync('unzip', ['-qo', path.join(PRIVADO, z), '-d', tmp], { stdio: 'pipe' });
      let salida = '', ok = false;
      try {
        salida = execFileSync(process.execPath, [ARNES, tmp], { encoding: 'utf8', timeout: 240000 });
        ok = true;
      } catch (e) {
        salida = String((e.stdout || '') + (e.stderr || ''));
      }
      /* Sin colores, para que el motivo se lea en el informe. */
      const fallos = salida.replace(/\x1b\[\d+m/g, '').split('\n')
        .filter((l) => /^\s*NO /.test(l)).map((l) => l.replace(/^\s*NO\s+/, ''));
      s.eq(z + ': el fantasma aparece y el popup contesta, en Chrome', ok ? [] : fallos, []);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  /* Y que el arnes sepa fallar: si aprobara cualquier cosa, no valdria nada.
     Se le da una extension a la que le falta el content script. */
  const roto = fs.mkdtempSync(path.join(os.tmpdir(), 'ghroto-'));
  try {
    fs.mkdirSync(path.join(roto, 'src'));
    fs.writeFileSync(path.join(roto, 'manifest.json'), JSON.stringify({
      manifest_version: 3, name: 'roto', version: '1.0.0',
      background: { service_worker: 'src/background.js' },
      host_permissions: ['https://www.instagram.com/*'],
      content_scripts: [{ matches: ['https://www.instagram.com/*'], js: ['src/vacio.js'], run_at: 'document_idle' }],
      action: { default_popup: 'popup/popup.html' },
    }));
    fs.writeFileSync(path.join(roto, 'src', 'background.js'), '// nada\n');
    fs.writeFileSync(path.join(roto, 'src', 'vacio.js'), '// el content script no monta nada\n');
    let salida = '', cazado = false;
    try { execFileSync(process.execPath, [ARNES, roto], { stdio: 'pipe', timeout: 240000 }); }
    catch (e) { cazado = true; salida = String((e.stdout || '') + (e.stderr || '')); }
    const limpia = salida.replace(/\x1b\[\d+m/g, '');
    s.ok('el arnes caza una extension que no monta el fantasma', cazado);
    /* Y por el motivo correcto: si reventara por cualquier otra cosa, esta
       comprobacion aprobaria igual y no valdria para nada. */
    s.ok('y lo dice por el fantasma que falta, no por reventar',
      /NO\s+EL FANTASMA APARECE EN INSTAGRAM/.test(limpia));
  } finally {
    fs.rmSync(roto, { recursive: true, force: true });
  }

  return s;
};

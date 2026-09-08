'use strict';
/* ===========================================================================
   EL AVISO DEL MOVIL, CON TOQUES DE VERDAD
   ---------------------------------------------------------------------------
   Ghoosted se instala en un ordenador. Quien llega desde un telefono no puede
   comprarlo aunque quiera, asi que esa visita se perdia entera. El aviso le da
   lo unico util que puede hacer: mandarse el enlace.

   Pero "copiar al portapapeles" NO se puede comprobar desde la consola: tanto
   navigator.clipboard.writeText como execCommand('copy') exigen que el toque
   venga del usuario, y un .click() por codigo no cuenta. Asi que esto arranca
   un Chrome de verdad, emula un movil (pantalla, puntero grueso y tactil) y
   dispara toques reales por el protocolo de depuracion, que si valen como
   activacion. Despues lee el portapapeles y comprueba que dentro esta el
   enlace bueno.

   Uso:  node tools/probar-movil.js [carpeta de la web]
   =========================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync, spawn } = require('child_process');

const WEB = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const CHROMES = [
  path.join(os.homedir(), '.cache/puppeteer/chrome/linux-151.0.7922.77/chrome-linux64/chrome'),
  path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
  '/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
];
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function conectar(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let n = 0; const pend = new Map();
    ws.addEventListener('open', () => res({
      enviar(m, p) {
        const id = ++n;
        return new Promise((ok, mal) => { pend.set(id, { ok, mal }); ws.send(JSON.stringify({ id, method: m, params: p || {} })); });
      },
      cerrar() { try { ws.close(); } catch (e) {} },
    }));
    ws.addEventListener('error', rej);
    ws.addEventListener('message', (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    });
  });
}

async function main() {
  const problemas = [];
  const nota = (ok, texto) => { console.log('  ' + (ok ? '\x1b[32mSI \x1b[0m' : '\x1b[31mNO \x1b[0m') + ' ' + texto); if (!ok) problemas.push(texto); };

  const chrome = CHROMES.find((c) => fs.existsSync(c));
  if (!chrome) { console.error('  no hay Chrome en esta maquina'); process.exit(2); }

  /* Servidor estatico. localhost es contexto seguro, asi que el portapapeles
     moderno esta disponible: lo unico que falta es la activacion del usuario,
     que es justo lo que aporta el toque de verdad de mas abajo. */
  const servidor = http.createServer((req, res) => {
    let rel = decodeURIComponent(String(req.url).split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    if (!path.extname(rel)) rel += '.html';
    const abs = path.join(WEB, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!abs.startsWith(WEB) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.writeHead(404); return res.end('no');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(abs)] || 'application/octet-stream' });
    res.end(fs.readFileSync(abs));
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const puertoWeb = servidor.address().port;
  const BASE = 'http://localhost:' + puertoWeb + '/';

  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'ghmov-'));
  const proc = spawn(chrome, ['--headless=new', '--user-data-dir=' + perfil,
    '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const limpiar = () => {
    try { proc.kill('SIGKILL'); } catch (e) {}
    try { servidor.close(); } catch (e) {}
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', limpiar);

  let puerto = null;
  const activo = path.join(perfil, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !puerto; i++) {
    await esperar(150);
    if (fs.existsSync(activo)) { const l = fs.readFileSync(activo, 'utf8').split('\n'); if (l[0]) puerto = Number(l[0]); }
  }
  if (!puerto) { console.error('  Chrome no ha arrancado'); limpiar(); process.exit(2); }

  const nav = await fetch('http://127.0.0.1:' + puerto + '/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
  const cli = await conectar(nav.webSocketDebuggerUrl);
  await cli.enviar('Page.enable');
  await cli.enviar('Runtime.enable');
  await cli.enviar('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
  });
  await cli.enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  /* Sin esto el navegador sigue diciendo que tiene raton, y el aviso —que se
     enseña solo si NO lo hay— no saldria. */
  await cli.enviar('Emulation.setEmulatedMedia', {
    features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }],
  });
  await cli.enviar('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151 Mobile Safari/537.36',
  });

  const ev = async (expr) => {
    const r = await cli.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) return 'EXC ' + r.exceptionDetails.text;
    return r.result.value;
  };

  await cli.enviar('Page.navigate', { url: BASE });
  await esperar(2500);

  nota(await ev("matchMedia('(pointer: coarse) and (hover: none)').matches"), 'el navegador se comporta como un movil');
  nota(await ev("!document.getElementById('movil').hidden"), 'EL AVISO SALE ARRIBA DEL TODO');
  nota(await ev("document.getElementById('movil').compareDocumentPosition(document.querySelector('.nav-wrap')) === 4"),
    'y va antes que la barra de navegacion, no debajo');

  const textos = await ev(`JSON.stringify({
    titulo: document.querySelector('.movil-h').textContent,
    enviar: document.getElementById('movilEnviar').textContent,
    copiar: document.getElementById('movilCopiar').textContent,
    sub: (document.querySelector('.hero-sub') || {}).textContent,
  })`);
  const t = JSON.parse(textos);
  console.log('       ' + t.titulo + '  ·  [' + t.enviar + '] [' + t.copiar + ']');
  nota(!/^mob_/.test(t.titulo), 'el texto esta traducido, no es la clave cruda');
  nota(!!t.sub && !/^hero_/.test(t.sub), 'LA FRASE QUE EXPLICA QUE ES, BAJO EL TITULAR');
  console.log('       "' + String(t.sub).slice(0, 78) + '…"');

  /* Que quepa: si los botones se salen, en un movil de verdad no se pulsan. */
  const caja = JSON.parse(await ev(`(() => {
    const a = document.getElementById('movil').getBoundingClientRect();
    const b = document.getElementById('movilCopiar').getBoundingClientRect();
    return JSON.stringify({ alto: Math.round(a.height), derecha: Math.round(b.right),
      ancho: innerWidth, altoBoton: Math.round(b.height), scrollX: document.documentElement.scrollWidth });
  })()`));
  console.log('       ' + JSON.stringify(caja));
  nota(caja.derecha <= caja.ancho, 'los botones caben en la pantalla');
  nota(caja.scrollX <= caja.ancho, 'y la pagina no se desplaza en horizontal');
  nota(caja.altoBoton >= 40, 'los botones son bastante grandes para un dedo');
  nota(caja.alto < 260, 'el aviso no se come la pantalla entera');

  /* --- EL TOQUE DE VERDAD ------------------------------------------------
     Aqui esta lo que no se puede comprobar de otra forma: el portapapeles
     exige activacion del usuario, y un .click() por codigo no la da. */
  await cli.enviar('Browser.grantPermissions', {
    origin: 'http://localhost:' + puertoWeb,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  });
  const centro = JSON.parse(await ev(`(() => {
    const r = document.getElementById('movilCopiar').getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
  })()`));
  for (const tipo of ['mousePressed', 'mouseReleased']) {
    await cli.enviar('Input.dispatchMouseEvent', {
      type: tipo, x: centro.x, y: centro.y, button: 'left', clickCount: 1, buttons: tipo === 'mousePressed' ? 1 : 0,
    });
  }
  await esperar(900);
  const dentro = await ev('navigator.clipboard.readText()');
  const dicho = await ev("document.getElementById('movilOk').textContent");
  console.log('       portapapeles: ' + JSON.stringify(dentro) + '  ·  mensaje: ' + JSON.stringify(dicho));
  nota(String(dentro).indexOf('ghoosted.net') !== -1, 'AL TOCAR COPIAR, EL ENLACE ACABA EN EL PORTAPAPELES');
  nota(!!dicho && dicho.indexOf('http') === -1, 'y se le confirma al usuario que se ha copiado');

  /* --- LOS DOCE IDIOMAS ---------------------------------------------------
     El aviso es lo primero que ve alguien desde un movil, y si en su idioma
     se sale de la pantalla o parte un boton, el mensaje se pierde justo con
     quien mas lo necesita. Turco y ruso son los que mas ocupan. */
  const idiomas = fs.readdirSync(path.join(WEB, 'locales')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  const malos = JSON.parse(await ev(`(async () => {
    const h = document.querySelector('.movil-h'), p = document.querySelector('.movil-p');
    const e = document.getElementById('movilEnviar'), c = document.getElementById('movilCopiar');
    const orig = [h.textContent, p.textContent, e.textContent, c.textContent];
    const malos = [];
    for (const l of ${JSON.stringify(idiomas)}) {
      const d = await fetch('locales/' + l + '.json').then(x => x.json()).catch(() => null);
      if (!d) { malos.push({ l, motivo: 'no se puede leer el idioma' }); continue; }
      const faltan = ['mob_h','mob_p','mob_send','mob_copy','mob_copied','mob_share','hero_sub']
        .filter(k => !d[k]);
      if (faltan.length) { malos.push({ l, motivo: 'faltan ' + faltan.join(',') }); continue; }
      h.textContent = d.mob_h; p.textContent = d.mob_p;
      e.textContent = d.mob_send; c.textContent = d.mob_copy;
      void document.body.offsetWidth;
      const parte = [e, c].some(b => b.scrollWidth > b.clientWidth + 1);
      const desborda = document.documentElement.scrollWidth > innerWidth + 1;
      const alto = Math.round(document.getElementById('movil').getBoundingClientRect().height);
      if (parte || desborda || alto > 300) malos.push({ l, parte, desborda, alto });
    }
    h.textContent = orig[0]; p.textContent = orig[1]; e.textContent = orig[2]; c.textContent = orig[3];
    return JSON.stringify(malos);
  })()`));
  console.log('       ' + idiomas.length + ' idiomas ademas del ingles');
  if (malos.length) console.log('       ' + JSON.stringify(malos));
  nota(malos.length === 0, 'en ningun idioma se parte un boton ni se sale de la pantalla');

  /* El enlace tiene que ser la portada limpia aunque se llegue con basura. */
  await cli.enviar('Page.navigate', { url: BASE + '?utm_source=x#pricing' });
  await esperar(2000);
  const limpio = await ev(`(() => {
    const c = document.querySelector('link[rel="canonical"]');
    return c ? c.href : location.href;
  })()`);
  nota(limpio === 'https://ghoosted.net/', 'lo que se comparte es la portada limpia, sin parametros ni ancla');

  cli.cerrar();
  limpiar();
  console.log(problemas.length
    ? '\n  \x1b[31m' + problemas.length + ' comprobacion(es) fallan\x1b[0m\n'
    : '\n  \x1b[32mel aviso del movil funciona con toques de verdad\x1b[0m\n');
  process.exit(problemas.length ? 1 : 0);
}

main().catch((e) => { console.error('  la prueba ha reventado:', (e && e.stack) || e); process.exit(2); });

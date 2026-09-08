'use strict';
/* ===========================================================================
   PROBAR UN PAQUETE EN UN CHROME DE VERDAD
   ---------------------------------------------------------------------------
   tools/humo.js carga los ficheros en un vm de Node con dobles. Sirve para
   cazar colisiones de la ofuscacion, pero NO es Chrome: no inyecta content
   scripts, no tiene chrome.runtime de verdad y no pasa mensajes entre el popup
   y la pagina. Justo las tres cosas que se rompieron.

   Esto arranca un Chrome real con la extension cargada, sirve Instagram desde
   un servidor local (--host-resolver-rules apunta www.instagram.com a esta
   maquina, asi que la pagina tiene el origen autentico y el manifiesto la
   reconoce), pone la cookie ds_user_id y comprueba EN EL DOM REAL:

     · que el content script se inyecta
     · que el fantasma aparece
     · que al pulsarlo se abre donde se pega la clave
     · que el panel entero se monta
     · que el popup recibe respuesta al preguntar la cuenta  <- el bug

   Uso:  node tools/probar-en-chrome.js <carpeta del paquete> [--ver]
   =========================================================================== */
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execFileSync, spawn } = require('child_process');

const EXT = path.resolve(process.argv[2] || '.');
const VISIBLE = process.argv.includes('--ver');
const CUENTA = '17841400912730044';

const CHROMES = [
  path.join(os.homedir(), '.cache/puppeteer/chrome/linux-151.0.7922.77/chrome-linux64/chrome'),
  path.join(os.homedir(), '.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'),
  '/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
];
function buscarChrome() {
  for (const c of CHROMES) if (fs.existsSync(c)) return c;
  for (const c of ['google-chrome', 'chromium', 'chromium-browser']) {
    try { return execFileSync('command', ['-v', c], { shell: true, encoding: 'utf8' }).trim(); } catch (e) { /* siguiente */ }
  }
  return null;
}

/* --- Instagram de mentira, servido en local con el origen de verdad ------- */
const PAGINA = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Instagram</title></head><body style="background:#000;color:#fff;font:14px system-ui">
<div id="react-root"><main><h1>Instagram</h1><p id="feed">feed</p></main></div>
</body></html>`;

function certificado() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ghcert-'));
  const key = path.join(dir, 'k.pem'), crt = path.join(dir, 'c.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', key, '-out', crt, '-days', '2', '-subj', '/CN=www.instagram.com',
    '-addext', 'subjectAltName=DNS:www.instagram.com,DNS:instagram.com'], { stdio: 'pipe' });
  return { dir, key: fs.readFileSync(key), cert: fs.readFileSync(crt) };
}

/* --- CDP con el WebSocket que ya trae node ------------------------------- */
function conectar(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let n = 0;
    const pend = new Map();
    const oyentes = [];
    ws.addEventListener('open', () => res({
      enviar(metodo, params, sessionId) {
        const id = ++n;
        return new Promise((ok, mal) => {
          pend.set(id, { ok, mal });
          ws.send(JSON.stringify({ id, method: metodo, params: params || {}, sessionId }));
        });
      },
      al(f) { oyentes.push(f); },
      cerrar() { try { ws.close(); } catch (e) {} },
    }));
    ws.addEventListener('error', rej);
    ws.addEventListener('message', (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id && pend.has(m.id)) {
        const { ok, mal } = pend.get(m.id); pend.delete(m.id);
        return m.error ? mal(new Error(m.error.message)) : ok(m.result);
      }
      oyentes.forEach((f) => f(m));
    });
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function listaTargets(puerto) {
  const r = await fetch('http://127.0.0.1:' + puerto + '/json/list');
  return r.json();
}

async function main() {
  const problemas = [];
  const nota = (ok, texto) => { console.log('  ' + (ok ? '\x1b[32mSI \x1b[0m' : '\x1b[31mNO \x1b[0m') + ' ' + texto); if (!ok) problemas.push(texto); };

  const chrome = buscarChrome();
  if (!chrome) { console.error('  no hay ningun Chrome en esta maquina'); process.exit(2); }
  if (!fs.existsSync(path.join(EXT, 'manifest.json'))) { console.error('  ' + EXT + ' no tiene manifest.json'); process.exit(2); }
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  console.log('\n  ' + manifest.name + ' v' + manifest.version + '  ·  ' + path.basename(chrome)
    + ' ' + execFileSync(chrome, ['--version'], { encoding: 'utf8' }).trim().split(' ').pop());

  const { dir: certDir, key, cert } = certificado();
  const servidor = https.createServer({ key, cert }, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGINA);
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const puertoWeb = servidor.address().port;

  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'ghperfil-'));
  const args = [
    '--user-data-dir=' + perfil,
    '--load-extension=' + EXT,
    '--disable-extensions-except=' + EXT,
    '--remote-debugging-port=0',
    '--host-resolver-rules=MAP www.instagram.com 127.0.0.1:' + puertoWeb
      + ', MAP instagram.com 127.0.0.1:' + puertoWeb,
    '--ignore-certificate-errors',
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--disable-features=DialMediaRouteProvider,OptimizationHints',
    'about:blank',
  ];
  if (!VISIBLE) args.unshift('--headless=new');
  if (process.getuid && process.getuid() === 0) args.push('--no-sandbox');

  const proc = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let salida = '';
  proc.stderr.on('data', (d) => { salida += d; });

  const limpiar = () => {
    try { proc.kill('SIGKILL'); } catch (e) {}
    try { servidor.close(); } catch (e) {}
    for (const d of [perfil, certDir]) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {} }
  };
  process.on('exit', limpiar);

  /* El puerto real lo escribe Chrome en el perfil. */
  const activo = path.join(perfil, 'DevToolsActivePort');
  let puerto = null;
  for (let i = 0; i < 100 && !puerto; i++) {
    await esperar(150);
    if (fs.existsSync(activo)) {
      const l = fs.readFileSync(activo, 'utf8').split('\n');
      if (l[0] && l[0].trim()) puerto = Number(l[0].trim());
    }
  }
  if (!puerto) { console.error('  Chrome no ha arrancado:\n' + salida.slice(-1500)); limpiar(); process.exit(2); }

  /* La extension aparece cuando su service worker despierta. Y hay que
     buscar LA NUESTRA: Chrome trae componentes internos que tambien son
     chrome-extension://, y quedarse con el primero significa hablar con la
     extension equivocada — sin permisos de host, sin nuestro popup, y con
     todas las comprobaciones fallando por el motivo que no es. */
  const SW = '/' + (manifest.background || {}).service_worker;
  let ext = null;
  for (let i = 0; i < 60 && !ext; i++) {
    const ts = await listaTargets(puerto);
    ext = ts.find((t) => String(t.url).startsWith('chrome-extension://') && String(t.url).endsWith(SW));
    if (!ext) await esperar(250);
  }
  nota(!!ext, 'Chrome carga la extension');
  const extId = ext ? String(ext.url).split('/')[2] : null;
  if (extId) console.log('       (id: ' + extId + ', service worker ' + SW + ')');

  /* --- 1 · la pagina de Instagram, con sesion ---------------------------- */
  const nav = await fetch('http://127.0.0.1:' + puerto + '/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
  const cli = await conectar(nav.webSocketDebuggerUrl);
  const consola = [];
  cli.al((m) => {
    if (m.method === 'Runtime.consoleAPICalled') {
      consola.push((m.params.args || []).map((a) => String(a.value != null ? a.value : a.description || '')).join(' '));
    }
  });
  await cli.enviar('Runtime.enable');
  await cli.enviar('Network.enable');
  await cli.enviar('Network.setCookie', {
    name: 'ds_user_id', value: CUENTA, domain: '.instagram.com', path: '/', secure: true,
  });
  await cli.enviar('Network.setCookie', {
    name: 'csrftoken', value: 'abc123', domain: '.instagram.com', path: '/', secure: true,
  });
  await cli.enviar('Page.enable');
  await cli.enviar('Page.navigate', { url: 'https://www.instagram.com/' });
  await esperar(1200);

  const evalua = async (expr) => {
    const r = await cli.enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) return { error: r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception || {}).description };
    return r.result.value;
  };

  nota(await evalua("document.cookie.indexOf('ds_user_id') !== -1"), 'la pagina tiene la cookie de sesion de Instagram');
  nota(String(await evalua('location.origin')) === 'https://www.instagram.com',
    'y su origen es https://www.instagram.com, no un localhost');

  /* El content script se inyecta en document_idle; se le dan segundos. */
  let fab = false;
  for (let i = 0; i < 40 && !fab; i++) {
    fab = await evalua("!!document.getElementById('ghd-boot-fab') || !!document.getElementById('ghd-fab')");
    if (!fab) await esperar(250);
  }
  nota(fab, 'EL FANTASMA APARECE EN INSTAGRAM');
  nota(consola.some((c) => /content script activo/.test(c)), 'el content script deja su rastro en la consola');

  const cual = await evalua("document.getElementById('ghd-fab') ? 'panel' : (document.getElementById('ghd-boot-fab') ? 'arranque' : 'ninguno')");
  console.log('       (fantasma montado: ' + cual + ')');

  const visible = await evalua(`(() => {
    const b = document.getElementById('ghd-fab') || document.getElementById('ghd-boot-fab');
    if (!b) return null;
    const r = b.getBoundingClientRect(), s = getComputedStyle(b);
    return JSON.stringify({ w: Math.round(r.width), h: Math.round(r.height),
      derecha: Math.round(innerWidth - r.right), abajo: Math.round(innerHeight - r.bottom),
      display: s.display, visibility: s.visibility, opacity: s.opacity, z: s.zIndex });
  })()`);
  console.log('       ' + visible);
  const caja = visible ? JSON.parse(visible) : {};
  nota(caja.w >= 40 && caja.h >= 40, 'tiene tamaño de boton, no es un nodo vacio');
  nota(caja.display !== 'none' && caja.visibility !== 'hidden' && Number(caja.opacity) > 0.5, 'y es visible');
  nota(caja.derecha >= 0 && caja.derecha < 60 && caja.abajo >= 0 && caja.abajo < 60, 'abajo a la derecha, donde el usuario lo busca');

  /* --- 2 · pulsarlo abre donde se pega la clave -------------------------- */
  await evalua("(document.getElementById('ghd-boot-fab') || document.getElementById('ghd-fab')).click()");
  await esperar(600);
  const hoja = await evalua(`(() => {
    const h = document.getElementById('ghd-boot-sheet');
    if (h) return 'arranque:' + !!h.querySelector('#ghd-boot-key');
    const p = document.getElementById('ghd-panel');
    if (!p) return 'no se ha abierto nada';
    if (getComputedStyle(p).display === 'none') return 'el panel sigue oculto';
    return 'panel:' + !!p.querySelector('.ghd-unlock-input');
  })()`);
  console.log('       (al pulsar: ' + hoja + ')');
  nota(/:true$/.test(String(hoja)), 'AL PULSARLO SALE EL CAMPO DE LA CLAVE');

  /* --- 3 · el panel entero, que es lo que se compra ---------------------- */
  nota(await evalua("!!document.getElementById('ghd-panel')"), 'el panel se monta');
  nota(await evalua("!!document.querySelector('#ghd-panel .ghd-tabs')"), 'con sus pestañas');

  /* --- 4 · el puente popup -> content script: EL BUG --------------------- */
  if (ext) {
    /* Desde el service worker de la extension, que es el mismo contexto de
       extension desde el que pregunta el popup. Chrome no deja abrir una
       chrome-extension:// con /json/new ni navegando una pestaña desde fuera,
       asi que la pestaña del popup la abre la propia extension. */
    const sw = await conectar(ext.webSocketDebuggerUrl);
    await sw.enviar('Runtime.enable');
    const preguntar = async (donde, cliente) => {
      const r = await cliente.enviar('Runtime.evaluate', {
        awaitPromise: true, returnByValue: true, userGesture: true,
        expression: `(async () => {
          const t = await chrome.tabs.query({ url: ['https://www.instagram.com/*','https://instagram.com/*'] });
          if (!t[0]) return { fallo: 'no ve la pestaña de Instagram' };
          try {
            const q = await chrome.tabs.sendMessage(t[0].id, { type: 'getAccountId' });
            return { crudo: JSON.stringify(q === undefined ? '<undefined>' : q), cuenta: q && q.accountId };
          } catch (e) { return { fallo: String((e && e.message) || e) }; }
        })()`,
      });
      if (r.exceptionDetails) return { fallo: r.exceptionDetails.text };
      return (r.result && r.result.value) || {};
    };

    const desdeSW = await preguntar('service worker', sw);
    console.log('       (la extension pregunta la cuenta -> ' + JSON.stringify(desdeSW) + ')');
    nota(desdeSW.cuenta === CUENTA, 'EL CONTENT SCRIPT CONTESTA QUIEN ES LA CUENTA (era el bug del popup)');

    /* Y ahora el popup de verdad, en su propia pestaña, abierta por la
       extension — que es la unica forma en que Chrome la deja cargar. */
    await sw.enviar('Runtime.evaluate', {
      awaitPromise: true,
      expression: "chrome.tabs.create({ url: chrome.runtime.getURL('popup/popup.html'), active: false })",
    });
    let tp = null;
    for (let i = 0; i < 40 && !tp; i++) {
      await esperar(250);
      tp = (await listaTargets(puerto)).find((t) => String(t.url).indexOf('/popup/popup.html') !== -1);
    }
    nota(!!tp, 'la ventana del icono carga');
    if (tp) {
      const cp = await conectar(tp.webSocketDebuggerUrl);
      await cp.enviar('Runtime.enable');
      await esperar(900);
      const donde = await cp.enviar('Runtime.evaluate', { expression: 'location.protocol + " " + typeof (self.chrome && chrome.tabs)', returnByValue: true });
      console.log('       (contexto del popup: ' + (donde.result && donde.result.value) + ')');
      const desdePopup = await preguntar('popup', cp);
      console.log('       (el popup pregunta la cuenta -> ' + JSON.stringify(desdePopup) + ')');
      nota(desdePopup.cuenta === CUENTA, 'EL POPUP RECIBE LA CUENTA (ya no dice "recarga la pestaña")');

      /* Y lo que ve el usuario en la ventana: el precio y el estado. */
      const pintado = await cp.enviar('Runtime.evaluate', {
        returnByValue: true,
        expression: `JSON.stringify({
          comprar: (document.getElementById('buy') || {}).textContent,
          hayCampo: !!document.getElementById('key'),
          sinTraducir: (document.body.innerText.match(/[a-z]+_[a-z_]+/g) || []).slice(0, 3),
        })`,
      });
      const p = JSON.parse((pintado.result && pintado.result.value) || '{}');
      console.log('       (ventana: ' + JSON.stringify(p) + ')');
      nota(!!p.hayCampo, 'la ventana trae el campo de la clave');
      nota(!!p.comprar && /\d/.test(p.comprar), 'y el boton de compra con su precio');
      nota((p.sinTraducir || []).length === 0, 'sin claves de traduccion crudas a la vista');
      cp.cerrar();
    }
    sw.cerrar();
  }

  cli.cerrar();
  limpiar();
  console.log(problemas.length
    ? '\n  \x1b[31m' + problemas.length + ' comprobacion(es) fallan\x1b[0m\n'
    : '\n  \x1b[32mtodo correcto en un Chrome de verdad\x1b[0m\n');
  process.exit(problemas.length ? 1 : 0);
}

main().catch((e) => { console.error('  la prueba ha reventado:', e && e.stack || e); process.exit(2); });

'use strict';
/* Que el ZIP QUE SE VENDE arranque de verdad.
 *
 * El resto de la bateria mira el fuente. Esto mira el paquete, que no es lo
 * mismo: Pro sale ofuscado, y la ofuscacion se aplicaba fichero a fichero, sin
 * que ninguna llamada supiera de las otras. Con --string-array cada fichero
 * emite dos funciones globales, y con nombres deterministas salian IGUALES en
 * los ocho. Los content scripts de una extension comparten UN SOLO ambito, asi
 * que el ultimo pisaba a los anteriores: ig-api.js acababa leyendo la tabla de
 * cadenas de otro fichero y getUserId() dejaba de encontrar la cookie de
 * sesion. Sin cuenta no se montaba nada — ni fantasma, ni panel, ni forma de
 * activar una clave ya pagada.
 *
 * Los ocho ficheros pasaban `node --check`. El fuente estaba bien. Plus estaba
 * bien, porque no se ofusca. Estaba roto exactamente lo unico que se cobraba,
 * y nada en todo el proyecto lo miraba.
 *
 * Esto carga los content scripts en el orden del manifiesto y en un ambito
 * compartido, como hace Chrome, y comprueba que leen la sesion. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const PRIVADO = path.resolve(PRO, '..', 'Ghosted-Landing', 'api', '_private');
const HUMO = path.join(PRO, 'tools', 'humo.js');

module.exports = () => {
  const s = suite('el paquete que se vende arranca');

  const zips = fs.existsSync(PRIVADO)
    ? fs.readdirSync(PRIVADO).filter((f) => f.endsWith('.zip'))
    : [];
  s.eq('estan los dos paquetes', zips.length, 2);

  for (const z of zips) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ghumo-'));
    try {
      execFileSync('unzip', ['-qo', path.join(PRIVADO, z), '-d', tmp], { stdio: 'pipe' });
      /* En un proceso aparte: un paquete roto lanza de forma asincrona y con
         temporizadores vivos, y eso tumbaria las pruebas siguientes. */
      let informe = null, ok = false;
      try {
        execFileSync(process.execPath, [HUMO, tmp], { stdio: 'pipe' });
        ok = true;
      } catch (e) {
        try { informe = JSON.parse(String(e.stdout || '')); } catch (x) { informe = null; }
      }
      /* Si falla, que se lea POR QUE: un "esperaba true, obtuvo false" delante
         de un zip de 280 KB no le sirve a nadie. */
      s.eq(z + ': arranca y lee la sesion de Instagram',
        ok ? [] : (informe && informe.motivos) || ['la prueba de humo no ha dejado informe'], []);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  /* Y que el empaquetador siga poniendo un prefijo distinto a cada fichero,
     que es lo unico que impide la colision. */
  const emp = fs.readFileSync(path.join(PRO, 'tools', 'empaquetar-pro.js'), 'utf8');
  s.ok('cada fichero se ofusca con su propio prefijo',
    /'--identifiers-prefix', 'gh' \+ \(ghSufijo\+\+\) \+ '_'/.test(emp));
  s.ok('la version del ofuscador esta fijada, o el zip no es reproducible',
    /javascript-obfuscator@\d+\.\d+\.\d+/.test(emp));
  s.ok('y no se empaqueta nada que no arranque',
    /humo\.js/.test(emp) && /No se empaqueta/.test(emp));

  /* La guarda de la guarda: que la prueba de humo sepa fallar. Se le da un
     paquete con dos ficheros que declaran la misma funcion global, que es
     exactamente la forma del fallo real. */
  const falso = fs.mkdtempSync(path.join(os.tmpdir(), 'gfalso-'));
  try {
    fs.mkdirSync(path.join(falso, 'src'));
    fs.writeFileSync(path.join(falso, 'manifest.json'), JSON.stringify({
      manifest_version: 3, name: 'x', version: '1.0.0',
      content_scripts: [{ matches: ['https://www.instagram.com/*'], js: ['src/a.js', 'src/b.js'] }],
    }));
    /* a.js define su tabla y la usa; b.js la machaca con otra. Es el fallo. */
    fs.writeFileSync(path.join(falso, 'src', 'a.js'),
      'function tabla(){return["ds_user_id"]}\n' +
      'self.GhostedIG={getUserId:function(){var n=tabla()[0];' +
      'var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?m[1]:null}};\n' +
      'self.GhostedI18n={t:function(k){return k==="unlock_activate"?"Activar":k}};\n' +
      'self.GhostedStore={};self.GhostedBuild={};self.GhostedLicense={};self.GhostedConfig={};\n');
    fs.writeFileSync(path.join(falso, 'src', 'b.js'), 'function tabla(){return["otra_cosa"]}\n');
    let cazado = false;
    try { execFileSync(process.execPath, [HUMO, falso], { stdio: 'pipe' }); }
    catch (e) { cazado = true; }
    s.ok('la prueba de humo caza la colision que rompio el producto', cazado);
  } finally {
    fs.rmSync(falso, { recursive: true, force: true });
  }

  return s;
};

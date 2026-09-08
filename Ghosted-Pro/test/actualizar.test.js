'use strict';
/* Como actualiza quien ya ha pagado.
 *
 * La extension se instala descomprimida, asi que Chrome NUNCA la actualiza
 * sola. La unica via es que el comprador vuelva con su clave. Durante un
 * tiempo el aviso de "hay version nueva -> Descargar" apuntaba a la pagina de
 * precios: a quien ya habia pagado se le mandaba a comprar otra vez, y no
 * existia ninguna pagina donde meter la clave y bajarse la ultima version.
 *
 * Esto vigila las tres piezas: la pagina, el endpoint y el correo. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (f) => fs.readFileSync(path.join(WEB, f), 'utf8');

function fingirRes() {
  const r = { statusCode: null, cuerpo: null, cabeceras: {} };
  r.setHeader = (k, v) => { r.cabeceras[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (p) => { r.cuerpo = p; return r; };
  r.end = () => r;
  return r;
}

module.exports = async () => {
  const s = suite('actualizar · el camino del que ya pago');

  // ---- la pagina existe y hace lo suyo
  const pagina = leer('actualizar.html');
  s.ok('existe /actualizar', pagina.length > 0);
  s.ok('descarga con la clave, no con la sesion', pagina.includes("'/api/download?key=' + encodeURIComponent(k)"));
  s.ok('la clave va escapada en la URL', pagina.includes('encodeURIComponent(k)'));
  s.ok('acepta la clave en el enlace, para venir del aviso', pagina.includes("params.get('key')"));
  s.ok('dice que version se va a llevar', pagina.includes("fetch('/api/status')"));
  s.ok('enlaza la guia de instalacion', pagina.includes('href="/instalar"'));
  s.ok('y la recuperacion de clave', pagina.includes('href="/recuperar"'));
  s.ok('no se indexa', /name="robots" content="noindex/.test(pagina));
  s.ok('los locales van sellados, o se cachean para siempre', /locales\/' \+ lang \+ '\.json\?v=\d+/.test(pagina));

  const formato = pagina.match(/\/\^GHST-[^/]+\/\.test\(k\)/);
  s.ok('valida el formato de la clave antes de ir al servidor', !!formato);

  // ---- los textos estan en los doce idiomas
  const CLAVES = ['up_h1', 'up_sub', 'up_go', 'up_note', 'up_guide', 'up_lost',
    'up_bad', 'up_going', 'up_e404', 'up_e403', 'up_e429', 'up_efail'];
  for (const k of CLAVES) s.ok(`la pagina trae el ingles de ${k}`, new RegExp('\\b' + k + ':').test(pagina));
  const idiomas = fs.readdirSync(path.join(WEB, 'locales')).filter((f) => f.endsWith('.json'));
  s.eq('hay once idiomas ademas del ingles', idiomas.length, 11);
  for (const f of idiomas) {
    const d = JSON.parse(leer(path.join('locales', f)));
    const faltan = CLAVES.filter((k) => !d[k]);
    s.eq(`${f}: no falta ningun texto de actualizar`, faltan, []);
  }

  // ---- el endpoint no le suelta un JSON en la cara a nadie
  const descarga = require(path.join(WEB, 'api', 'download.js'));
  const pedir = async (query, accept) => {
    const res = fingirRes();
    await descarga({ method: 'GET', headers: accept ? { accept } : {}, query, socket: {} }, res);
    return res;
  };
  const HTML = 'text/html,application/xhtml+xml';

  {
    const r = await pedir({}, HTML);
    s.eq('entrar a pelo devuelve al formulario', r.statusCode, 302);
    s.eq('sin frase de error, que no ha fallado nada', r.cabeceras.Location, '/actualizar');
  }
  {
    const r = await pedir({ key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE' }, HTML);
    /* Sin almacen configurado esto es un 503, no un 404: lo que importa es que
       sea una redireccion con su codigo y no un JSON a pantalla completa. */
    s.eq('una clave que no se puede comprobar redirige', r.statusCode, 302);
    s.ok('con el codigo para traducir el aviso', /^\/actualizar\?e=\d+$/.test(r.cabeceras.Location || ''));
    s.eq('y no se cachea el fallo', r.cabeceras['Cache-Control'], 'no-store');
    s.eq('el cuerpo no lleva JSON', r.cuerpo, null);
  }
  {
    const r = await pedir({ key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE' }, null);
    s.ok('quien llama por codigo sigue recibiendo JSON', r.statusCode !== 302);
    s.ok('con su error dentro', !!(r.cuerpo && r.cuerpo.error));
  }
  {
    const r = await pedir({ key: 'no-es-una-clave' }, HTML);
    s.eq('una clave con mala pinta tambien vuelve a la pagina', r.statusCode, 302);
  }
  s.ok('la redireccion nunca manda a la pagina de precios',
    !String(leer('api/download.js')).includes("'/#pricing'"));

  // ---- el correo lo dice
  const { correoLicencia } = require(path.join(WEB, 'lib', 'correo.js'));
  const correo = correoLicencia({
    key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE', producto: 'Pro', lang: 'es',
    urlDescarga: 'https://ghoosted.net/api/download?key=K', sitio: 'https://ghoosted.net',
  });
  s.ok('el correo enlaza la pagina de actualizar', correo.html.includes('https://ghoosted.net/actualizar'));
  s.ok('y tambien en la version de texto plano', correo.text.includes('https://ghoosted.net/actualizar'));

  const TEXTOS = leer('lib/correo.js');
  const cuantos = (TEXTOS.match(/^\s+upd:/gm) || []).length;
  s.eq('la frase de actualizar esta en los doce idiomas', cuantos, 12);
  s.eq('y su enlace tambien', (TEXTOS.match(/^\s+updLink:/gm) || []).length, 12);

  // ---- el aviso dentro de la extension
  const contenido = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');
  s.ok('el aviso de version usa la clave guardada', contenido.includes('/actualizar?key='));
  s.ok('y solo cae en buyUrl si no hay licencia', /let gA = x\.buyUrl;/.test(contenido));

  return s;
};

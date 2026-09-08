'use strict';
/* La extensión se instala descomprimida, así que el navegador no la actualiza
 * nunca. Este aviso es la única vía para avisar a quien ya ha pagado. El texto
 * llega del servidor, así que lo importante es que no pueda inyectar nada. */
const { leer, funciones, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('aviso de versión');
  const codigo = funciones(leer('content.js'), ['ghdVerCmp', 'ghdBanner']);

  const montarCon = (estado, versionInstalada, visto = '', licencia = null) => {
    const almacen = { updSeen: visto };
    const panel = { hijos: [], insertado: null,
      querySelector: (sel) => (sel === '.ghd-head' ? { nextSibling: {} } : null),
      insertBefore(el) { panel.insertado = el; }, appendChild(el) { panel.insertado = el; } };
    const crear = () => { const e = { className: '', textContent: '', href: '', hijos: [],
      appendChild(c) { this.hijos.push(c); }, addEventListener() {}, remove() {} }; return e; };
    const api = montar(codigo, {
      m: panel,
      g: { get: (k, d) => (almacen[k] !== undefined ? almacen[k] : d), set: (k, v) => { almacen[k] = v; } },
      J: { updSeen: 'updSeen' },
      Y: (k, a) => (a ? k + ':' + a : k),
      x: { buyUrl: 'https://ghoosted.net/#pricing', appUrl: 'https://ghoosted.net' },
      q: { getLicense: () => licencia },
      GhostedI18n: { locale: 'es' },
      chrome: { runtime: { getManifest: () => ({ version: versionInstalada }) } },
      document: { createElement: crear },
      ghdStatus: estado,
    }, '{ghdVerCmp,ghdBanner}');
    return { api, panel, almacen };
  };
  const texto = (p) => (p.insertado ? p.insertado.hijos.map((h) => h.textContent).filter(Boolean).join(' | ') : null);

  s.eq('1.55.0 es mayor que 1.54.0', montarCon(null, '1.0.0').api.ghdVerCmp('1.55.0', '1.54.0'), 1);
  s.eq('compara por número, no por texto', montarCon(null, '1.0.0').api.ghdVerCmp('1.9.0', '1.10.0'), -1);
  s.eq('iguales', montarCon(null, '1.0.0').api.ghdVerCmp('1.54.0', '1.54.0'), 0);

  { const { api, panel } = montarCon({ latest: '1.55.0', minimum: '1.51.0', notice: null }, '1.54.0');
    api.ghdBanner();
    s.ok('avisa de que hay versión nueva', String(texto(panel)).includes('upd_new:1.55.0'));
    s.ok('y ofrece descargarla', panel.insertado.hijos.some((h) => h.textContent === 'upd_get')); }

  { const { api, panel } = montarCon({ latest: '1.55.0', minimum: '1.51.0', notice: null }, '1.55.0');
    api.ghdBanner();
    s.eq('si ya estás al día no molesta', panel.insertado, null); }

  { const { api, panel } = montarCon({ latest: '1.55.0', minimum: '1.55.0', notice: null }, '1.51.0');
    api.ghdBanner();
    s.ok('por debajo del mínimo avisa de que está rota', String(texto(panel)).includes('upd_forced'));
    s.eq('y ese aviso no se puede descartar', panel.insertado.hijos.some((h) => h.textContent === '×'), false); }

  { const { api, panel } = montarCon({ latest: '1.54.0', minimum: '1.51.0',
      notice: { id: 'a1', level: 'warn', text: { es: 'Instagram ha cambiado algo', en: 'Instagram changed' } } }, '1.54.0');
    api.ghdBanner();
    s.eq('muestra el aviso remoto en tu idioma', panel.insertado.hijos[0].textContent, 'Instagram ha cambiado algo');
    s.ok('y se puede descartar', panel.insertado.hijos.some((h) => h.textContent === '×')); }

  { const { api, panel } = montarCon({ latest: '1.54.0', minimum: '1.51.0',
      notice: { id: 'a1', level: 'info', text: { en: 'only english' } } }, '1.54.0');
    api.ghdBanner();
    s.eq('si no hay traducción tira del inglés', panel.insertado.hijos[0].textContent, 'only english'); }

  { const { api, panel } = montarCon({ latest: '1.55.0', minimum: '1.51.0', notice: null }, '1.54.0', 'ver:1.55.0');
    api.ghdBanner();
    s.eq('lo descartado no vuelve a salir', panel.insertado, null); }

  { const { api, panel } = montarCon({ latest: '1.56.0', minimum: '1.51.0', notice: null }, '1.54.0', 'ver:1.55.0');
    api.ghdBanner();
    s.ok('pero una versión más nueva sí', String(texto(panel)).includes('upd_new:1.56.0')); }

  // seguridad: el texto llega de fuera
  { const { api, panel } = montarCon({ latest: '1.54.0', minimum: '1.51.0',
      notice: { id: 'x', level: 'info', text: { es: '<img src=x onerror=alert(1)>' } } }, '1.54.0');
    api.ghdBanner();
    const nodo = panel.insertado.hijos[0];
    s.eq('el texto remoto se pinta como texto, nunca como html', nodo.textContent, '<img src=x onerror=alert(1)>');
    s.eq('y no se escribe en innerHTML', nodo.innerHTML, undefined); }

  { const { api, panel } = montarCon({ latest: '9.9.9', minimum: '1.51.0', notice: null, url: 'https://evil.com' }, '1.54.0');
    api.ghdBanner();
    const enlace = panel.insertado.hijos.find((h) => h.href);
    s.eq('el enlace es el nuestro, no el que diga la respuesta', enlace.href, 'https://ghoosted.net/#pricing'); }

  /* Lo importante de verdad: a quien ya ha pagado, "Descargar" NO puede
     llevarle a la pagina de precios. Le mandaba a comprar por segunda vez. */
  const nueva = { latest: '1.55.0', minimum: '1.51.0', notice: null };
  const destino = (p) => { const e = p.insertado.hijos.find((h) => h.href); return e ? e.href : null; };

  { const { api, panel } = montarCon(nueva, '1.54.0', '', { valid: true, key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE' });
    api.ghdBanner();
    s.eq('con licencia, descargar lleva a actualizar con la clave puesta',
      destino(panel), 'https://ghoosted.net/actualizar?key=GHST-AAAA-BBBB-CCCC-DDDD-EEEE');
    s.eq('y nunca a la pagina de precios', destino(panel).includes('#pricing'), false); }

  { const { api, panel } = montarCon(nueva, '1.54.0', '', null);
    api.ghdBanner();
    s.eq('sin licencia sigue llevando a comprar', destino(panel), 'https://ghoosted.net/#pricing'); }

  { const { api, panel } = montarCon(nueva, '1.54.0', '', { valid: false, key: '' });
    api.ghdBanner();
    s.eq('una licencia sin clave no rompe el enlace', destino(panel), 'https://ghoosted.net/#pricing'); }

  { const { api, panel } = montarCon(nueva, '1.54.0', '', { key: 'A B&C=D' });
    api.ghdBanner();
    s.eq('la clave va escapada, no puede colar parametros',
      destino(panel), 'https://ghoosted.net/actualizar?key=A%20B%26C%3DD'); }

  { const { api, panel } = montarCon({ latest: '1.55.0', minimum: '1.55.0', notice: null }, '1.51.0', '',
      { valid: true, key: 'GHST-AAAA-BBBB-CCCC-DDDD-EEEE' });
    api.ghdBanner();
    s.eq('tambien en el aviso de version rota',
      destino(panel), 'https://ghoosted.net/actualizar?key=GHST-AAAA-BBBB-CCCC-DDDD-EEEE'); }
  return s;
};

'use strict';
/* Tres piezas de interfaz con lógica propia: el botón de vigilar (que hacía
 * una cosa y pintaba otra), la gráfica (que inventaba tendencias) y el
 * tiempo restante de la pantalla de carga. */
const { leer, funcion, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('interfaz · vigilar, gráfica y tiempo restante');
  const src = leer('content.js');

  // --- botón de vigilar: no puede pintar antes de que termine el guardado ---
  const { tramo } = require('./lib/extraer');
  const codigoBoton = "const gf=document.createElement('button');gf.className='dos-act';"
    + tramo(src, 'const gs = () => {', '}, gs(), gc.appendChild(gf);') + '};gs();';

  const montarBoton = () => {
    let lista = []; const log = [];
    const clases = new Set();
    const api = montar(codigoBoton, {
      Y6: () => lista.slice(),
      t5: async (o) => { await new Promise((r) => setTimeout(r, 20)); lista.push(o); log.push('añadir'); },
      t2: async (pk) => { await new Promise((r) => setTimeout(r, 20)); lista = lista.filter((x) => x.pk !== pk); log.push('quitar'); },
      Y: (k) => k,
      document: { createElement: () => ({ className: '', textContent: '', disabled: false,
        classList: { toggle(c, v) { v ? clases.add(c) : clases.delete(c); } } }) },
      gq: { pk: '9', username: 'lau' },
      setTimeout,
    }, '{gf,gs}');
    return { gf: api.gf, log, vigilando: () => lista.some((x) => x.pk === '9'), clases };
  };

  // --- gráfica: dos muestras con minutos de diferencia no son una tendencia ---
  const th = montar(funcion(src, 'th'), {
    g: { get: () => ({ 7: MUESTRAS }) }, J: { spyCounts: 'spyCounts' },
    Y: (k, a) => (a ? k + ':' + a : k),
    document: { createElement: () => ({ className: '', textContent: '', innerHTML: '', hijos: [],
      appendChild(c) { this.hijos.push(c); }, insertAdjacentHTML(p, h) { this.svg = (this.svg || '') + h; } }) },
  }, 'th');
  let MUESTRAS = [];
  const H = 36e5, D = 24 * H;
  const grafica = (n, span, vals) => {
    const ahora = Date.now();
    MUESTRAS = Array.from({ length: n }, (_, k) => ({ ts: ahora - span + k * (span / (n - 1 || 1)), followers: vals[k] }));
    const el = th('7', { followers: 1050 });
    return { texto: el.hijos.map((h) => h.textContent).filter(Boolean).join(' | '), linea: !!el.svg };
  };

  // --- tiempo restante ---
  const eta = (t0) => montar(funcion(src, 'ghdLoadEta'), {
    Y: (k, a) => k + ':' + a, Date: { now: () => AHORA }, ghdLoadT0: AHORA - t0, Math,
  }, 'ghdLoadEta');
  const AHORA = Date.now();

  return (async () => {
    const { gf, log, vigilando, clases } = montarBoton();
    s.eq('empieza sin vigilar', [gf.textContent, vigilando()], ['dos_watch', false]);
    await gf.onclick();
    s.eq('un clic lo vigila', vigilando(), true);
    s.eq('y el botón ya lo dice', gf.textContent, 'dos_watching');
    s.eq('se marca visualmente', clases.has('watching'), true);
    await gf.onclick();
    s.eq('otro clic deja de vigilar', vigilando(), false);
    s.eq('cada clic hace una sola cosa', log, ['añadir', 'quitar']);
    const b2 = montarBoton();
    b2.gf.onclick(); await b2.gf.onclick();
    await new Promise((r) => setTimeout(r, 60));
    s.eq('doble clic rápido no duplica', b2.log, ['añadir']);

    const corta = grafica(2, 8 * 60000, [1061, 1050]);
    s.eq('con minutos de recorrido no inventa tendencia', corta.texto.includes('-11'), false);
    s.eq('avisa de que falta historial', corta.texto.includes('dos_graph_soon'), true);
    s.eq('y no dibuja la línea', corta.linea, false);
    s.eq('seis horas siguen sin bastar', grafica(3, 6 * H, [1060, 1055, 1050]).texto.includes('dos_graph_soon'), true);
    const larga = grafica(4, 5 * D, [1061, 1058, 1054, 1050]);
    s.eq('con cinco días da la cifra', larga.texto.includes('-11'), true);
    s.eq('y dice desde cuándo', larga.texto.includes('dos_since_from:'), true);
    s.eq('y dibuja la línea', larga.linea, true);
    s.eq('si sube lo marca con más', grafica(3, 3 * D, [1000, 1010, 1020]).texto.includes('+20'), true);

    s.eq('estima con el ritmo real', eta(180000)(30, 159), 'load_eta:load_min:13');
    s.eq('cerca del final, en minutos', eta(600000)(100, 110), 'load_eta:load_min:1');
    s.eq('menos de un minuto, en segundos', eta(590000)(100, 110), 'load_eta:load_sec:59');
    s.eq('con una sola hecha no estima', eta(180000)(1, 159), '');
    s.eq('sin total no estima', eta(180000)(30, 0), '');
    s.eq('recién empezado no estima', eta(500)(30, 159), '');
    s.eq('al terminar no sobra nada', eta(180000)(159, 159), '');
    return s;
  })();
};

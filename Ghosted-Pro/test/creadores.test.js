'use strict';
/* El programa de creadores.
 *
 * Lo unico que de verdad importa aqui es la ATRIBUCION: que la venta que trae
 * un creador se le apunte a el, y por el importe que Stripe cobro de verdad.
 * Un programa de afiliados con la atribucion rota no es un programa a medias:
 * es una promesa de dinero que no se cumple, y eso se paga con la reputacion.
 *
 * Asi que se comprueban las tres piezas de la cadena — la portada que captura
 * el ?ref, el checkout que lo sella en Stripe, y el webhook que lo apunta — y
 * ademas se ejecuta la logica de verdad contra un almacen de mentira. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const WEB = path.resolve(__dirname, '..', '..', 'Ghosted-Landing');
const leer = (rel) => fs.readFileSync(path.join(WEB, rel), 'utf8');

/* Un Upstash de mentira, para poder ejercitar alta/venta/numeros de verdad en
   vez de leer el fichero y confiar. */
function conAlmacen() {
  const datos = new Map();
  const kv = path.join(WEB, 'lib', 'kv.js');
  const cre = path.join(WEB, 'lib', 'creadores.js');
  delete require.cache[require.resolve(cre)];
  require.cache[require.resolve(kv)] = {
    id: kv, filename: kv, loaded: true, exports: {
      ConfigError: class ConfigError extends Error {},
      isConfigured: () => true,
      getJson: async (k) => (datos.has(k) ? JSON.parse(datos.get(k)) : null),
      setJson: async (k, v) => { datos.set(k, JSON.stringify(v)); },
      command: async (arr) => {
        const [op, k, v] = arr;
        if (op === 'INCR') { const n = Number(datos.get(k) || 0) + 1; datos.set(k, String(n)); return n; }
        if (op === 'INCRBY') { const n = Number(datos.get(k) || 0) + Number(v); datos.set(k, String(n)); return n; }
        if (op === 'GET') return datos.has(k) ? datos.get(k) : null;
        if (op === 'SADD') return 1;
        return null;
      },
    },
  };
  const creadores = require(cre);
  return { creadores, datos, soltar: () => { delete require.cache[require.resolve(kv)]; delete require.cache[require.resolve(cre)]; } };
}

module.exports = async () => {
  const s = suite('programa de creadores');
  const { creadores, soltar } = conAlmacen();

  /* 1 · el codigo */
  s.eq('el codigo se limpia y se pone en mayusculas', creadores.normalizar(' mi-codigo 9 '), 'MICODIGO9');
  s.eq('se corta a doce', creadores.normalizar('ABCDEFGHIJKLMNOP').length, 12);
  s.eq('tres letras no valen', creadores.valido('ABC'), false);
  s.eq('cuatro si', creadores.valido('ABCD'), true);
  s.eq('con simbolos no', creadores.valido('AB-CD'), false);

  /* 2 · el tramo de comision */
  s.eq('por debajo del salto, el porcentaje base', creadores.tramo(creadores.SALTO - 1), creadores.BASE);
  s.eq('en el salto, el de arriba', creadores.tramo(creadores.SALTO), creadores.TOP);
  s.ok('y los dos son los que dice la web', creadores.BASE === 30 && creadores.TOP === 40);

  /* 3 · la cadena entera, ejecutada */
  s.eq('un codigo que no existe no acepta ventas', await creadores.venta('NOEXISTE', 700), false);
  const alta = await creadores.alta({ nombre: 'Ana', email: 'ana@ejemplo.com', canal: '@ana', codigo: 'ana99' });
  s.eq('el alta normaliza el codigo', alta.codigo, 'ANA99');
  s.eq('y no deja repetirlo', (await creadores.alta({ email: 'otro@ejemplo.com', codigo: 'ANA99' })).error, 'ocupado');
  s.eq('ni con un correo con mala pinta', (await creadores.alta({ email: 'noesuncorreo', codigo: 'OTRO1' })).error, 'email');

  await creadores.visita('ANA99');
  await creadores.visita('ANA99');
  await creadores.venta('ANA99', 700);
  await creadores.venta('ANA99', 500);
  const n = await creadores.numeros('ANA99');
  s.eq('cuenta las visitas', n.visitas, 2);
  s.eq('cuenta las ventas', n.ventas, 2);
  s.eq('suma lo facturado en centimos', n.facturadoCentimos, 1200);
  /* En coma flotante, 30% de 7,00 no da 2,10 exacto: al sumar un mes de
     ventas las cuentas dejan de cuadrar y el creador ve un numero que no es. */
  s.eq('la comision sale en centimos enteros', n.comisionCentimos, 360);
  s.eq('y con el porcentaje del tramo', n.porcentaje, creadores.BASE);
  s.eq('un alta recien hecha esta pendiente', n.estado, 'pendiente');

  /* Lo que el panel NO puede enseñar: el codigo es la unica credencial, asi
     que quien lo tenga vera numeros — pero jamas quien compro. */
  const fuera = ['email', 'customerEmail', 'clave', 'key', 'licencias'];
  s.eq('el panel no filtra datos de compradores', fuera.filter((k) => k in n), []);
  soltar();

  /* 4 · la portada captura el ?ref y lo manda con la compra */
  const app = leer('app.js');
  s.ok('la portada lee el ?ref de la url', /new URLSearchParams\(location\.search\)\.get\('ref'\)/.test(app));
  s.ok('lo guarda para toda la sesion', /localStorage\.setItem\(GUARDA, enUrl\)/.test(app));
  /* Sin esto, recargar veinte veces le infla las visitas a cualquiera. */
  s.ok('y solo cuenta la visita una vez por navegador', /ghosted_ref_visto_/.test(app));
  s.ok('el codigo viaja con la compra', /ref: window\.ghdRef \|\| ''/.test(app));

  /* 5 · el checkout lo sella en Stripe, que es lo que lo hace real */
  const checkout = leer('api/checkout.js');
  s.ok('el checkout sella el codigo en la sesion de Stripe', /'metadata\[ref\]': ref/.test(checkout));
  /* Basura en el ?ref no puede tumbar una compra: se ignora y se cobra igual. */
  s.ok('y si el codigo tiene mala pinta, se ignora en vez de fallar',
    /refValido\(refBruto\) \? refBruto : ''/.test(checkout));

  /* 6 · el webhook lo apunta, y por el importe de verdad */
  const lic = leer('lib/licenses.js');
  s.ok('la licencia guarda de quien vino la venta', /ref: \(session\.metadata && session\.metadata\.ref\) \|\| null/.test(lic));
  /* amount_total, no el precio de catalogo: con un cupon o en otra divisa no
     son lo mismo, y la comision se paga sobre lo cobrado. */
  s.ok('la comision se calcula sobre lo que Stripe cobro',
    /creadores\.venta\(record\.ref, session\.amount_total\)/.test(lic));
  s.ok('y si eso falla, la compra sigue adelante',
    /try \{ await creadores\.venta[\s\S]{0,120}catch \(e\) \{/.test(lic));

  /* 7 · la pagina */
  const pag = leer('creadores.html');
  s.ok('existe la pagina del programa', pag.length > 0);
  s.ok('con el formulario de alta', /id="alta"/.test(pag));
  s.ok('y el panel para ver tus numeros', /id="ver"/.test(pag) && /id="numeros"/.test(pag));
  s.ok('no se pide contraseña en ningun sitio', !/type="password"/.test(pag));

  /* 8 · los doce idiomas */
  const CLAVES = ['cr_h1', 'cr_sub', 'cr_g1', 'cr_g4', 'cr_join', 'cr_have', 'cr_see',
    'cr_visits', 'cr_sales', 'cr_owed', 'cr_ph_code', 'cr_taken', 'cr_pending'];
  const idiomas = fs.readdirSync(path.join(WEB, 'locales')).filter((f) => f.endsWith('.json'));
  s.eq('once idiomas ademas del ingles', idiomas.length, 11);
  for (const f of idiomas) {
    const d = JSON.parse(leer(path.join('locales', f)));
    s.eq(f + ': no falta ningun texto del programa', CLAVES.filter((k) => !d[k]), []);
  }
  for (const k of CLAVES) s.ok('el ingles de ' + k + ' esta en la pagina', pag.indexOf(k) !== -1);

  return s;
};

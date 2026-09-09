'use strict';
/* ===========================================================================
   PROGRAMA DE CREADORES
   ---------------------------------------------------------------------------
   Un creador se da de alta, recibe un codigo, y reparte ghoosted.net/?ref=SU
   CODIGO. Cada visita con ese ?ref se le apunta, y cada compra que salga de
   ahi tambien — porque el codigo viaja como metadata de la sesion de Stripe,
   igual que ya viajaban el plan y el idioma, y el webhook lo lee al emitir la
   licencia.

   Eso es lo que hace que esto no sea un folleto: la atribucion es la misma
   tuberia por la que ya pasa el dinero, no un contador aparte que hay que
   creerse.

   Lo que NO hace, a proposito:
     · no paga solo — las transferencias las hace una persona mirando el panel
     · no tiene sesion ni contraseña. El codigo ES la credencial, y por eso el
       panel solo enseña numeros: cuantas visitas, cuantas ventas y cuanto se
       le debe. Nunca quien compro, ni su correo, ni su clave.
   =========================================================================== */
const { command, getJson, setJson } = require('./kv');

/* Cinco a doce caracteres, mayusculas y numeros. Corto para decirlo en un
   video, largo para no chocar con el de otro. */
const CODIGO = /^[A-Z0-9]{4,12}$/;

/* Comision. Se puede mover sin tocar codigo: el porcentaje que se enseña en la
   web y el que se calcula salen los dos de aqui. */
const BASE = Number(process.env.CREATOR_RATE || 30);
const TOP = Number(process.env.CREATOR_RATE_TOP || 40);
const SALTO = Number(process.env.CREATOR_TOP_AFTER || 25);

const kAlta = (c) => 'ghosted:creador:' + c;
const kVisitas = (c) => 'ghosted:creador:' + c + ':visitas';
const kVentas = (c) => 'ghosted:creador:' + c + ':ventas';
const kEuros = (c) => 'ghosted:creador:' + c + ':centimos';

function normalizar(v) {
  return String(v == null ? '' : v).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}
function valido(c) { return CODIGO.test(c); }

/* El porcentaje que le toca a este creador ahora mismo. */
function tramo(ventas) { return Number(ventas) >= SALTO ? TOP : BASE; }

/* Una visita con ?ref. Falla en silencio: perder un contador no puede tumbar
   la portada de nadie. */
async function visita(codigo) {
  const c = normalizar(codigo);
  if (!valido(c)) return false;
  try {
    if (!(await getJson(kAlta(c)))) return false;   // codigo que no existe
    await command(['INCR', kVisitas(c)]);
    return true;
  } catch (e) { return false; }
}

/* Una venta. La llama el webhook al emitir la licencia, con el importe que
   Stripe dice que se cobro de verdad — no el precio de catalogo, que con un
   cupon o con otra divisa no es el mismo. */
async function venta(codigo, centimos) {
  const c = normalizar(codigo);
  if (!valido(c)) return false;
  try {
    if (!(await getJson(kAlta(c)))) return false;
    await command(['INCR', kVentas(c)]);
    const n = Math.max(0, Math.round(Number(centimos) || 0));
    if (n) await command(['INCRBY', kEuros(c), String(n)]);
    return true;
  } catch (e) { return false; }
}

/* Lo que ve el creador en su panel. Numeros y nada mas. */
async function numeros(codigo) {
  const c = normalizar(codigo);
  if (!valido(c)) return null;
  const alta = await getJson(kAlta(c));
  if (!alta) return null;
  const leer = async (k) => Number(await command(['GET', k])) || 0;
  const [visitas, ventas, centimos] = await Promise.all([leer(kVisitas(c)), leer(kVentas(c)), leer(kEuros(c))]);
  const pct = tramo(ventas);
  return {
    codigo: c,
    nombre: alta.nombre || null,
    estado: alta.estado || 'pendiente',
    visitas,
    ventas,
    /* Facturado por Stripe en esas ventas, y lo que de eso le toca. En
       centimos hasta el ultimo momento: en coma flotante, 30% de 7,00 no da
       2,10 exacto y las cuentas dejan de cuadrar al sumarlas. */
    facturadoCentimos: centimos,
    comisionCentimos: Math.round(centimos * pct / 100),
    porcentaje: pct,
    siguienteTramo: pct === BASE ? { desde: SALTO, porcentaje: TOP } : null,
  };
}

/* Alta. No se acepta sola: queda pendiente hasta que alguien la mira, porque
   un codigo es dinero y cualquiera puede rellenar un formulario. */
async function alta({ nombre, email, canal, seguidores, codigo }) {
  const c = normalizar(codigo);
  if (!valido(c)) return { ok: false, error: 'codigo' };
  const correo = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) return { ok: false, error: 'email' };
  if (await getJson(kAlta(c))) return { ok: false, error: 'ocupado' };
  const registro = {
    codigo: c,
    nombre: String(nombre || '').trim().slice(0, 80),
    email: correo.slice(0, 120),
    canal: String(canal || '').trim().slice(0, 120),
    seguidores: String(seguidores || '').trim().slice(0, 40),
    estado: 'pendiente',
    creado: new Date().toISOString(),
  };
  await setJson(kAlta(c), registro);
  try { await command(['SADD', 'ghosted:creadores', c]); } catch (e) { /* el indice es comodidad */ }
  return { ok: true, codigo: c };
}

module.exports = { CODIGO, BASE, TOP, SALTO, normalizar, valido, tramo, visita, venta, numeros, alta };

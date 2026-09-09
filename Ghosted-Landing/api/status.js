const fs = require('fs');
const path = require('path');
const { json, options } = require('../lib/http');
const { filePath } = require('../lib/downloads');
const { PRECIOS } = require('../lib/precios');

/* Por que no se ha podido leer el precio, en una palabra. Sin el texto de
   Stripe: ese mensaje lleva el id de la cuenta y el final de la clave, y esto
   lo puede pedir cualquiera. Un codigo corto dice lo mismo para decidir que
   tocar, y no regala nada. */
function motivo(d, estado) {
  const e = (d && d.error) || {};
  const t = String(e.message || '');
  if (/does not have the required permissions|plan_read/i.test(t)) return 'la_clave_no_puede_leer_precios';
  if (/No such price|resource_missing/i.test(t) || e.code === 'resource_missing') return 'ese_precio_no_existe';
  if (estado === 401) return 'clave_no_valida';
  return e.type ? String(e.type).slice(0, 40) : 'http_' + estado;
}

/* Lo que Stripe cobra de verdad por cada plan. Si no hay claves, o Stripe no
   contesta, se dice que no se ha podido mirar — nunca se inventa un "coincide"
   que nadie ha comprobado. */
async function precios() {
  const clave = process.env.STRIPE_SECRET_KEY;
  const ids = { pro: process.env.STRIPE_PRICE_ID, plus: process.env.STRIPE_PRICE_ID_PLUS };
  const salida = { web: PRECIOS, stripe: {}, coinciden: null };
  if (!clave) return Object.assign(salida, { error: 'sin_clave_de_stripe' });
  for (const [plan, id] of Object.entries(ids)) {
    if (!id) { salida.stripe[plan] = { error: 'falta_la_variable_de_entorno' }; continue; }
    try {
      const r = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(id), {
        headers: { Authorization: 'Bearer ' + clave },
      });
      const d = await r.json();
      if (r.ok && typeof d.unit_amount === 'number') {
        salida.stripe[plan] = { centimos: d.unit_amount, divisa: d.currency, activo: d.active !== false };
      } else {
        /* El motivo, pero NUNCA el texto que manda Stripe: ese mensaje trae
           el identificador de la cuenta y el final de la clave, y esto es un
           endpoint publico. Se traduce a un codigo corto, que es lo unico que
           hace falta para saber que arreglar. */
        salida.stripe[plan] = { error: motivo(d, r.status) };
      }
    } catch (e) { salida.stripe[plan] = { error: 'sin_red' }; }
  }
  const mira = Object.keys(PRECIOS).map((p) => {
    const s = salida.stripe[p];
    return s && typeof s.centimos === 'number' ? s.centimos === PRECIOS[p] : null;
  });
  salida.coinciden = mira.some((v) => v === null) ? null : mira.every(Boolean);
  return salida;
}

/* Canal de avisos hacia las extensiones ya instaladas.
 *
 * Se cargan en modo desarrollador, así que Chrome nunca las actualiza solo:
 * `update_url` no hace nada con una extensión descomprimida. Lo único que se
 * puede hacer es que ella pregunte y avise al usuario. Este endpoint es esa
 * pregunta.
 *
 * `minimum` es el corte: por debajo de esa versión la extensión avisa de que
 * está rota de verdad, no de que hay una nueva. Sirve como interruptor cuando
 * Instagram cambia algo y las versiones viejas dejan de funcionar. */
const RUTAS = ['lib/status.json', '../lib/status.json', '/var/task/lib/status.json'];

function leerEstado() {
  for (const r of RUTAS) {
    const p = path.isAbsolute(r) ? r : path.join(process.cwd(), r);
    try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* siguiente */ }
  }
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lib', 'status.json'), 'utf8')); } catch (e) { return null; }
}

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const estado = leerEstado();
  if (!estado) return json(res, 503, { error: 'status_unavailable' });
  /* `?salud=1` responde si los zip estan de verdad en el servidor. Vercel
     despliega clonando el repositorio, asi que un zip sin versionar
     desaparece sin avisar y la descarga revienta DESPUES de haber cobrado.
     Esto permite comprobarlo sin gastarse una compra. No expone nada: solo
     dice si el fichero se puede leer. */
  if (req.query && req.query.salud) {
    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, {
      version: String(estado.latest || ''),
      pro: !!filePath('pro'),
      plus: !!filePath('plus'),
      /* Si las vias de entrega estan enchufadas. Solo si o no, nunca el valor:
         hasta que esto dice correo:true, la clave solo existe en la pantalla
         de gracias, y el comprador que cierre la pestaña se queda sin nada.
         Antes solo se sabia comprando. */
      correo: !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM),
      sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
      /* LO QUE LA WEB DICE CONTRA LO QUE STRIPE COBRA.
         Son dos verdades distintas: el precio esta escrito a mano en los
         textos, y el cargo sale de un identificador de precio de Stripe que
         vive en una variable de entorno. Cambiar una y olvidar la otra da el
         peor fallo de una tienda —anunciar un precio y cobrar otro—, y eso es
         una reclamacion al banco por compra. Aqui se comparan de un vistazo,
         sin tener que gastarse una compra para averiguarlo. */
      precios: await precios(),
    });
  }

  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  return json(res, 200, {
    latest: String(estado.latest || ''),
    minimum: String(estado.minimum || ''),
    notice: estado.notice && estado.notice.id ? {
      id: String(estado.notice.id),
      level: estado.notice.level === 'warn' ? 'warn' : 'info',
      text: estado.notice.text && typeof estado.notice.text === 'object' ? estado.notice.text : {},
    } : null,
  });
};

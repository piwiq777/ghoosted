const crypto = require('crypto');
const { json, options, readJson } = require('../../lib/http');
const { frenar } = require('../../lib/freno');
const { ConfigError, command } = require('../../lib/kv');
const { porEmail } = require('../../lib/licenses');
const { entregar } = require('../../lib/entrega');

/* Recuperar la clave.
 *
 * El caso real: se va la luz justo despues de pagar, o el comprador cierra la
 * pestaña antes de copiar nada. Sin esto, la unica via era el enlace con el
 * session_id de Stripe — que se ha perdido con la pestaña.
 *
 * Aqui se pide el correo con el que se pago y se vuelve a mandar la misma
 * clave a ESE correo. No se enseña nada en pantalla: si se enseñara, esto
 * seria una forma de sacar claves ajenas escribiendo correos al azar.
 *
 * Por lo mismo la respuesta es SIEMPRE la misma, haya compra o no. Si dijera
 * "ese correo no ha comprado", cualquiera podria usarlo para averiguar quien
 * es cliente. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  // Dos frenos. Por IP, contra quien pruebe correos en serie; y por correo,
  // para que esto no se convierta en una forma de inundarle el buzon a nadie.
  const freno = await frenar(req, 'recuperar', 5, 900);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });

  try {
    const body = await readJson(req).catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    // Respuesta identica tambien cuando el correo esta mal escrito.
    if (!EMAIL.test(email) || email.length > 254) return json(res, 200, { ok: true });

    const huella = crypto.createHash('sha256').update(email).digest('hex').slice(0, 32);
    let permitidoCorreo = true;
    try {
      const n = Number(await command(['INCR', 'ghosted:freno:recuperar-email:' + huella])) || 1;
      if (n === 1) await command(['EXPIRE', 'ghosted:freno:recuperar-email:' + huella, '3600']);
      permitidoCorreo = n <= 3;   // tres reenvios por hora y correo
    } catch (e) { /* falla abierto, como el resto de frenos */ }

    if (permitidoCorreo) {
      const fichas = await porEmail(email);
      // Quien compro Plus y luego Pro recibe las dos: son dos productos.
      for (const ficha of fichas) await entregar(ficha, { forzar: true });
    }
    return json(res, 200, { ok: true });
  } catch (error) {
    if (error instanceof ConfigError) return json(res, 503, { error: 'license_service_not_configured' });
    // Tampoco aqui se distingue: un 500 en el sitio justo tambien cuenta algo.
    console.error('recover_error', error && error.message);
    return json(res, 200, { ok: true });
  }
};

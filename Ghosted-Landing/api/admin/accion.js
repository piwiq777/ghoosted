const { json, options, readJson } = require('../../lib/http');
const { frenar } = require('../../lib/freno');
const { ConfigError, command, getJson, setJson } = require('../../lib/kv');
const { autorizado, configurado } = require('../../lib/admin');
const { entregar } = require('../../lib/entrega');

/* Las cuatro cosas que hay que poder hacer con una venta:
 *
 *   revocar    devuelto o fraude — la clave deja de activar y de descargar
 *   reactivar  deshacer lo anterior, porque revocar por error pasa
 *   soltar     desatarla de la cuenta de Instagram, para que el comprador
 *              pueda usarla en otra. Es la peticion de soporte mas comun
 *              (cambio de cuenta) y sin esto se resuelve a mano en el almacen
 *   reenviar   volver a mandar el correo con la clave
 *
 * Un reembolso de Stripe ya revoca solo (api/stripe-webhook.js). Esto es para
 * lo que no pasa por Stripe. */
const ACCIONES = new Set(['revocar', 'reactivar', 'soltar', 'reenviar']);
const CLAVE = /^GHST-(?:[A-Z0-9]{4}-){4}[A-Z0-9]{4}$/;

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  if (!configurado()) return json(res, 404, { error: 'no_encontrado' });

  const freno = await frenar(req, 'admin', 60, 600);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
  if (!autorizado(req)) return json(res, 401, { error: 'no_autorizado' });

  try {
    const body = await readJson(req).catch(() => ({}));
    const accion = String(body.accion || '');
    const key = String(body.key || '').trim().toUpperCase();
    if (!ACCIONES.has(accion)) return json(res, 400, { error: 'accion_desconocida' });
    if (!CLAVE.test(key)) return json(res, 400, { error: 'clave_mal_formada' });

    const ficha = await getJson('ghosted:license:' + key);
    if (!ficha) return json(res, 404, { error: 'no_existe' });

    if (accion === 'revocar' || accion === 'reactivar') {
      ficha.status = accion === 'revocar' ? 'revoked' : 'active';
      ficha[accion === 'revocar' ? 'revokedAt' : 'reactivatedAt'] = new Date().toISOString();
      await setJson('ghosted:license:' + key, ficha);
      return json(res, 200, { ok: true, estado: ficha.status });
    }

    if (accion === 'soltar') {
      /* Se borra el enganche, no la licencia: la proxima cuenta que la active
         se queda con ella. Queda anotado para poder ver si alguien pide esto
         cada semana, que ya no seria un cambio de cuenta. */
      await command(['DEL', 'ghosted:binding:' + key]);
      ficha.releases = (ficha.releases || []).concat(new Date().toISOString()).slice(-20);
      await setJson('ghosted:license:' + key, ficha);
      return json(res, 200, { ok: true, soltada: true, veces: ficha.releases.length });
    }

    // reenviar
    const salida = await entregar(ficha, { forzar: true });
    return json(res, 200, { ok: true, enviado: salida });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500,
      { error: error instanceof ConfigError ? 'almacen_no_configurado' : 'error' });
  }
};

const { json, options } = require('../../lib/http');
const { frenar } = require('../../lib/freno');
const { ConfigError } = require('../../lib/kv');
const { autorizado, configurado, licencias, atadaA, resumen } = require('../../lib/admin');

/* La lista de ventas. Solo lee. */
module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  // Sin token configurado el panel no existe, ni siquiera para decir que no.
  if (!configurado()) return json(res, 404, { error: 'no_encontrado' });

  const freno = await frenar(req, 'admin', 60, 600);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
  if (!autorizado(req)) return json(res, 401, { error: 'no_autorizado' });

  try {
    const { fichas, completo } = await licencias();
    fichas.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    // Se pide la cuenta atada de las que se van a enseñar, no de todas: es una
    // consulta por licencia y con muchas ventas se nota.
    const lista = [];
    for (const f of fichas.slice(0, 300)) {
      lista.push({
        key: f.key,
        plan: f.plan || 'pro',
        estado: f.status,
        email: f.customerEmail || null,
        telefono: f.customerPhone || null,
        idioma: f.lang || 'en',
        comprada: f.createdAt || null,
        activada: f.activatedAt || null,
        cuenta: await atadaA(f.key),
        enviado: f.sent || null,
        abuso: f.abuse || null,
        pago: f.paymentIntent || null,
      });
    }
    return json(res, 200, { resumen: resumen(fichas), licencias: lista, completo });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500,
      { error: error instanceof ConfigError ? 'almacen_no_configurado' : 'error' });
  }
};

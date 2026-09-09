'use strict';
/* Programa de creadores, en un solo endpoint. Tres cosas y ninguna mas:
 *
 *   GET  /api/creador?codigo=XXXX   los numeros de ese codigo
 *   POST /api/creador?accion=clic   una visita llegada con ?ref
 *   POST /api/creador?accion=alta   una solicitud para entrar
 *
 * No hay sesion ni contraseña: el codigo ES la credencial, y por eso lo unico
 * que sale de aqui son cuentas — visitas, ventas y euros. Nunca quien compro,
 * ni su correo, ni su clave. Un codigo filtrado deja ver numeros de otro, que
 * es molesto; que dejara ver compradores seria una brecha.
 */
const { json, options, readJson } = require('../lib/http');
const { frenar } = require('../lib/freno');
const { ConfigError } = require('../lib/kv');
const creadores = require('../lib/creadores');

module.exports = async (req, res) => {
  if (options(req, res)) return;
  const q = req.query || {};

  try {
    if (req.method === 'GET') {
      /* Consultar numeros: 120 cada 10 minutos por IP. Sin freno, esto es un
         probador de codigos: se averigua cuales existen a base de intentarlo. */
      const freno = await frenar(req, 'creador-ver', 120, 600);
      if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
      const n = await creadores.numeros(q.codigo);
      /* Misma respuesta para "no existe" y "mal escrito": distinguirlas
         convierte esto en un buscador de codigos ajenos. */
      if (!n) return json(res, 404, { error: 'no_encontrado' });
      res.setHeader('Cache-Control', 'no-store');
      return json(res, 200, n);
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

    if (q.accion === 'clic') {
      /* Una visita. Generoso de tope y sin cuerpo: es un ping. */
      const freno = await frenar(req, 'creador-clic', 60, 600);
      if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
      const body = await readJson(req);
      await creadores.visita(body.ref);
      /* Siempre 204, exista el codigo o no: si contestara distinto, este
         endpoint diria desde fuera que codigos hay dados de alta. */
      res.statusCode = 204;
      return res.end();
    }

    if (q.accion === 'alta') {
      const freno = await frenar(req, 'creador-alta', 8, 3600);
      if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
      const body = await readJson(req);
      const r = await creadores.alta(body);
      if (!r.ok) return json(res, 400, { error: r.error });
      return json(res, 200, { ok: true, codigo: r.codigo });
    }

    return json(res, 400, { error: 'accion_desconocida' });
  } catch (e) {
    return json(res, e instanceof ConfigError ? 503 : 500,
      { error: e instanceof ConfigError ? 'no_configurado' : 'error' });
  }
};

'use strict';
/* El panel de ventas, en un solo endpoint.
 *
 *   GET  /api/admin              la lista de ventas (solo lee)
 *   POST /api/admin              revocar · reactivar · soltar · reenviar · regalar
 *                                aprobar_creador · rechazar_creador · enviar_a
 *
 * Antes eran dos ficheros, api/admin/licencias.js y api/admin/accion.js. Se
 * juntaron porque Vercel crea UNA funcion por fichero bajo api/ y el plan
 * gratuito corta en doce: al añadir el programa de creadores pasamos a trece y
 * el despliegue dejo de subir — sin error visible, simplemente la version
 * nueva no llegaba nunca. Este es el par que menos duele juntar: lo usa una
 * sola persona desde admin.html, no lo llama la extension ni la web publica.
 */
const { json, options, readJson } = require('../lib/http');
const { frenar } = require('../lib/freno');
const { ConfigError, command, getJson, setJson } = require('../lib/kv');
const { autorizado, configurado, licencias, atadaA, resumen } = require('../lib/admin');
const { regalar } = require('../lib/licenses');
const creadores = require('../lib/creadores');
const { correoLicencia, enviar } = require('../lib/correo');
const { downloadFor } = require('../lib/downloads');
const { entregar } = require('../lib/entrega');

const ACCIONES = new Set(['revocar', 'reactivar', 'soltar', 'reenviar', 'regalar',
  'aprobar_creador', 'rechazar_creador', 'enviar_a']);
const CLAVE = /^GHST-(?:[A-Z0-9]{4}-){4}[A-Z0-9]{4}$/;

module.exports = async (req, res) => {
  if (options(req, res)) return;
  // Sin token configurado el panel no existe, ni siquiera para decir que no.
  if (!configurado()) return json(res, 404, { error: 'no_encontrado' });

  const freno = await frenar(req, 'admin', 60, 600);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });
  if (!autorizado(req)) return json(res, 401, { error: 'no_autorizado' });

  try {
    /* ---- la lista ------------------------------------------------------ */
    if (req.method === 'GET') {
      const { fichas, completo } = await licencias();
      fichas.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      // Se pide la cuenta atada de las que se van a enseñar, no de todas: es
      // una consulta por licencia y con muchas ventas se nota.
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
          // De que creador vino esta venta, si vino de alguno.
          ref: f.ref || null,
        });
      }
      /* Las solicitudes de creador viajan con la lista de ventas y no por su
         propio endpoint: Vercel crea una funcion por fichero bajo api/ y el
         plan gratuito corta en doce, que es justo donde estamos. */
      let solicitudes = [];
      try { solicitudes = await creadores.listar(); } catch (e) { /* el panel vale sin esto */ }
      return json(res, 200, { resumen: resumen(fichas), licencias: lista, completo, creadores: solicitudes });
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

    /* ---- las cuatro cosas que hay que poder hacer con una venta ---------
       revocar    devuelto o fraude — la clave deja de activar y de descargar
       reactivar  deshacer lo anterior, porque revocar por error pasa
       soltar     desatarla de la cuenta de Instagram, para que el comprador
                  pueda usarla en otra. Es la peticion de soporte mas comun
       reenviar   volver a mandar el correo con la clave

       Un reembolso de Stripe ya revoca solo (api/stripe-webhook.js). Esto es
       para lo que no pasa por Stripe. */
    const body = await readJson(req).catch(() => ({}));
    const accion = String(body.accion || '');
    const key = String(body.key || '').trim().toUpperCase();
    if (!ACCIONES.has(accion)) return json(res, 400, { error: 'accion_desconocida' });

    /* regalar es la unica que no parte de una clave que ya existe: la crea.
       Va aqui arriba porque las validaciones de abajo dan por hecho que la
       clave viene en la peticion, y esta la devuelve. */
    if (accion === 'regalar') {
      const ficha = await regalar(String(body.plan || 'pro'), body.motivo);
      return json(res, 200, { ok: true, key: ficha.key, plan: ficha.plan });
    }

    if (accion === 'aprobar_creador' || accion === 'rechazar_creador') {
      const r = await creadores.decidir(String(body.codigo || ''), accion === 'aprobar_creador');
      if (!r.ok) return json(res, 404, { error: r.error });
      return json(res, 200, { ok: true, estado: r.estado });
    }

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

    /* Mandar la clave a un correo escrito a mano. No es lo mismo que
       'reenviar': eso va al correo de la compra, y esto sirve para una clave
       regalada —que no tiene comprador— o para cuando alguien se equivoco al
       teclear el suyo. No toca la ficha: el correo del comprador sigue siendo
       el que pago. */
    if (accion === 'enviar_a') {
      const destino = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(destino)) return json(res, 400, { error: 'email_mal_formado' });
      const dl = downloadFor(ficha.plan || 'pro');
      const carta = correoLicencia({
        key: ficha.key,
        producto: dl.name,
        lang: ficha.lang || 'es',
        urlDescarga: (process.env.SITE_URL || 'https://ghoosted.net') + '/api/download?key=' + encodeURIComponent(ficha.key),
        sitio: process.env.SITE_URL || 'https://ghoosted.net',
      });
      const salio = await enviar({ to: destino, subject: carta.subject, html: carta.html, text: carta.text });
      if (!salio) return json(res, 502, { error: 'correo_no_salio' });
      return json(res, 200, { ok: true, enviado_a: destino });
    }

    // reenviar
    const salida = await entregar(ficha, { forzar: true });
    return json(res, 200, { ok: true, enviado: salida });
  } catch (error) {
    return json(res, error instanceof ConfigError ? 503 : 500,
      { error: error instanceof ConfigError ? 'almacen_no_configurado' : 'error' });
  }
};

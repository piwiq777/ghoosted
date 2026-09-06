'use strict';
/* Freno de intentos, apoyado en el mismo almacen que las licencias.
 *
 * Las claves son de 80 bits, asi que adivinarlas a fuerza bruta no es la
 * amenaza. Lo que esto evita es lo barato: que alguien lance miles de
 * peticiones por segundo contra activar/verificar, gaste la cuota del almacen
 * y deje sin servicio a quien si ha pagado. Y de paso hace ruidoso cualquier
 * intento de enumerar claves.
 *
 * Se falla ABIERTO a proposito: si el almacen no responde, se deja pasar. Un
 * freno que tumba las activaciones legitimas cuando hay un problema de
 * infraestructura es peor que no tener freno. */
const { command, isConfigured } = require('./kv');

function ip(req) {
  const h = req.headers || {};
  const fwd = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || h['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'desconocida';
}

/**
 * @param {string} cubo   nombre del limite, p.ej. 'activar'
 * @param {number} max    intentos permitidos en la ventana
 * @param {number} seg    ventana en segundos
 * @returns {Promise<{permitido: boolean, quedan: number}>}
 */
async function frenar(req, cubo, max, seg) {
  if (!isConfigured()) return { permitido: true, quedan: max };
  const clave = `ghosted:freno:${cubo}:${ip(req)}`;
  try {
    const n = Number(await command(['INCR', clave])) || 1;
    // La caducidad se pone solo en el primero: si se renovara en cada intento,
    // quien insista sin parar mantendria la ventana viva para siempre y el
    // contador nunca se reiniciaria.
    if (n === 1) await command(['EXPIRE', clave, String(seg)]);
    return { permitido: n <= max, quedan: Math.max(0, max - n) };
  } catch (e) {
    return { permitido: true, quedan: max };  // falla abierto
  }
}

module.exports = { frenar, ip };

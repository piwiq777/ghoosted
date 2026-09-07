'use strict';
/* Que cada endpoint arranque de verdad.
 *
 * node --check solo mira la sintaxis. Un nombre que no existe —una constante
 * que se quedo sin escribir, un require olvidado— pasa la sintaxis y revienta
 * al ejecutarse, con un 500 seco. Eso es lo que tumbo los pagos: /api/checkout
 * usaba IDIOMAS y STRIPE_LOCALE, que no estaban definidas, y cada intento de
 * compra devolvia FUNCTION_INVOCATION_FAILED. Nadie pudo pagar.
 *
 * Aqui se llama a cada handler con una peticion de mentira y SIN variables de
 * entorno. Lo que se comprueba no es que funcione —sin claves no puede— sino
 * que conteste algo en vez de lanzar. Un 503 "no configurado" es aprobado. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const API = path.resolve(__dirname, '..', '..', 'Ghosted-Landing', 'api');

/* Vercel entrega un res de Express. Este lo imita en lo que usa lib/http. */
function fingirRes() {
  const r = { statusCode: null, cuerpo: null, cabeceras: {} };
  r.setHeader = (k, v) => { r.cabeceras[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (p) => { r.cuerpo = p; return r; };
  r.end = () => r;
  r.write = () => r;
  return r;
}

function fingirReq(metodo, cuerpo) {
  return {
    method: metodo, headers: {}, query: {}, socket: {},
    body: cuerpo || {},
    [Symbol.asyncIterator]: async function* () { /* cuerpo vacio */ },
  };
}

/* Todos los .js bajo api/, menos los que no son endpoints. */
function endpoints(dir, prefijo = '') {
  const salida = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f === '_private') continue;
      salida.push(...endpoints(p, prefijo + f + '/'));
    } else if (f.endsWith('.js')) salida.push({ ruta: prefijo + f, fichero: p });
  }
  return salida;
}

module.exports = async () => {
  const s = suite('endpoints · que arranquen');

  const limpio = { ...process.env };
  /* Sin claves de nada: es el peor caso y el que mas caminos raros toca. */
  for (const k of Object.keys(process.env)) {
    if (/^(STRIPE|UPSTASH|KV_REST|RESEND|TWILIO|ADMIN|MAIL|SITE)_/.test(k)) delete process.env[k];
  }

  try {
    const lista = endpoints(API);
    s.ok('se encuentran los endpoints', lista.length >= 6);

    for (const { ruta, fichero } of lista) {
      let handler;
      try {
        delete require.cache[require.resolve(fichero)];
        handler = require(fichero);
      } catch (e) {
        s.ok(`${ruta}: se puede cargar`, false);
        continue;
      }
      if (typeof handler !== 'function') { s.ok(`${ruta}: exporta un handler`, false); continue; }

      for (const metodo of ['GET', 'POST']) {
        const res = fingirRes();
        let reventó = null;
        try {
          await handler(fingirReq(metodo), res);
        } catch (e) {
          reventó = (e && e.message) || String(e);
        }
        s.eq(`${ruta} ${metodo}: no revienta`, reventó, null);
        /* Y contesta algo: un handler que no responde deja la peticion colgada
           hasta que Vercel la corta. */
        if (!reventó) s.ok(`${ruta} ${metodo}: contesta`, res.statusCode !== null);
      }
    }
  } finally {
    process.env = limpio;
  }

  return s;
};

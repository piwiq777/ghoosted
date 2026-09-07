function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function json(res, status, payload) {
  setCors(res);
  res.status(status).json(payload);
}

function options(req, res) {
  if (req.method !== 'OPTIONS') return false;
  setCors(res);
  res.status(204).end();
  return true;
}

async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = await rawBody(req);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf8'));
}

/* NUNCA construyas una URL de vuelta con la cabecera Host: la manda el
   cliente. Quien haga POST a /api/checkout con "X-Forwarded-Host: malo.com"
   consigue una sesion de pago de Stripe cuyo success_url apunta a malo.com —
   el comprador paga de verdad y aterriza en la web del atacante CON el
   session_id en la URL, que es lo unico que hace falta para pedir su clave a
   /api/license/order. Y de paso los enlaces de la casilla de consentimiento
   (terminos, reembolso) apuntarian tambien ahi.

   El dominio es nuestro y es fijo: se escribe, no se pregunta. Solo se acepta
   una cabecera si coincide con la lista, para que los despliegues de vista
   previa de Vercel sigan funcionando en pruebas. */
const SITIO = 'https://www.ghoosted.net';
const PERMITIDOS = /^(www\.)?ghoosted\.net$/;

function origin(req) {
  const host = String((req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '');
  if (PERMITIDOS.test(host)) return 'https://' + host;
  return process.env.SITE_URL || SITIO;
}

module.exports = { json, options, rawBody, readJson, origin };

const { json, options, origin, readJson } = require('../lib/http');
const { frenar } = require('../lib/freno');
const { isConfigured } = require('../lib/kv');

// Two products share this one endpoint: Pro (STRIPE_PRICE_ID, 5€) and Plus
// (STRIPE_PRICE_ID_PLUS, 3.50€, the Chrome-Web-Store-safe build). `plan` in
// the request body picks which; the chosen plan is stamped into the Stripe
// session's metadata so the webhook can record it on the issued license —
// without that, a 3.50€ Plus key could otherwise activate the full 5€ Pro
// extension, since both would just be "a valid key" with no product on it.
const PRICE_ENV = { pro: 'STRIPE_PRICE_ID', plus: 'STRIPE_PRICE_ID_PLUS' };

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  // Freno por IP: 20 intentos cada 10 minutos.
  const freno = await frenar(req, 'pagar', 20, 600);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });

  const body = await readJson(req).catch(() => ({}));
  const plan = PRICE_ENV[body.plan] ? body.plan : 'pro';
  const priceId = process.env[PRICE_ENV[plan]];

  if (!isConfigured() || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !priceId) {
    return json(res, 503, { error: 'checkout_not_configured' });
  }

  const site = origin(req);
  const params = new URLSearchParams({
    mode: 'payment',
    // Card only: any delayed/async method (SEPA, bank redirects, ...) would
    // complete with payment_status:'unpaid' and fire
    // checkout.session.async_payment_succeeded instead, which the webhook
    // never listens for — that customer would pay and never get a key.
    'payment_method_types[0]': 'card',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[plan]': plan,
    // La cuenta de Stripe se comparte con otro producto, asi que por defecto
    // el cargo saldria en el extracto con el nombre de esa otra marca. Quien
    // no reconoce un cargo lo reclama al banco, y una reclamacion cuesta el
    // importe mas la comision. Aqui se fuerza el nombre correcto.
    'payment_intent_data[statement_descriptor]': 'GHOOSTED',
    'payment_intent_data[description]': plan === 'plus'
      ? 'Ghoosted Plus - licencia de por vida'
      : 'Ghoosted Pro - licencia de por vida',
    success_url: site + '/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: site + '/#pricing',
    allow_promotion_codes: 'true',
    // IVA calculado por Stripe y desglosado en el recibo.
    //
    // HOY NO CAMBIA NADA para el cliente: la cuenta no tiene ninguna region
    // registrada en Stripe Tax, asi que calcula 0 y sigue pagando 5 EUR.
    // El dia que se anada el alta (Espana, y OSS si se pasa del umbral) el
    // IVA aparece separado en el recibo y se declara solo, sin tocar codigo.
    //
    // Los precios siguen en 'inclusive' A PROPOSITO: vendiendo a consumidores
    // en la UE hay que anunciar el precio final con impuestos (Directiva
    // 98/6/CE y art. 60 TRLGDCU). Poner 5 EUR en la web y cobrar 6,05 en la
    // pantalla de pago seria publicidad enganosa. Si algun dia hay que cubrir
    // el IVA, se sube el precio anunciado, no se le suma por detras.
    'automatic_tax[enabled]': 'true',
    // Stripe Tax necesita saber donde esta el comprador para calcular.
    'billing_address_collection': 'required',
    // El movil, para mandar la clave tambien por SMS. Segunda via cuando el
    // correo se va a spam o el comprador cierra la pestaña sin copiar la
    // clave. Stripe lo pide como opcional: quien no quiera darlo compra igual.
    //
    // SOLO se pide si el SMS puede salir de verdad (lib/entrega.js necesita
    // las variables de Twilio). Pedir un telefono que no se va a usar para
    // nada es recoger un dato personal sin finalidad, que es justo lo que el
    // RGPD llama minimizacion.
    ...(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM
      ? { 'phone_number_collection[enabled]': 'true' } : {}),
    // EU/ES consumer law: digital content delivered immediately. The buyer
    // must EXPRESSLY consent to immediate performance and acknowledge losing
    // the 14-day withdrawal right (Art. 16(m) Directive 2011/83/EU, Art.
    // 103.m TRLGDCU) — otherwise "no refunds" is unenforceable. Requires the
    // Terms of Service URL to be set in Stripe Dashboard → Business details,
    // or session creation 400s (see error log below).
    'consent_collection[terms_of_service]': 'required',
    'custom_text[terms_of_service_acceptance][message]':
      'I request immediate delivery of my licence key and expressly consent to immediate performance. '
      + 'I acknowledge that once the key is delivered I lose my 14-day right of withdrawal '
      + '(Art. 16(m) Directive 2011/83/EU / Art. 103.m TRLGDCU). '
      + 'I accept the [Terms](' + site + '/terms) and [Refund Policy](' + site + '/refund).',
  });
  const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = await stripe.json().catch(() => ({}));
  if (!stripe.ok || !data.url) {
    // Most common cause: no Terms of Service URL configured in the Stripe
    // Dashboard (required by consent_collection). Surface it in the logs.
    console.error('checkout_session_failed', stripe.status, data && data.error && data.error.message);
    return json(res, 502, { error: 'checkout_unavailable' });
  }
  return json(res, 200, { url: data.url });
};

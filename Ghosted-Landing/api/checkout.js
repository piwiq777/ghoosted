const { json, options, origin, readJson } = require('../lib/http');
const { normalizar: normalizarRef, valido: refValido } = require('../lib/creadores');
const { frenar } = require('../lib/freno');
const { isConfigured } = require('../lib/kv');

// Two products share this one endpoint: Pro (STRIPE_PRICE_ID, 5€) and Plus
// (STRIPE_PRICE_ID_PLUS, 3.50€, the Chrome-Web-Store-safe build). `plan` in
// the request body picks which; the chosen plan is stamped into the Stripe
// session's metadata so the webhook can record it on the issued license —
// without that, a 3.50€ Plus key could otherwise activate the full 5€ Pro
// extension, since both would just be "a valid key" with no product on it.
const PRICE_ENV = { pro: 'STRIPE_PRICE_ID', plus: 'STRIPE_PRICE_ID_PLUS' };

// Los idiomas de la web. Nada fuera de aqui llega a la metadata de Stripe.
const IDIOMAS = ['en', 'es', 'pt-BR', 'fr', 'de', 'it', 'tr', 'id', 'ru', 'hi', 'ar', 'ja'];
// Checkout de Stripe no admite arabe ni hindi; esos se quedan en 'auto' y los
// resuelve el navegador del comprador.
const STRIPE_LOCALE = { en: 'en', es: 'es', 'pt-BR': 'pt-BR', fr: 'fr', de: 'de',
  it: 'it', tr: 'tr', id: 'id', ru: 'ru', ja: 'ja' };

/* El texto que el comprador marca antes de pagar. Va en su idioma a proposito:
   una renuncia a un derecho que no se entiende no vale para nada. Dice tres
   cosas y ninguna de mas — entrega ya, se pierde el desistimiento, y no hay
   devolucion por arrepentirse. Lo que NO dice, porque seria nulo y ademas
   contraproducente, es "no hay reembolsos nunca": la garantia legal de
   conformidad no se puede renunciar, y meter una clausula nula delante de un
   consumidor tumba tambien las que si son validas. */
const CONSENT = {
  en: (s) => 'I ask for my licence key to be delivered immediately and I agree it starts right away. I understand that once the key is delivered I lose my 14-day right of withdrawal and there is NO refund if I change my mind (Art. 16(m) Directive 2011/83/EU). This does not affect my legal guarantee if the product does not work. I accept the [Terms](' + s + '/terms) and the [Refund Policy](' + s + '/refund).',
  es: (s) => 'Pido que mi clave se entregue de inmediato y acepto que se ejecute ya. Entiendo que, entregada la clave, pierdo el derecho de desistimiento de 14 días y NO hay devolución si cambio de opinión (art. 103.m TRLGDCU). Esto no afecta a mi garantía legal si el producto no funciona. Acepto los [Términos](' + s + '/terms) y la [Política de Reembolso](' + s + '/refund).',
  'pt-BR': (s) => 'Peço a entrega imediata da minha chave e concordo que comece já. Entendo que, entregue a chave, perco o direito de arrependimento de 14 dias e NÃO há reembolso se eu mudar de ideia (art. 16(m) Diretiva 2011/83/UE). Isso não afeta minha garantia legal se o produto não funcionar. Aceito os [Termos](' + s + '/terms) e a [Política de Reembolso](' + s + '/refund).',
  fr: (s) => 'Je demande la livraison immédiate de ma clé et j\'accepte l\'exécution immédiate. Je comprends qu\'une fois la clé livrée je perds mon droit de rétractation de 14 jours et qu\'il n\'y a AUCUN remboursement si je change d\'avis (art. 16(m) directive 2011/83/UE). Cela n\'affecte pas ma garantie légale si le produit ne fonctionne pas. J\'accepte les [Conditions](' + s + '/terms) et la [Politique de remboursement](' + s + '/refund).',
  de: (s) => 'Ich verlange die sofortige Lieferung meines Lizenzschlüssels und stimme der sofortigen Ausführung zu. Mir ist klar, dass ich mit der Lieferung mein 14-tägiges Widerrufsrecht verliere und es KEINE Erstattung gibt, wenn ich es mir anders überlege (Art. 16(m) Richtlinie 2011/83/EU). Meine gesetzliche Gewährleistung bleibt davon unberührt, falls das Produkt nicht funktioniert. Ich akzeptiere die [AGB](' + s + '/terms) und die [Erstattungsrichtlinie](' + s + '/refund).',
  it: (s) => 'Chiedo la consegna immediata della mia chiave e accetto l\'esecuzione immediata. Capisco che, consegnata la chiave, perdo il diritto di recesso di 14 giorni e NON c\'è rimborso se cambio idea (art. 16(m) direttiva 2011/83/UE). Questo non intacca la mia garanzia legale se il prodotto non funziona. Accetto i [Termini](' + s + '/terms) e la [Politica di rimborso](' + s + '/refund).',
  tr: (s) => 'Anahtarımın hemen teslim edilmesini istiyorum ve ifanın derhal başlamasını kabul ediyorum. Anahtar teslim edildikten sonra 14 günlük cayma hakkımı kaybettiğimi ve fikrimi değiştirirsem geri ödeme OLMADIĞINI anlıyorum (2011/83/AB md. 16(m)). Ürün çalışmazsa yasal garantim bundan etkilenmez. [Şartlar](' + s + '/terms) ve [İade Politikası](' + s + '/refund) kabul ediyorum.',
  id: (s) => 'Saya meminta kunci lisensi saya dikirim segera dan setuju pelaksanaannya dimulai sekarang. Saya paham bahwa setelah kunci dikirim, saya kehilangan hak pembatalan 14 hari dan TIDAK ada pengembalian dana jika saya berubah pikiran (ps. 16(m) Direktif 2011/83/UE). Ini tidak memengaruhi garansi hukum saya jika produk tidak bekerja. Saya menerima [Ketentuan](' + s + '/terms) dan [Kebijakan Pengembalian Dana](' + s + '/refund).',
  ru: (s) => 'Я прошу выдать ключ немедленно и согласен на немедленное исполнение. Я понимаю, что после выдачи ключа теряю 14-дневное право на отказ и возврата средств при передумывании НЕ будет (ст. 16(m) Директивы 2011/83/ЕС). Это не затрагивает мою законную гарантию, если продукт не работает. Принимаю [Условия](' + s + '/terms) и [Политику возврата](' + s + '/refund).',
  hi: (s) => 'मैं अपनी लाइसेंस कुंजी तुरंत देने का अनुरोध करता/करती हूँ और तत्काल निष्पादन से सहमत हूँ। मैं समझता/समझती हूँ कि कुंजी मिलने के बाद मेरा 14 दिन का निरस्तीकरण अधिकार समाप्त हो जाता है और मन बदलने पर कोई रिफ़ंड नहीं मिलेगा (निर्देश 2011/83/EU अनु. 16(m))। उत्पाद काम न करे तो मेरी कानूनी गारंटी पर असर नहीं पड़ता। मैं [शर्तें](' + s + '/terms) और [रिफ़ंड नीति](' + s + '/refund) स्वीकार करता/करती हूँ।',
  ar: (s) => 'أطلب تسليم مفتاح الترخيص فورًا وأوافق على التنفيذ الفوري. أفهم أنني بمجرد تسلّم المفتاح أفقد حق الانسحاب خلال 14 يومًا وأنه لا يوجد أي استرداد إذا غيّرت رأيي (المادة 16(m) من التوجيه 2011/83/EU). ولا يؤثر ذلك على ضماني القانوني إذا لم يعمل المنتج. أوافق على [الشروط](' + s + '/terms) و[سياسة الاسترداد](' + s + '/refund).',
  ja: (s) => 'ライセンスキーの即時提供を希望し、直ちに履行が始まることに同意します。キーが提供された時点で 14 日間の解約権を失い、気が変わっても返金はないことを理解しています（指令 2011/83/EU 第16条(m)）。製品が動作しない場合の法定保証には影響しません。[利用規約](' + s + '/terms) と [返金ポリシー](' + s + '/refund) に同意します。',
};

function consentimiento(lang, site) {
  return (CONSENT[lang] || CONSENT.en)(site);
}

/* Traduce el rechazo de Stripe a un codigo corto. Cada uno se arregla en un
   sitio distinto del panel de Stripe, y confundirlos cuesta horas. */
function porQueNo(d, estado) {
  const e = (d && d.error) || {};
  const t = String(e.message || '');
  if (/does not have the required permissions|permission/i.test(t)) return 'la_clave_no_tiene_permiso';
  if (/No such price|resource_missing/i.test(t) || e.code === 'resource_missing') return 'ese_precio_no_existe';
  if (/inactive|archiv/i.test(t)) return 'el_precio_esta_archivado';
  if (/terms.of.service|tos_acceptance|consent_collection/i.test(t)) return 'falta_la_url_de_condiciones_en_stripe';
  if (/statement_descriptor/i.test(t)) return 'el_texto_del_extracto_no_le_gusta_a_stripe';
  if (/currency/i.test(t)) return 'divisa_incompatible';
  if (estado === 401) return 'clave_no_valida';
  return e.type ? String(e.type).slice(0, 40) : 'http_' + estado;
}

module.exports = async (req, res) => {
  if (options(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });
  // Freno por IP: 20 intentos cada 10 minutos.
  const freno = await frenar(req, 'pagar', 20, 600);
  if (!freno.permitido) return json(res, 429, { error: 'demasiados_intentos' });

  const body = await readJson(req).catch(() => ({}));
  const plan = PRICE_ENV[body.plan] ? body.plan : 'pro';
  const lang = IDIOMAS.indexOf(String(body.lang || '')) !== -1 ? String(body.lang) : 'en';
  const priceId = process.env[PRICE_ENV[plan]];

  if (!isConfigured() || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !priceId) {
    return json(res, 503, { error: 'checkout_not_configured' });
  }

  const site = origin(req);
  /* El codigo del creador que trajo esta visita. Va como metadata de la sesion
     —la misma tuberia por la que ya viajan el plan y el idioma— para que la
     comision se calcule sobre lo que Stripe dice que se cobro, y no sobre un
     contador aparte que habria que creerse. Si viene basura, se ignora: una
     compra jamas puede fallar por esto. */
  const refBruto = normalizarRef(body.ref);
  const ref = refValido(refBruto) ? refBruto : '';
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
    // Para el correo con la clave (lib/correo.js). Se valida contra la lista
    // de la web: cualquier otra cosa se queda en ingles.
    'metadata[lang]': lang,
    ...(ref ? { 'metadata[ref]': ref } : {}),
    // Y la pantalla de pago de Stripe, en el mismo idioma. Stripe no tiene
    // arabe ni hindi en Checkout, asi que esos van en 'auto' y los resuelve el
    // navegador del comprador.
    'locale': STRIPE_LOCALE[lang] || 'auto',
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
    // La casilla obligatoria de Stripe, en el idioma del comprador. Es la
    // unica forma de que la perdida del desistimiento sea oponible: tiene que
    // ser expresa, previa al pago y marcada por el.
    'custom_text[terms_of_service_acceptance][message]': consentimiento(lang, site),
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
    console.error('checkout_session_failed', stripe.status, data && data.error && data.error.message);
    /* El motivo, en una palabra. NUNCA el texto de Stripe: ese mensaje trae el
       identificador de la cuenta y el final de la clave, y esto lo puede pedir
       cualquiera. Sin esto, "no se puede pagar" y "no se puede pagar por esta
       razon concreta" se ven igual desde fuera, y el unico sitio donde estaba
       el motivo era un registro del servidor que nadie mira mientras la tienda
       esta cerrada. */
    return json(res, 502, { error: 'checkout_unavailable', motivo: porQueNo(data, stripe.status) });
  }
  return json(res, 200, { url: data.url });
};

/* El correo con la clave de licencia.
 *
 * Puede que sea el unico sitio donde el comprador vuelva a encontrar su clave
 * dentro de un mes, asi que se escribe para eso: la clave grande y sola, el
 * enlace de descarga, y los pasos justos para instalar.
 *
 * Reglas de correo, que no son las de una pagina web:
 *   · tablas, no flex ni grid — Outlook usa el motor de Word
 *   · todo el CSS en linea; los <style> se caen en Gmail y en varios mas
 *   · nada de imagenes: si no cargan (que es lo normal por defecto) el correo
 *     tiene que seguir entendiendose entero, y ademas un correo de solo texto
 *     con enlaces pesa menos y pasa mejor los filtros
 *   · version en texto plano SIEMPRE: sin ella los filtros puntuan peor
 */

/* Idiomas de la web. Si llega uno que no esta, se manda en ingles. */
const TEXTOS = {
  en: {
    subject: (p) => 'Your ' + p + ' key',
    hi: 'Thanks for buying',
    keep: 'This is your licence key. Keep this email — it is how you activate the extension, and it never expires.',
    dl: 'Download',
    steps: 'Installing',
    s1: 'Unzip the file into a folder you will not delete. The browser reads the extension from there every time.',
    s2: 'Open chrome://extensions, turn on Developer mode (top right) and click "Load unpacked". Pick that folder.',
    s3: 'Go to Instagram, open Ghoosted, and paste this key to activate it on your account.',
    help: 'Stuck? Just reply to this email.',
    guide: 'Step-by-step guide',
    legal: 'At checkout you requested immediate delivery of the digital content and agreed to lose the 14-day right of withdrawal once the key was delivered (art. 16(m) Directive 2011/83/EU). Your statutory guarantees are unaffected.',
  },
  es: {
    subject: (p) => 'Tu clave de ' + p,
    hi: 'Gracias por comprar',
    keep: 'Esta es tu clave de licencia. Guarda este correo: es con lo que activas la extensión, y no caduca.',
    dl: 'Descargar',
    steps: 'Cómo instalarlo',
    s1: 'Descomprime el archivo en una carpeta que no vayas a borrar. El navegador lee la extensión de ahí cada vez.',
    s2: 'Abre chrome://extensions, activa el Modo de desarrollador (arriba a la derecha) y pulsa "Cargar descomprimida". Elige esa carpeta.',
    s3: 'Entra en Instagram, abre Ghoosted y pega esta clave para activarla en tu cuenta.',
    help: '¿Algo no va? Responde a este mismo correo.',
    guide: 'Guía paso a paso',
    legal: 'Al comprar solicitaste la entrega inmediata del contenido digital y aceptaste perder el derecho de desistimiento de 14 días una vez entregada la clave (art. 103.m TRLGDCU). Tus garantías legales de conformidad no se ven afectadas.',
  },
  'pt-BR': {
    subject: (p) => 'Sua chave do ' + p,
    hi: 'Obrigado por comprar',
    keep: 'Esta é a sua chave de licença. Guarde este e-mail: é com ela que você ativa a extensão, e ela não expira.',
    dl: 'Baixar',
    steps: 'Como instalar',
    s1: 'Descompacte o arquivo numa pasta que você não vá apagar. O navegador lê a extensão dali toda vez.',
    s2: 'Abra chrome://extensions, ative o Modo do desenvolvedor (canto superior direito) e clique em "Carregar sem compactação". Escolha essa pasta.',
    s3: 'Entre no Instagram, abra o Ghoosted e cole esta chave para ativá-la na sua conta.',
    help: 'Travou em algo? É só responder a este e-mail.',
    guide: 'Guia passo a passo',
    legal: 'Na compra você solicitou a entrega imediata do conteúdo digital e concordou em perder o direito de arrependimento de 14 dias após a entrega da chave (art. 16(m) da Diretiva 2011/83/UE). Suas garantias legais não são afetadas.',
  },
  fr: {
    subject: (p) => 'Votre clé ' + p,
    hi: 'Merci pour votre achat de',
    keep: "Voici votre clé de licence. Gardez cet e-mail : c'est avec elle que vous activez l'extension, et elle n'expire pas.",
    dl: 'Télécharger',
    steps: 'Installation',
    s1: "Décompressez le fichier dans un dossier que vous ne supprimerez pas. Le navigateur y lit l'extension à chaque fois.",
    s2: 'Ouvrez chrome://extensions, activez le Mode développeur (en haut à droite) et cliquez sur « Charger l\'extension non empaquetée ». Choisissez ce dossier.',
    s3: 'Allez sur Instagram, ouvrez Ghoosted et collez cette clé pour l\'activer sur votre compte.',
    help: 'Un souci ? Répondez simplement à cet e-mail.',
    guide: 'Guide pas à pas',
    legal: "Lors de l'achat, vous avez demandé la fourniture immédiate du contenu numérique et accepté de perdre le droit de rétractation de 14 jours une fois la clé délivrée (art. 16(m) directive 2011/83/UE). Vos garanties légales ne sont pas affectées.",
  },
  de: {
    subject: (p) => 'Dein ' + p + '-Schlüssel',
    hi: 'Danke für deinen Kauf von',
    keep: 'Das ist dein Lizenzschlüssel. Bewahre diese E-Mail auf — damit aktivierst du die Erweiterung, und er läuft nicht ab.',
    dl: 'Herunterladen',
    steps: 'Installation',
    s1: 'Entpacke die Datei in einen Ordner, den du nicht löschst. Der Browser liest die Erweiterung jedes Mal von dort.',
    s2: 'Öffne chrome://extensions, schalte oben rechts den Entwicklermodus ein und klicke auf „Entpackte Erweiterung laden". Wähle diesen Ordner.',
    s3: 'Geh zu Instagram, öffne Ghoosted und füge diesen Schlüssel ein, um ihn für dein Konto zu aktivieren.',
    help: 'Hakt etwas? Antworte einfach auf diese E-Mail.',
    guide: 'Anleitung Schritt für Schritt',
    legal: 'Beim Kauf hast du die sofortige Bereitstellung des digitalen Inhalts verlangt und zugestimmt, das 14-tägige Widerrufsrecht mit Lieferung des Schlüssels zu verlieren (Art. 16(m) Richtlinie 2011/83/EU). Deine gesetzlichen Gewährleistungsrechte bleiben unberührt.',
  },
  it: {
    subject: (p) => 'La tua chiave ' + p,
    hi: 'Grazie per aver acquistato',
    keep: 'Questa è la tua chiave di licenza. Conserva questa e-mail: è con lei che attivi l\'estensione, e non scade.',
    dl: 'Scarica',
    steps: 'Come installarla',
    s1: 'Estrai il file in una cartella che non cancellerai. Il browser legge l\'estensione da lì ogni volta.',
    s2: 'Apri chrome://extensions, attiva la Modalità sviluppatore (in alto a destra) e clicca "Carica estensione non pacchettizzata". Scegli quella cartella.',
    s3: 'Vai su Instagram, apri Ghoosted e incolla questa chiave per attivarla sul tuo account.',
    help: 'Qualcosa non va? Rispondi a questa e-mail.',
    guide: 'Guida passo passo',
    legal: "Al momento dell'acquisto hai richiesto la fornitura immediata del contenuto digitale e accettato di perdere il diritto di recesso di 14 giorni una volta consegnata la chiave (art. 16(m) direttiva 2011/83/UE). Le tue garanzie legali non sono intaccate.",
  },
  tr: {
    subject: (p) => p + ' anahtarın',
    hi: 'Satın aldığın için teşekkürler:',
    keep: 'Bu senin lisans anahtarın. Bu e-postayı sakla: uzantıyı bununla etkinleştiriyorsun ve süresi hiç dolmuyor.',
    dl: 'İndir',
    steps: 'Nasıl kurulur',
    s1: 'Dosyayı silmeyeceğin bir klasöre çıkar. Tarayıcı uzantıyı her seferinde oradan okur.',
    s2: 'chrome://extensions adresini aç, sağ üstten Geliştirici modunu aç ve "Paketlenmemiş öğe yükle"ye tıkla. O klasörü seç.',
    s3: "Instagram'a gir, Ghoosted'i aç ve hesabında etkinleştirmek için bu anahtarı yapıştır.",
    help: 'Takıldığın bir yer mi var? Bu e-postayı yanıtlaman yeterli.',
    guide: 'Adım adım rehber',
    legal: 'Satın alırken dijital içeriğin hemen teslimini talep ettin ve anahtar teslim edildikten sonra 14 günlük cayma hakkını kaybetmeyi kabul ettin (2011/83/AB Yönergesi md. 16(m)). Yasal garantilerin bundan etkilenmez.',
  },
  id: {
    subject: (p) => 'Kunci ' + p + ' kamu',
    hi: 'Terima kasih sudah membeli',
    keep: 'Ini kunci lisensimu. Simpan email ini: dengan inilah kamu mengaktifkan ekstensi, dan kunci ini tidak kedaluwarsa.',
    dl: 'Unduh',
    steps: 'Cara memasang',
    s1: 'Ekstrak file ke folder yang tidak akan kamu hapus. Browser membaca ekstensi dari sana setiap kali.',
    s2: 'Buka chrome://extensions, aktifkan Mode pengembang (kanan atas) lalu klik "Muat yang belum dipaketkan". Pilih folder tadi.',
    s3: 'Masuk ke Instagram, buka Ghoosted, dan tempel kunci ini untuk mengaktifkannya di akunmu.',
    help: 'Ada yang tersendat? Balas saja email ini.',
    guide: 'Panduan langkah demi langkah',
    legal: 'Saat membeli, kamu meminta pengiriman segera konten digital dan setuju kehilangan hak pembatalan 14 hari setelah kunci dikirim (ps. 16(m) Direktif 2011/83/UE). Garansi hukummu tidak terpengaruh.',
  },
  ru: {
    subject: (p) => 'Ваш ключ ' + p,
    hi: 'Спасибо за покупку',
    keep: 'Это ваш лицензионный ключ. Сохраните это письмо: именно им активируется расширение, и он не истекает.',
    dl: 'Скачать',
    steps: 'Как установить',
    s1: 'Распакуйте файл в папку, которую не будете удалять. Браузер каждый раз читает расширение оттуда.',
    s2: 'Откройте chrome://extensions, включите режим разработчика (справа вверху) и нажмите «Загрузить распакованное расширение». Выберите эту папку.',
    s3: 'Зайдите в Instagram, откройте Ghoosted и вставьте этот ключ, чтобы активировать его для своего аккаунта.',
    help: 'Что-то не получается? Просто ответьте на это письмо.',
    guide: 'Пошаговое руководство',
    legal: 'При покупке вы запросили немедленное предоставление цифрового контента и согласились потерять 14-дневное право на отказ после выдачи ключа (ст. 16(m) Директивы 2011/83/ЕС). Ваши законные гарантии это не затрагивает.',
  },
  hi: {
    subject: (p) => 'आपकी ' + p + ' कुंजी',
    hi: 'खरीदने के लिए धन्यवाद:',
    keep: 'यह आपकी लाइसेंस कुंजी है। यह ईमेल सँभालकर रखें: इसी से एक्सटेंशन चालू होता है, और यह कभी खत्म नहीं होती।',
    dl: 'डाउनलोड करें',
    steps: 'कैसे इंस्टॉल करें',
    s1: 'फ़ाइल को ऐसे फ़ोल्डर में खोलें जिसे आप मिटाएँगे नहीं। ब्राउज़र हर बार एक्सटेंशन वहीं से पढ़ता है।',
    s2: 'chrome://extensions खोलें, ऊपर दाईं ओर डेवलपर मोड चालू करें और "Load unpacked" दबाएँ। वही फ़ोल्डर चुनें।',
    s3: 'Instagram पर जाएँ, Ghoosted खोलें और अपने अकाउंट पर चालू करने के लिए यह कुंजी चिपकाएँ।',
    help: 'कहीं अटक गए? बस इसी ईमेल का जवाब दे दें।',
    guide: 'कदम-दर-कदम गाइड',
    legal: 'खरीदते समय आपने डिजिटल सामग्री की तुरंत डिलीवरी माँगी और कुंजी मिलने के बाद 14 दिन का निरस्तीकरण अधिकार छोड़ने पर सहमति दी (निर्देश 2011/83/EU अनु. 16(m))। आपकी कानूनी गारंटी पर कोई असर नहीं पड़ता।',
  },
  ar: {
    subject: (p) => 'مفتاح ' + p + ' الخاص بك',
    hi: 'شكرًا لشرائك',
    keep: 'هذا هو مفتاح الترخيص الخاص بك. احتفظ بهذه الرسالة: بها تفعّل الإضافة، وهي لا تنتهي.',
    dl: 'تنزيل',
    steps: 'طريقة التثبيت',
    s1: 'فُك ضغط الملف في مجلد لن تحذفه. يقرأ المتصفح الإضافة من هناك في كل مرة.',
    s2: 'افتح chrome://extensions، وفعّل وضع المطوّر أعلى اليمين، ثم اضغط "تحميل غير مضغوط" واختر ذلك المجلد.',
    s3: 'ادخل إلى Instagram، وافتح Ghoosted، والصق هذا المفتاح لتفعيله على حسابك.',
    help: 'تعثّرت في شيء؟ يكفي أن ترد على هذه الرسالة.',
    guide: 'دليل خطوة بخطوة',
    legal: 'عند الشراء طلبت التسليم الفوري للمحتوى الرقمي ووافقت على فقدان حق الانسحاب خلال 14 يومًا بمجرد تسليم المفتاح (المادة 16(m) من التوجيه 2011/83/EU). ولا يؤثر ذلك على ضماناتك القانونية.',
  },
  ja: {
    subject: (p) => p + ' のライセンスキー',
    hi: 'ご購入ありがとうございます:',
    keep: 'これがあなたのライセンスキーです。このメールは保管してください。拡張機能はこのキーで有効化でき、期限はありません。',
    dl: 'ダウンロード',
    steps: 'インストール手順',
    s1: '削除しないフォルダーにファイルを展開してください。ブラウザーは毎回そこから拡張機能を読み込みます。',
    s2: 'chrome://extensions を開き、右上のデベロッパーモードをオンにして「パッケージ化されていない拡張機能を読み込む」をクリックし、そのフォルダーを選びます。',
    s3: 'Instagram を開いて Ghoosted を起動し、このキーを貼り付けてアカウントで有効化します。',
    help: '困ったときは、このメールにそのまま返信してください。',
    guide: 'ステップごとの手順',
    legal: 'ご購入時にデジタルコンテンツの即時提供を希望され、キーの提供をもって 14 日間の解約権を失うことに同意されました（指令 2011/83/EU 第16条(m)）。法定の保証には影響しません。',
  },
};

const RTL = new Set(['ar']);

function textos(lang) {
  return TEXTOS[lang] || TEXTOS.en;
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Un paso numerado. La bolita va en su propia celda porque un ::before o un
   list-style con numero propio no sobrevive a Outlook. */
function paso(n, texto, alinea) {
  return '<tr>'
    + '<td width="30" valign="top" style="padding:0 10px 14px 0;' + (alinea === 'right' ? 'padding:0 0 14px 10px;' : '') + '">'
    + '<div style="width:24px;height:24px;line-height:24px;border-radius:12px;background:#141210;color:#F7F5F0;'
    + 'font:700 12px Arial,Helvetica,sans-serif;text-align:center">' + n + '</div></td>'
    + '<td valign="top" style="padding:0 0 14px;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#141210">'
    + esc(texto) + '</td></tr>';
}

/* Devuelve {subject, html, text} listo para Resend. */
function correoLicencia({ key, producto, lang, urlDescarga, sitio }) {
  const t = textos(lang);
  const rtl = RTL.has(lang);
  const dir = rtl ? 'rtl' : 'ltr';
  const alinea = rtl ? 'right' : 'left';

  const html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" '
    + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
    + '<html dir="' + dir + '"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + esc(t.subject(producto)) + '</title></head>'
    + '<body style="margin:0;padding:0;background:#F7F5F0" dir="' + dir + '">'
    // Lo que se ve en la lista de correos antes de abrirlo, oculto dentro.
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc(key) + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
    + 'style="background:#F7F5F0;padding:28px 12px">'
    + '<tr><td align="center">'
    + '<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" '
    + 'style="width:560px;max-width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;'
    + 'border:1px solid rgba(20,18,16,.12)">'

    // cabecera
    + '<tr><td style="background:#141210;padding:20px 30px;text-align:' + alinea + '">'
    + '<span style="font:700 19px Arial,Helvetica,sans-serif;color:#F7F5F0;letter-spacing:-.4px">Ghoosted</span>'
    + '</td></tr>'

    // cuerpo
    + '<tr><td style="padding:30px;text-align:' + alinea + '">'
    + '<p style="margin:0 0 6px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#6B655D">'
    + esc(t.hi) + ' <b style="color:#141210">' + esc(producto) + '</b>.</p>'
    + '<p style="margin:0 0 18px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#141210">'
    + esc(t.keep) + '</p>'

    // la clave
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    + '<tr><td align="center" style="border:2px dashed #D6427E;border-radius:14px;background:#FDF2F7;padding:18px 12px">'
    + '<span style="font:700 19px/1.4 Consolas,Menlo,monospace;color:#141210;letter-spacing:1.5px;'
    + 'word-break:break-all">' + esc(key) + '</span>'
    + '</td></tr></table>'

    // descarga
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px">'
    + '<tr><td style="border-radius:12px;background:#141210">'
    + '<a href="' + esc(urlDescarga) + '" style="display:inline-block;padding:13px 26px;'
    + 'font:700 15px Arial,Helvetica,sans-serif;color:#F7F5F0;text-decoration:none">'
    + esc(t.dl) + ' ' + esc(producto) + ' (.zip)</a></td></tr></table>'

    // pasos
    + '<p style="margin:26px 0 12px;font:700 13px Arial,Helvetica,sans-serif;color:#141210;'
    + 'text-transform:uppercase;letter-spacing:.6px">' + esc(t.steps) + '</p>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    + paso(1, t.s1, alinea) + paso(2, t.s2, alinea) + paso(3, t.s3, alinea)
    + '</table>'

    + '<p style="margin:16px 0 0;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#6B655D">'
    + esc(t.help) + ' <a href="' + esc(sitio) + '/instalar" style="color:#D6427E">' + esc(t.guide) + '</a>.</p>'
    + '</td></tr>'

    // pie
    + '<tr><td style="padding:18px 30px 24px;border-top:1px solid rgba(20,18,16,.12);text-align:' + alinea + '">'
    + '<p style="margin:0;font:400 11px/1.6 Arial,Helvetica,sans-serif;color:#8C857A">' + esc(t.legal) + '</p>'
    + '<p style="margin:10px 0 0;font:400 11px Arial,Helvetica,sans-serif;color:#8C857A">'
    + '<a href="' + esc(sitio) + '" style="color:#8C857A">ghoosted.net</a></p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  /* Sin esto los filtros puntuan peor, y hay quien lee el correo en texto. */
  const text = [
    t.hi + ' ' + producto + '.',
    '',
    t.keep,
    '',
    '    ' + key,
    '',
    t.dl + ': ' + urlDescarga,
    '',
    t.steps,
    '1. ' + t.s1,
    '2. ' + t.s2,
    '3. ' + t.s3,
    '',
    t.help + ' ' + sitio + '/instalar',
    '',
    t.legal,
    sitio,
  ].join('\n');

  return { subject: t.subject(producto), html, text };
}

module.exports = { correoLicencia, TEXTOS };

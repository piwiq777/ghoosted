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
    tagline: 'who watches, who leaves',
    label: 'Your licence key',
    attach: 'Also attached as a file, in case you lose this email.',
    lost: 'Lost it? Ask for it again with the email you paid with:',
    recover: 'Recover my key',
    upd: "Updates are included forever. Paste this same key here whenever a new version comes out:",
    updLink: "Update Ghoosted",
    save: 'Save the key',
    dl: 'Download',
    steps: 'Installing',
    s1: 'Unzip the file into a folder you will not delete. The browser reads the extension from there every time.',
    s1t: "Unzip it",
    s2t: "Load it into the browser",
    s3t: "Paste your key",
    shotCap: "Step 2: “Load unpacked”, and Ghoosted already on the list.",
    guideCta: "See the full guide, with screenshots",
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
    tagline: 'quién te mira, quién te deja',
    label: 'Tu clave de licencia',
    attach: 'Va también adjunta como archivo, por si pierdes este correo.',
    lost: '¿La pierdes? Pídela otra vez con el correo con el que pagaste:',
    recover: 'Recuperar mi clave',
    upd: "Las actualizaciones están incluidas para siempre. Pega esta misma clave aquí cuando salga una versión nueva:",
    updLink: "Actualizar Ghoosted",
    save: 'Guardar la clave',
    dl: 'Descargar',
    steps: 'Cómo instalarlo',
    s1: 'Descomprime el archivo en una carpeta que no vayas a borrar. El navegador lee la extensión de ahí cada vez.',
    s1t: "Descomprímelo",
    s2t: "Cárgalo en el navegador",
    s3t: "Pega tu clave",
    shotCap: "Paso 2: “Cargar descomprimida”, y Ghoosted ya en la lista.",
    guideCta: "Ver la guía entera, con capturas",
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
    tagline: 'quem te vê, quem te larga',
    label: 'Sua chave de licença',
    attach: 'Vai também anexada como arquivo, caso você perca este e-mail.',
    lost: 'Perdeu? Peça de novo com o e-mail que usou na compra:',
    recover: 'Recuperar minha chave',
    upd: "As atualizações estão incluídas para sempre. Cole esta mesma chave aqui quando sair uma versão nova:",
    updLink: "Atualizar o Ghoosted",
    save: 'Salvar a chave',
    dl: 'Baixar',
    steps: 'Como instalar',
    s1: 'Descompacte o arquivo numa pasta que você não vá apagar. O navegador lê a extensão dali toda vez.',
    s1t: "Descompacte",
    s2t: "Carregue no navegador",
    s3t: "Cole sua chave",
    shotCap: "Passo 2: “Carregar sem compactação”, e o Ghoosted já na lista.",
    guideCta: "Ver o guia completo, com capturas",
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
    tagline: 'qui te regarde, qui te lâche',
    label: 'Votre clé de licence',
    attach: 'Elle est aussi jointe en fichier, au cas où vous perdriez cet e-mail.',
    lost: 'Perdue ? Redemandez-la avec l\'e-mail utilisé pour payer :',
    recover: 'Récupérer ma clé',
    upd: "Les mises à jour sont incluses pour toujours. Colle cette même clé ici quand une nouvelle version sort :",
    updLink: "Mettre à jour Ghoosted",
    save: 'Enregistrer la clé',
    dl: 'Télécharger',
    steps: 'Installation',
    s1: "Décompressez le fichier dans un dossier que vous ne supprimerez pas. Le navigateur y lit l'extension à chaque fois.",
    s1t: "Décompresse-le",
    s2t: "Charge-le dans le navigateur",
    s3t: "Colle ta clé",
    shotCap: "Étape 2 : « Charger l’extension non empaquetée », et Ghoosted déjà dans la liste.",
    guideCta: "Voir le guide complet, avec captures",
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
    tagline: 'wer schaut, wer geht',
    label: 'Dein Lizenzschlüssel',
    attach: 'Liegt auch als Datei bei, falls diese E-Mail verloren geht.',
    lost: 'Verloren? Fordere ihn erneut an, mit der E-Mail deines Kaufs:',
    recover: 'Schlüssel wiederherstellen',
    upd: "Updates sind für immer inklusive. Füge denselben Schlüssel hier ein, sobald eine neue Version erscheint:",
    updLink: "Ghoosted aktualisieren",
    save: 'Schlüssel sichern',
    dl: 'Herunterladen',
    steps: 'Installation',
    s1: 'Entpacke die Datei in einen Ordner, den du nicht löschst. Der Browser liest die Erweiterung jedes Mal von dort.',
    s1t: "Entpacken",
    s2t: "In den Browser laden",
    s3t: "Schlüssel einfügen",
    shotCap: "Schritt 2: „Entpackte Erweiterung laden“ – und Ghoosted steht schon in der Liste.",
    guideCta: "Die ganze Anleitung mit Screenshots",
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
    tagline: 'chi ti guarda, chi ti lascia',
    label: 'La tua chiave di licenza',
    attach: 'È allegata anche come file, se dovessi perdere questa e-mail.',
    lost: 'Persa? Richiedila con l\'e-mail con cui hai pagato:',
    recover: 'Recupera la mia chiave',
    upd: "Gli aggiornamenti sono inclusi per sempre. Incolla questa stessa chiave qui quando esce una versione nuova:",
    updLink: "Aggiorna Ghoosted",
    save: 'Salva la chiave',
    dl: 'Scarica',
    steps: 'Come installarla',
    s1: 'Estrai il file in una cartella che non cancellerai. Il browser legge l\'estensione da lì ogni volta.',
    s1t: "Decomprimilo",
    s2t: "Caricalo nel browser",
    s3t: "Incolla la chiave",
    shotCap: "Passo 2: “Carica estensione non pacchettizzata”, e Ghoosted già nell’elenco.",
    guideCta: "Vedi la guida completa, con schermate",
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
    tagline: 'kim izliyor, kim gidiyor',
    label: 'Lisans anahtarın',
    attach: 'Bu e-postayı kaybedersen diye dosya olarak da ekli.',
    lost: 'Kaybettin mi? Ödeme yaptığın e-postayla yeniden iste:',
    recover: 'Anahtarımı kurtar',
    upd: "Güncellemeler sonsuza dek dahildir. Yeni bir sürüm çıktığında aynı anahtarı buraya yapıştır:",
    updLink: "Ghoosted'ı güncelle",
    save: 'Anahtarı kaydet',
    dl: 'İndir',
    steps: 'Nasıl kurulur',
    s1: 'Dosyayı silmeyeceğin bir klasöre çıkar. Tarayıcı uzantıyı her seferinde oradan okur.',
    s1t: "Arşivden çıkar",
    s2t: "Tarayıcıya yükle",
    s3t: "Anahtarını yapıştır",
    shotCap: "2. adım: “Paketlenmemiş öğe yükle” ve Ghoosted listede.",
    guideCta: "Ekran görüntülü tam kılavuzu gör",
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
    tagline: 'siapa nonton, siapa kabur',
    label: 'Kunci lisensimu',
    attach: 'Dilampirkan juga sebagai file, kalau email ini hilang.',
    lost: 'Hilang? Minta lagi dengan email yang kamu pakai membayar:',
    recover: 'Pulihkan kunciku',
    upd: "Pembaruan termasuk selamanya. Tempel kunci yang sama di sini setiap kali ada versi baru:",
    updLink: "Perbarui Ghoosted",
    save: 'Simpan kunci',
    dl: 'Unduh',
    steps: 'Cara memasang',
    s1: 'Ekstrak file ke folder yang tidak akan kamu hapus. Browser membaca ekstensi dari sana setiap kali.',
    s1t: "Ekstrak filenya",
    s2t: "Muat ke browser",
    s3t: "Tempel kuncimu",
    shotCap: "Langkah 2: “Load unpacked”, dan Ghoosted sudah ada di daftar.",
    guideCta: "Lihat panduan lengkap, dengan tangkapan layar",
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
    tagline: 'кто смотрит, кто уходит',
    label: 'Ваш лицензионный ключ',
    attach: 'Он также вложен файлом — на случай, если письмо потеряется.',
    lost: 'Потеряли? Запросите снова по адресу, с которого оплатили:',
    recover: 'Восстановить ключ',
    upd: "Обновления входят в покупку навсегда. Вставляйте этот же ключ здесь, когда выходит новая версия:",
    updLink: "Обновить Ghoosted",
    save: 'Сохранить ключ',
    dl: 'Скачать',
    steps: 'Как установить',
    s1: 'Распакуйте файл в папку, которую не будете удалять. Браузер каждый раз читает расширение оттуда.',
    s1t: "Распакуйте",
    s2t: "Загрузите в браузер",
    s3t: "Вставьте ключ",
    shotCap: "Шаг 2: «Загрузить распакованное» — и Ghoosted уже в списке.",
    guideCta: "Полное руководство со скриншотами",
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
    tagline: 'कौन देखता है, कौन छोड़ता है',
    label: 'आपकी लाइसेंस कुंजी',
    attach: 'यह फ़ाइल के रूप में भी संलग्न है, अगर यह ईमेल खो जाए।',
    lost: 'खो गई? जिस ईमेल से भुगतान किया था, उसी से दोबारा माँगें:',
    recover: 'मेरी कुंजी वापस पाएँ',
    upd: "अपडेट हमेशा के लिए शामिल हैं। नया संस्करण आने पर यही कुंजी यहाँ चिपकाएँ:",
    updLink: "Ghoosted अपडेट करें",
    save: 'कुंजी सहेजें',
    dl: 'डाउनलोड करें',
    steps: 'कैसे इंस्टॉल करें',
    s1: 'फ़ाइल को ऐसे फ़ोल्डर में खोलें जिसे आप मिटाएँगे नहीं। ब्राउज़र हर बार एक्सटेंशन वहीं से पढ़ता है।',
    s1t: "फ़ाइल खोलिए",
    s2t: "ब्राउज़र में लोड कीजिए",
    s3t: "अपनी चाबी चिपकाइए",
    shotCap: "चरण 2: “Load unpacked”, और Ghoosted सूची में आ गया।",
    guideCta: "स्क्रीनशॉट के साथ पूरी गाइड देखें",
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
    tagline: 'مَن يشاهدك، ومَن يتركك',
    label: 'مفتاح الترخيص الخاص بك',
    attach: 'مرفق أيضًا كملف، تحسّبًا لضياع هذه الرسالة.',
    lost: 'أضعته؟ اطلبه مرة أخرى بالبريد الذي دفعت به:',
    recover: 'استعادة مفتاحي',
    upd: "التحديثات مشمولة إلى الأبد. الصق المفتاح نفسه هنا كلما صدر إصدار جديد:",
    updLink: "حدِّث Ghoosted",
    save: 'حفظ المفتاح',
    dl: 'تنزيل',
    steps: 'طريقة التثبيت',
    s1: 'فُك ضغط الملف في مجلد لن تحذفه. يقرأ المتصفح الإضافة من هناك في كل مرة.',
    s1t: "فُكّ الضغط",
    s2t: "حمّله في المتصفح",
    s3t: "الصق مفتاحك",
    shotCap: "الخطوة 2: «تحميل غير مُحزَّم»، وGhoosted صار في القائمة.",
    guideCta: "شاهد الدليل كاملًا بالصور",
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
    tagline: '見てる人、去った人',
    label: 'あなたのライセンスキー',
    attach: 'メールを失くしたときのために、ファイルとしても添付しています。',
    lost: '失くしたら、支払いに使ったメールアドレスで再発行できます:',
    recover: 'キーを再発行する',
    upd: "アップデートはずっと無料です。新しいバージョンが出たら、同じキーをここに貼り付けてください:",
    updLink: "Ghoosted を更新",
    save: 'キーを保存',
    dl: 'ダウンロード',
    steps: 'インストール手順',
    s1: '削除しないフォルダーにファイルを展開してください。ブラウザーは毎回そこから拡張機能を読み込みます。',
    s1t: "解凍する",
    s2t: "ブラウザに読み込む",
    s3t: "キーを貼る",
    shotCap: "ステップ2：「パッケージ化されていない拡張機能を読み込む」。Ghoosted がもう一覧に出ています。",
    guideCta: "スクリーンショット付きの完全ガイド",
    s2: 'chrome://extensions を開き、右上のデベロッパーモードをオンにして「パッケージ化されていない拡張機能を読み込む」をクリックし、そのフォルダーを選びます。',
    s3: 'Instagram を開いて Ghoosted を起動し、このキーを貼り付けてアカウントで有効化します。',
    help: '困ったときは、このメールにそのまま返信してください。',
    guide: 'ステップごとの手順',
    legal: 'ご購入時にデジタルコンテンツの即時提供を希望され、キーの提供をもって 14 日間の解約権を失うことに同意されました（指令 2011/83/EU 第16条(m)）。法定の保証には影響しません。',
  },
};

const RTL = new Set(['ar']);

/* Los colores de la web. Aqui van a pelo y no como variables porque en un
   correo no hay CSS: cada valor se escribe en el atributo style de su etiqueta. */
const C = {
  fondo: '#F1EDE5', papel: '#FFFFFF', tinta: '#141210', suave: '#6B655D',
  tenue: '#8C857A', linea: '#E4DED3', rosa: '#D6427E', rosaClaro: '#FDF2F7',
  rosaLinea: '#F3C2D9', crema: '#FBF7EF',
};
/* El degradado de Instagram, que es el acento de la marca. Outlook no pinta
   degradados, asi que la franja lleva ademas un bgcolor solido debajo. */
const DEGRADADO = 'linear-gradient(90deg,#feda75,#fa7e1e 22%,#d62976 52%,#962fbf 76%,#4f5bd5)';

function textos(lang) {
  return TEXTOS[lang] || TEXTOS.en;
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace";

/* Un paso numerado. La bolita va en su propia celda: un ::before o un
   list-style con numero propio no sobrevive a Outlook.

   Lleva titulo y cuerpo, no una sola frase larga. Quien instala esto no lee:
   busca en que paso va. Con un solo parrafo por paso hay que leerlo entero
   para saberlo; con "Descomprimelo / Cargalo en el navegador / Pega tu clave"
   se ve de un vistazo, y el detalle esta debajo para cuando haga falta. */
function paso(n, titulo, texto, rtl) {
  const hueco = rtl ? 'padding:0 0 20px 14px' : 'padding:0 14px 20px 0';
  return '<tr>'
    + '<td width="30" valign="top" style="' + hueco + '">'
    + '<div style="width:30px;height:30px;line-height:30px;border-radius:15px;background:' + C.tinta + ';'
    + 'color:' + C.fondo + ';font:700 14px ' + SANS + ';text-align:center">' + n + '</div></td>'
    + '<td valign="top" style="padding:0 0 20px">'
    + '<div style="font:700 15px/1.45 ' + SANS + ';color:' + C.tinta + ';padding:4px 0 4px">'
    + esc(titulo) + '</div>'
    + '<div style="font:400 14px/1.65 ' + SANS + ';color:' + C.suave + '">' + esc(texto) + '</div>'
    + '</td></tr>';
}

/* La captura del paso que mas gente atasca: el de cargar la carpeta en el
   navegador. Va DENTRO de la lista, en la fila siguiente a su paso y alineada
   con el texto, no suelta al final.

   Muchos clientes de correo no cargan imagenes hasta que se les dice. Por eso
   el alt repite lo que se ve y los pasos se entienden igual sin ella: la
   captura confirma, no explica. */
function captura(sitio, pie, rtl) {
  const hueco = rtl ? 'padding:0 44px 20px 0' : 'padding:0 0 20px 44px';
  return '<tr><td colspan="2" style="' + hueco + '">'
    + '<a href="' + esc(sitio) + '/instalar" style="text-decoration:none">'
    + '<img src="' + esc(sitio) + '/assets/guia/paso4.jpg" width="516" alt="' + esc(pie) + '" '
    + 'style="display:block;width:100%;max-width:516px;height:auto;border-radius:12px;'
    + 'border:1px solid ' + C.linea + '"></a>'
    + '<div style="font:400 12px/1.55 ' + SANS + ';color:' + C.tenue + ';padding-top:8px">'
    + esc(pie) + '</div></td></tr>';
}

function boton(url, texto) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0">'
    + '<tr><td bgcolor="' + C.tinta + '" style="border-radius:13px">'
    + '<a href="' + esc(url) + '" style="display:inline-block;padding:14px 28px;'
    + 'font:700 15px ' + SANS + ';color:' + C.fondo + ';text-decoration:none;border-radius:13px">'
    + esc(texto) + '</a></td></tr></table>';
}

/* Devuelve {subject, html, text} listo para Resend. */
function correoLicencia({ key, producto, lang, urlDescarga, sitio }) {
  const t = textos(lang);
  const rtl = RTL.has(lang);
  const dir = rtl ? 'rtl' : 'ltr';
  const al = rtl ? 'right' : 'left';
  const urlRecuperar = sitio + '/recuperar';
  /* Las actualizaciones no se descargan solas: la extension va sin empaquetar
     y Chrome nunca la actualiza. El comprador tiene que volver con su clave, y
     si el correo no se lo dice, no lo sabe. */
  const urlActualizar = sitio + '/actualizar';

  const html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" '
    + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
    + '<html dir="' + dir + '"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">'
    + '<title>' + esc(t.subject(producto)) + '</title></head>'
    + '<body style="margin:0;padding:0;background:' + C.fondo + '" dir="' + dir + '">'

    // Lo que se lee en la bandeja antes de abrir: la clave, para no tener que
    // abrirlo si solo se queria comprobar que llego.
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0">'
    + esc(t.label) + ' · ' + esc(key) + '</div>'

    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
    + 'bgcolor="' + C.fondo + '" style="background:' + C.fondo + ';padding:30px 12px"><tr><td align="center">'
    + '<table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" '
    + 'style="width:580px;max-width:100%;background:' + C.papel + ';border-radius:22px;overflow:hidden;'
    + 'border:1px solid ' + C.linea + '">'

    // franja de color de la marca
    + '<tr><td height="5" bgcolor="#d62976" style="height:5px;line-height:5px;font-size:0;'
    + 'background-image:' + DEGRADADO + '">&nbsp;</td></tr>'

    // cabecera: icono + nombre + la frase de la marca
    + '<tr><td bgcolor="' + C.tinta + '" style="background:' + C.tinta + ';padding:22px 30px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td width="40" style="padding:' + (rtl ? '0 0 0 13px' : '0 13px 0 0') + '">'
    + '<img src="' + esc(sitio) + '/assets/icon.png" width="40" height="40" alt="" '
    + 'style="display:block;width:40px;height:40px;border-radius:11px"></td>'
    + '<td style="text-align:' + al + '">'
    + '<div style="font:700 20px ' + SANS + ';color:' + C.fondo + ';letter-spacing:-.5px">Ghoosted</div>'
    + '<div style="font:400 12px ' + SANS + ';color:#9A9288;padding-top:2px">' + esc(t.tagline) + '</div>'
    + '</td></tr></table></td></tr>'

    // cuerpo
    + '<tr><td style="padding:30px;text-align:' + al + '">'
    + '<p style="margin:0 0 6px;font:400 15px/1.6 ' + SANS + ';color:' + C.suave + '">'
    + esc(t.hi) + ' <b style="color:' + C.tinta + '">' + esc(producto) + '</b>.</p>'
    + '<p style="margin:0 0 22px;font:400 15px/1.6 ' + SANS + ';color:' + C.tinta + '">'
    + esc(t.keep) + '</p>'

    // la clave, que es lo unico que de verdad importa de este correo
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    + '<tr><td align="center" bgcolor="' + C.rosaClaro + '" style="background:' + C.rosaClaro + ';'
    + 'border:2px dashed ' + C.rosaLinea + ';border-radius:16px;padding:20px 14px">'
    + '<div style="font:700 11px ' + SANS + ';color:' + C.rosa + ';text-transform:uppercase;'
    + 'letter-spacing:1.2px;padding-bottom:9px">' + esc(t.label) + '</div>'
    + '<div style="font:700 21px/1.35 ' + MONO + ';color:' + C.tinta + ';letter-spacing:1.5px;'
    + 'word-break:break-all">' + esc(key) + '</div>'
    + '<div style="font:400 12px/1.5 ' + SANS + ';color:' + C.tenue + ';padding-top:11px">'
    + esc(t.attach) + '</div>'
    + '</td></tr></table>'

    // descarga
    + '<div style="padding:24px 0 2px">' + boton(urlDescarga, t.dl + ' ' + producto + ' (.zip)') + '</div>'

    // pasos
    + '<p style="margin:26px 0 13px;font:700 12px ' + SANS + ';color:' + C.tinta + ';'
    + 'text-transform:uppercase;letter-spacing:1px">' + esc(t.steps) + '</p>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    + paso(1, t.s1t, t.s1, rtl)
    + paso(2, t.s2t, t.s2, rtl)
    + captura(sitio, t.shotCap, rtl)
    + paso(3, t.s3t, t.s3, rtl)
    + '</table>'

    // La guia entera, como enlace que se ve. Antes iba de pasada al final de
    // la linea de "responde a este correo", donde no la encontraba nadie.
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 0">'
    + '<tr><td style="border:1px solid ' + C.linea + ';border-radius:12px">'
    + '<a href="' + esc(sitio) + '/instalar" style="display:inline-block;padding:12px 20px;'
    + 'font:600 14px ' + SANS + ';color:' + C.tinta + ';text-decoration:none">'
    + esc(t.guideCta) + ' &rarr;</a></td></tr></table>'

    // si se pierde el correo
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
    + 'style="margin-top:12px"><tr><td bgcolor="' + C.crema + '" style="background:' + C.crema + ';'
    + 'border-' + (rtl ? 'right' : 'left') + ':3px solid ' + C.rosa + ';border-radius:'
    + (rtl ? '12px 4px 4px 12px' : '4px 12px 12px 4px') + ';padding:14px 16px">'
    + '<div style="font:400 13.5px/1.6 ' + SANS + ';color:' + C.suave + '">' + esc(t.lost) + ' '
    + '<a href="' + esc(urlRecuperar) + '" style="color:' + C.rosa + ';font-weight:700">'
    + esc(t.recover) + '</a></div></td></tr></table>'

    // actualizaciones: mismo sitio, misma clave, siempre la ultima version
    + '<p style="margin:18px 0 0;font:400 13.5px/1.6 ' + SANS + ';color:' + C.suave + '">'
    + esc(t.upd) + ' <a href="' + esc(urlActualizar) + '" style="color:' + C.rosa + ';font-weight:700">'
    + esc(t.updLink) + '</a></p>'

    + '<p style="margin:18px 0 0;font:400 14px/1.6 ' + SANS + ';color:' + C.suave + '">'
    + esc(t.help) + '</p>'
    + '</td></tr>'

    // pie
    + '<tr><td bgcolor="' + C.crema + '" style="background:' + C.crema + ';padding:20px 30px 24px;'
    + 'border-top:1px solid ' + C.linea + ';text-align:' + al + '">'
    + '<p style="margin:0;font:400 11px/1.65 ' + SANS + ';color:' + C.tenue + '">' + esc(t.legal) + '</p>'
    + '<p style="margin:11px 0 0;font:400 11px ' + SANS + ';color:' + C.tenue + '">'
    + '<a href="' + esc(sitio) + '" style="color:' + C.tenue + '">ghoosted.net</a></p>'
    + '</td></tr>'

    + '</table></td></tr></table></body></html>';

  const text = [
    t.hi + ' ' + producto + '.',
    '',
    t.keep,
    '',
    t.label.toUpperCase(),
    '    ' + key,
    '',
    t.dl + ': ' + urlDescarga,
    '',
    t.upd,
    '    ' + urlActualizar,
    '',
    t.steps,
    '1. ' + t.s1t + ' — ' + t.s1,
    '2. ' + t.s2t + ' — ' + t.s2,
    '3. ' + t.s3t + ' — ' + t.s3,
    '',
    t.lost + ' ' + urlRecuperar,
    t.guideCta + ': ' + sitio + '/instalar',
    t.help,
    '',
    t.legal,
    sitio,
  ].join('\n');

  /* El fichero que se adjunta. Un .txt se abre en cualquier sitio, se guarda
     en el movil y sobrevive a que se borre el correo. */
  function ficheroClave() {
    return [
      'Ghoosted — ' + t.label,
      '',
      key,
      '',
      producto,
      t.dl + ': ' + urlDescarga,
      t.lost + ' ' + urlRecuperar,
      '',
      sitio,
    ].join('\r\n');
  }

  return { subject: t.subject(producto), html, text, adjunto: ficheroClave(), nombreAdjunto: 'ghoosted-clave.txt' };
}

module.exports = { correoLicencia, TEXTOS };

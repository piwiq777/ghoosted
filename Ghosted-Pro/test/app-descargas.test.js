'use strict';
/* DESCARGAR HISTORIAS.
 * Un WebView no puede escribir en el telefono: el atributo `download` de un
 * enlace no hace nada sin un DownloadListener, y las URL de Instagram solo
 * las da su CDN si se piden con la cabecera correcta. Asi que la descarga la
 * hace la parte nativa — y eso significa APK nuevo, no solo web.
 * Lo que se comprueba aqui es que las dos mitades encajan y que la nativa no
 * se convierte en un descargador de cualquier cosa. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const APP = path.join(__dirname, '..', '..', 'Ghosted-App');

module.exports = () => {
  const s = suite('descargar historias · app');
  const app = fs.readFileSync(path.join(APP, 'web', 'app.js'), 'utf8');
  const java = fs.readFileSync(path.join(APP, 'android', 'app', 'src', 'main', 'java', 'net', 'ghoosted', 'app', 'MainActivity.java'), 'utf8');
  const manifiesto = fs.readFileSync(path.join(APP, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');

  /* La mitad de arriba. */
  s.ok('hay boton de guardar en el visor', /data-a="bajar-historia"/.test(app));
  s.ok('  y es de Pro', /'bajar-historia': function[\s\S]{0,120}abrirPro\('Descargar historias'\)/.test(app));
  s.ok('  llama a la parte nativa', /P\.nativo\('guardarMedia'/.test(app));
  s.ok('  diciendo si es video, que no se guarda igual', /video: !!it\.isVideo/.test(app));
  s.ok('  y no se puede pulsar dos veces a la vez', /if \(U\.bajando\) return;/.test(app));
  s.ok('  si falla, se dice por que', /No se pudo guardar: ' \+ String\(r && r\.error/.test(app));

  /* La mitad de abajo. Lo importante: que no baje de cualquier sitio. */
  const guardar = java.slice(java.indexOf('private void guardarMedia'), java.indexOf('private static void copiar'));
  s.ok('existe el metodo nativo', /private void guardarMedia/.test(java));
  s.ok('  y esta enchufado al puente', /case "guardarMedia":/.test(java));
  s.ok('SOLO baja de los CDN de Instagram',
    /h\.endsWith\("\.cdninstagram\.com"\) \|\| h\.endsWith\("\.fbcdn\.net"\)/.test(guardar));
  s.ok('  y solo por https', /"https"\.equals\(u\.getScheme\(\)\)/.test(guardar));
  s.ok('  con la misma cabecera que ya usan las fotos',
    /setRequestProperty\("Referer", IG\)/.test(guardar) && /getDefaultUserAgent/.test(guardar));
  s.ok('el nombre del archivo se limpia antes de usarlo',
    /replaceAll\("\[\^A-Za-z0-9\._-\]", ""\)/.test(guardar));
  s.ok('no se guarda nada si la respuesta no es 200', /getResponseCode\(\) != 200\) throw/.test(guardar));
  s.ok('va en otro hilo, que baja megas', /new Thread\(\(\) -> \{/.test(guardar));

  /* Permisos: en Android 10+ no hace falta ninguno. Pedirlo siempre seria
     pedir acceso a TODAS las fotos del telefono para nada. */
  s.ok('el permiso de escritura solo para Android 9 o menos',
    /WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28"/.test(manifiesto));
  s.ok('  y el codigo usa MediaStore a partir de Android 10',
    /Build\.VERSION\.SDK_INT >= 29/.test(guardar) && /MediaStore\.MediaColumns\.RELATIVE_PATH/.test(guardar));

  return s;
};

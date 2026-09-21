package net.ghoosted.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Ghoosted en el movil.
 *
 * Dos vistas web, una encima de otra:
 *  - ig: instagram.com de verdad. Ahi inicias sesion en la pagina oficial (la
 *    contraseña va a Instagram y a nadie mas) y ahi se inyectan page-api.js e
 *    ig-api.js de la extension, tal cual, mas puente-ig.js.
 *  - ui: el diseño de Ghoosted, servido desde los assets de la app.
 *
 * Esta clase solo pasa mensajes entre las dos y hace lo que una pagina web
 * no puede: abrir Instagram, avisar con una notificacion y traer las fotos.
 */
public class MainActivity extends Activity {

    private static final String ORIGEN = "https://appassets.androidplatform.net";
    private static final String INICIO = ORIGEN + "/web/index.html";
    private static final String IG = "https://www.instagram.com/";

    private WebView ui, ig;
    private LinearLayout capaIg;
    private TextView tituloIg;
    private boolean paraEntrar = false;   // la capa de Instagram se abrio para iniciar sesion
    private boolean conectado = false;
    private String scriptsIg = null;
    private boolean oscuro = false;
    private boolean igArriba = false;
    private boolean igFallo = false;      // la ultima carga de Instagram no llego (sin red al arrancar)
    /* LA PAGINA DE INSTAGRAM TARDA EN ESTAR LISTA, Y LAS LLAMADAS NO ESPERABAN.
       Se pedia el dato en el mismo instante en que se mandaba a recargar la
       pagina: la recarga es asincrona, asi que la llamada caia en una pagina
       a medio cargar y se perdia. De ahi los dos errores que se veian —
       "ig_no_listo" cuando el puente aun no estaba, y un plantón de cuatro
       minutos cuando no habia ni con quien hablar.
       Ahora hay una cola: si la pagina no esta lista, la llamada espera, y se
       suelta en cuanto termina de cargar. */
    private boolean igListo = false;
    private final java.util.ArrayList<String> igCola = new java.util.ArrayList<>();
    private int insArriba = 0, insAbajo = 0;
    private Actualizador act;

    @Override
    protected void onCreate(Bundle guardado) {
        super.onCreate(guardado);
        act = new Actualizador(this);
        FrameLayout raiz = new FrameLayout(this);

        ig = new WebView(this);
        ui = new WebView(this);
        prepararIg();
        prepararUi();

        // La vista de Instagram, con una barrita arriba para cerrarla.
        capaIg = new LinearLayout(this);
        capaIg.setOrientation(LinearLayout.VERTICAL);
        capaIg.setBackgroundColor(Color.WHITE);
        LinearLayout barra = new LinearLayout(this);
        barra.setGravity(Gravity.CENTER_VERTICAL);
        int p = dp(14);
        barra.setPadding(p, dp(8), dp(6), dp(8));
        tituloIg = new TextView(this);
        tituloIg.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        tituloIg.setTextColor(0xFF63636B);
        // Para volver a Ghoosted: su propio logo, no un "Listo" de texto.
        android.widget.ImageView cerrar = new android.widget.ImageView(this);
        cerrar.setImageResource(R.mipmap.ic_launcher);
        cerrar.setContentDescription("Volver a Ghoosted");
        cerrar.setPadding(dp(8), dp(4), dp(8), dp(4));
        cerrar.setOnClickListener(v -> ocultarIg());
        LinearLayout.LayoutParams lpLogo = new LinearLayout.LayoutParams(dp(50), dp(42));
        barra.addView(tituloIg, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        barra.addView(cerrar, lpLogo);
        capaIg.addView(barra, new LinearLayout.LayoutParams(-1, -2));
        capaIg.addView(ig, new LinearLayout.LayoutParams(-1, 0, 1));

        raiz.addView(capaIg, new FrameLayout.LayoutParams(-1, -1));
        raiz.addView(ui, new FrameLayout.LayoutParams(-1, -1));
        setContentView(raiz);
        // Android 15 dibuja la app por debajo de las barras del sistema. La
        // capa de Instagram se aparta sola; al diseño se le pasan las medidas
        // para que las use como la zona segura del iPhone.
        raiz.setOnApplyWindowInsetsListener((v, ins) -> {
            int arriba, abajo;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets b = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets t = ins.getInsets(WindowInsets.Type.ime());
                arriba = b.top; abajo = Math.max(b.bottom, t.bottom);
            } else { arriba = ins.getSystemWindowInsetTop(); abajo = ins.getSystemWindowInsetBottom(); }
            insArriba = arriba; insAbajo = abajo;
            capaIg.setPadding(0, arriba, 0, abajo);
            margenesUi();
            return ins;
        });
        // La de Instagram trabaja detras, sin verse, hasta que haga falta.
        capaIg.setVisibility(View.INVISIBLE);

        ig.loadUrl(IG);
        ui.loadUrl(INICIO);
        pedirPermisoAvisos();
        buscar(false, null);
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    /* ---------------------------------------------------------------- vistas */

    private void prepararUi() {
        WebSettings s = ui.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        ui.setBackgroundColor(Color.TRANSPARENT);
        ui.addJavascriptInterface(new PuenteUi(), "GhdNativo");
        ui.setWebChromeClient(new WebChromeClient());
        ui.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!ORIGEN.equals(u.getScheme() + "://" + u.getHost())) return null;
                if ("/foto".equals(u.getPath())) return foto(u.getQueryParameter("u"));
                return asset(u.getPath());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                // La vista del diseño no navega a ningun sitio: lo de fuera se
                // abre fuera.
                Uri u = r.getUrl();
                if (u.toString().startsWith(ORIGEN)) return false;
                abrirFuera(u.toString());
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                // El lienzo mide 58 px arriba contando la barra de estado del
                // iPhone; aqui la barra de estado va aparte.
                margenesUi();
                if (conectado) aUi(sesionJson());
            }
        });
    }

    private void margenesUi() {
        float d = getResources().getDisplayMetrics().density;
        ui.evaluateJavascript("(function(s){s.setProperty('--sa-top','" + Math.round(insArriba / d) + "px');s.setProperty('--sa-bot','"
                + Math.round(insAbajo / d) + "px');s.setProperty('--arriba','18px');document.documentElement.setAttribute('data-plataforma','android')})(document.documentElement.style)", null);
    }

    private void prepararIg() {
        WebSettings s = ig.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // El agente de usuario se deja tal cual. Cambiarlo para parecer Chrome
        // hacia que Instagram viera dos navegadores distintos (el texto decia
        // Chrome y las cabeceras Client Hints seguian diciendo WebView) y
        // cortara las listas a medias con "useragent mismatch".
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(ig, true);
        ig.addJavascriptInterface(new PuenteIg(), "GhdNativoIG");
        ig.setWebChromeClient(new WebChromeClient());
        ig.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                // Dentro solo Instagram (y el login de Facebook, que Instagram
                // usa para "Continuar con Facebook"). El resto, al navegador.
                String h = r.getUrl().getHost();
                if (h != null && (h.endsWith("instagram.com") || h.endsWith("facebook.com") || h.endsWith("fbcdn.net"))) return false;
                abrirFuera(r.getUrl().toString());
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                inyectar();
                igListo = true;
                soltarCola();
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) igFallo = true;
            }

            @Override
            public void onPageStarted(WebView v, String url, android.graphics.Bitmap f) { igFallo = false; igListo = false; }
        });
    }

    /* Los tres scripts, en orden. page-api.js e ig-api.js no llevan guarda
       contra dobles cargas, asi que se la pone aqui: Instagram cambia de
       pagina sin recargar, pero cuando recarga hay que volver a meterlos. */
    private void inyectar() {
        String h = ig.getUrl() == null ? "" : Uri.parse(ig.getUrl()).getHost();
        if (h == null || !h.endsWith("instagram.com")) return;
        if (scriptsIg == null) {
            /* La condicion mira si existe GhostedIG, no una marca aparte.
               Antes era `if(!__ghdCargado){__ghdCargado=1; ...}`: la marca se
               ponia ANTES de ejecutar los dos ficheros, asi que si alguno
               reventaba a mitad, la marca se quedaba puesta y GhostedIG no se
               definia nunca mas en esa pagina. Todas las llamadas contestaban
               "ig_no_listo" y no habia salida salvo recargar a mano.
               Mirando lo que de verdad hace falta, un fallo se arregla solo en
               la siguiente inyeccion. */
            scriptsIg = "window.__ghdAppId=window.__ghdAppId||'1217981644879628';window.__ghdTope={min:2500,hora:60,dia:600};\nif(!window.GhostedIG){\n" + leer("ig/page-api.js") + "\n" + leer("ig/ig-api.js") + "\n}\n" + leer("ig/puente-ig.js");
        }
        ig.evaluateJavascript(scriptsIg, null);
    }

    /* --------------------------------------------------------------- puentes */

    /** Lo que manda la vista del diseño. */
    private class PuenteUi {
        @JavascriptInterface
        public void enviar(String s) {
            runOnUiThread(() -> {
                try {
                    JSONObject m = new JSONObject(s);
                    String tipo = m.optString("tipo");
                    if ("llamar".equals(tipo)) {
                        pedirAIg(s);
                    } else if ("nativo".equals(tipo)) {
                        orden(m.optString("id"), m.optString("orden"), m.optJSONObject("datos"));
                    }
                } catch (Exception e) { /* mensaje roto: se ignora */ }
            });
        }
    }

    /** Manda una llamada a la vista de Instagram, esperando si hace falta.
        Si la pagina no esta cargada todavia, la llamada se guarda y sale en
        cuanto lo este: antes se lanzaba igual y se perdia por el camino. */
    private void pedirAIg(String mensaje) {
        String url = ig.getUrl();
        boolean enInstagram = url != null && Uri.parse(url).getHost() != null
                && Uri.parse(url).getHost().endsWith("instagram.com");
        if (igFallo || !enInstagram) {
            igCola.add(mensaje);
            igFallo = false;
            igListo = false;
            ig.loadUrl(IG);
            return;
        }
        if (!igListo) { igCola.add(mensaje); return; }
        lanzarAIg(mensaje);
    }

    /** Suelta lo que estaba esperando a que la pagina acabara de cargar. */
    private void soltarCola() {
        if (igCola.isEmpty()) return;
        java.util.ArrayList<String> copia = new java.util.ArrayList<>(igCola);
        igCola.clear();
        for (String m : copia) lanzarAIg(m);
    }

    /** Mete el guion si falta y hace la llamada. La llamada va DENTRO del
        callback, cuando ya se sabe si hubo que inyectar o no. */
    private void lanzarAIg(String mensaje) {
        String id;
        try { id = new JSONObject(mensaje).optString("id"); } catch (Exception e) { return; }
        String q = JSONObject.quote(mensaje);
        String falla;
        try {
            falla = JSONObject.quote(new JSONObject()
                    .put("tipo", "resultado").put("id", id).put("ok", false)
                    .put("error", new JSONObject().put("kind", "transport").put("message", "ig_no_listo")).toString());
        } catch (Exception e) { return; }
        String llamada = "window.GhdIGRecibir ? GhdIGRecibir(" + q + ") : GhdNativoIG.aApp(" + falla + ")";
        // Se comprueban LAS DOS: el puente y la API. Con solo el puente, la
        // pagina contestaba "no listo" sin que nadie volviera a inyectar nada.
        ig.evaluateJavascript("!!(window.GhdIGRecibir && window.GhostedIG)", v -> {
            if (!"true".equals(v)) {
                inyectar();
                // Se le da un respiro a la inyeccion antes de pedirle nada:
                // evaluateJavascript no garantiza que lo anterior haya
                // terminado de ejecutarse.
                ig.postDelayed(() -> ig.evaluateJavascript(llamada, null), 250);
            } else {
                ig.evaluateJavascript(llamada, null);
            }
        });
    }

    /** Lo que manda la vista de Instagram (puente-ig.js). Se reenvia tal cual:
        la vista del diseño lo trata como datos de un tercero. */
    private class PuenteIg {
        @JavascriptInterface
        public void aApp(String s) {
            runOnUiThread(() -> {
                try {
                    JSONObject m = new JSONObject(s);
                    if ("sesion".equals(m.optString("tipo"))) {
                        boolean antes = conectado;
                        conectado = m.optBoolean("conectado");
                        // Recien entrado: la capa de login se quita sola.
                        if (conectado && !antes && paraEntrar) ocultarIg();
                    }
                } catch (Exception e) { return; }
                aUi(s);
            });
        }
    }

    private void aUi(String s) { ui.evaluateJavascript("window.Puente && Puente.recibir(" + JSONObject.quote(s) + ")", null); }

    private String sesionJson() {
        try { return new JSONObject().put("tipo", "sesion").put("conectado", conectado).put("yo", galleta("ds_user_id")).toString(); }
        catch (Exception e) { return "{}"; }
    }

    private String galleta(String nombre) {
        String c = CookieManager.getInstance().getCookie(IG);
        if (c == null) return null;
        for (String p : c.split(";")) {
            String[] kv = p.trim().split("=", 2);
            if (kv.length == 2 && kv[0].equals(nombre)) return kv[1];
        }
        return null;
    }

    private void orden(String id, String orden, JSONObject d) {
        Object valor = null;
        switch (orden) {
            case "buscarActualizacion":
                buscar(true, id);
                return;   // contesta cuando termina
            case "aplicarActualizacion":
                // La web nueva ya esta en su carpeta: se recargan las dos vistas.
                scriptsIg = null;
                ig.reload();
                ui.reload();
                return;
            case "instalarApk":
                new Thread(() -> {
                    try {
                        JSONObject c = act.comprobar();
                        act.instalarApk(c.getJSONObject("manifiesto"));
                    } catch (Exception e) {
                        runOnUiThread(() -> aUi("{\"tipo\":\"actualizacion\",\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}"));
                    }
                }).start();
                break;
            case "version":
                try { valor = new JSONObject().put("web", act.versionWeb()).put("apk", act.versionApk()); } catch (Exception e) { /* nada */ }
                break;
            case "mostrarInstagram":
                paraEntrar = !conectado;
                mostrarIg();
                break;
            case "abrir":
                if (d != null) abrirFuera(d.optString("url"));
                break;
            case "notificar":
                if (d != null) avisar(d.optString("titulo"), d.optString("texto"));
                break;
            case "tema":
                oscuro = d != null && d.optBoolean("oscuro");
                pintarBarras();
                break;
            case "cerrarSesion":
                CookieManager.getInstance().removeAllCookies(ok -> {
                    CookieManager.getInstance().flush();
                    conectado = false;
                    ig.loadUrl(IG);
                    aUi(sesionJson());
                });
                break;
            case "guardarMedia":
                // Contesta cuando termina de bajarlo: puede tardar.
                guardarMedia(id, d);
                return;
            case "salirApp":
                moveTaskToBack(true);
                break;
            default:
                break;
        }
        try {
            aUi(new JSONObject().put("tipo", "resultado").put("id", id).put("ok", true).put("valor", valor == null ? JSONObject.NULL : valor).toString());
        } catch (Exception e) { /* nada */ }
    }

    /** GUARDAR UNA HISTORIA EN LA GALERIA.
        Se baja aqui y no en la vista web porque un WebView no puede escribir
        en el telefono: el atributo `download` de un enlace no hace nada sin
        un DownloadListener, y las URL de Instagram no se abren desde fuera.
        Se piden con la misma cabecera que las fotos (ver foto()), que es lo
        que hace que su CDN las de.
        En Android 10 y posteriores se escribe por MediaStore y no hace falta
        ningun permiso; en los anteriores, a la carpeta publica de imagenes,
        con el permiso de siempre. */
    private void guardarMedia(String id, JSONObject d) {
        final String url = d == null ? "" : d.optString("url");
        final boolean video = d != null && d.optBoolean("video");
        final String quien = d == null ? "" : d.optString("de", "historia");
        new Thread(() -> {
            String error = null, donde = null;
            try {
                Uri u = Uri.parse(url);
                String h = u.getHost();
                if (!"https".equals(u.getScheme()) || h == null
                        || !(h.endsWith(".cdninstagram.com") || h.endsWith(".fbcdn.net"))) {
                    throw new Exception("origen no permitido");
                }
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(60000);
                c.setRequestProperty("User-Agent", WebSettings.getDefaultUserAgent(this));
                c.setRequestProperty("Referer", IG);
                if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());

                String limpio = quien.replaceAll("[^A-Za-z0-9._-]", "");
                if (limpio.isEmpty()) limpio = "historia";
                String nombre = "ghoosted-" + limpio + "-" + System.currentTimeMillis() + (video ? ".mp4" : ".jpg");
                String tipo = video ? "video/mp4" : "image/jpeg";

                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, nombre);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, tipo);
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH,
                            (video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES) + "/Ghoosted");
                    v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                    Uri destino = getContentResolver().insert(
                            video ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                                  : MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                    if (destino == null) throw new Exception("no se pudo crear el archivo");
                    try (InputStream in = c.getInputStream();
                         OutputStream out = getContentResolver().openOutputStream(destino)) {
                        copiar(in, out);
                    }
                    v.clear();
                    v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    getContentResolver().update(destino, v, null, null);
                } else {
                    File carpeta = new File(Environment.getExternalStoragePublicDirectory(
                            video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES), "Ghoosted");
                    if (!carpeta.exists() && !carpeta.mkdirs()) throw new Exception("sin permiso para guardar");
                    File f = new File(carpeta, nombre);
                    try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(f)) {
                        copiar(in, out);
                    }
                    // Para que salga en la galeria sin reiniciar el telefono.
                    sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(f)));
                }
                donde = video ? "Vídeos/Ghoosted" : "Fotos/Ghoosted";
            } catch (Exception e) {
                error = String.valueOf(e.getMessage());
            }
            final String err = error, dnd = donde;
            runOnUiThread(() -> {
                try {
                    JSONObject v = new JSONObject();
                    if (err == null) v.put("ok", true).put("donde", dnd); else v.put("ok", false).put("error", err);
                    aUi(new JSONObject().put("tipo", "resultado").put("id", id).put("ok", true).put("valor", v).toString());
                } catch (Exception e) { /* nada */ }
            });
        }).start();
    }

    private static void copiar(InputStream in, OutputStream out) throws Exception {
        byte[] b = new byte[16384];
        int n;
        while ((n = in.read(b)) > 0) out.write(b, 0, n);
        out.flush();
    }

    /** Mira si hay version nueva. Si es de la web, la baja y la deja lista;
        si es del APK, avisa para que se pulse "Actualizar la app". */
    private void buscar(boolean aMano, String id) {
        new Thread(() -> {
            JSONObject r = new JSONObject();
            try {
                JSONObject c = act.comprobar();
                boolean web = c.optBoolean("web"), apk = c.optBoolean("apk");
                if (web) act.instalarWeb(c.getJSONObject("manifiesto"));
                r.put("tipo", "actualizacion").put("web", web).put("apk", apk).put("version", act.versionWeb());
            } catch (Exception e) {
                try { r.put("tipo", "actualizacion").put("error", String.valueOf(e.getMessage())); } catch (Exception x) { /* nada */ }
            }
            runOnUiThread(() -> {
                if (id != null) {
                    try { aUi(new JSONObject().put("tipo", "resultado").put("id", id).put("ok", true).put("valor", r).toString()); } catch (Exception e) { /* nada */ }
                } else if (r.optBoolean("web") || r.optBoolean("apk")) {
                    aUi(r.toString());
                }
            });
        }).start();
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        // El instalador de Android contesta aqui: si pide confirmacion, se la
        // enseñamos.
        if ("net.ghoosted.app.INSTALADO".equals(i.getAction())
                && i.getIntExtra(android.content.pm.PackageInstaller.EXTRA_STATUS, -99) == android.content.pm.PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmar = i.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmar != null) startActivity(confirmar);
        }
    }

    /* -------------------------------------------------------- capa Instagram */

    private void mostrarIg() {
        tituloIg.setText(conectado ? "Instagram" : "Entra con tu cuenta de Instagram");
        // Sin sesion, directo al formulario de entrar (la portada de Instagram
        // solo ofrece "Abrir la app"). Y si la vista se quedo en una respuesta
        // de la API en vez de en una pagina, se vuelve al inicio.
        String act = ig.getUrl() == null ? "" : ig.getUrl();
        if (!conectado && !act.contains("/accounts/")) ig.loadUrl(IG + "accounts/login/");
        else if (act.contains("/api/") || act.contains("/graphql/")) ig.loadUrl(IG);
        igArriba = true;
        capaIg.setVisibility(View.VISIBLE);
        capaIg.bringToFront();
        if (ig.getUrl() == null || igFallo) ig.loadUrl(IG);
    }

    private void ocultarIg() {
        paraEntrar = false;
        igArriba = false;
        ui.bringToFront();
        capaIg.setVisibility(View.INVISIBLE);
        inyectar();
    }

    @Override
    public void onBackPressed() {
        if (igArriba) {
            if (ig.canGoBack()) ig.goBack(); else ocultarIg();
            return;
        }
        aUi("{\"tipo\":\"atras\"}");
    }

    @Override
    protected void onResume() {
        super.onResume();
        ig.onResume(); ui.onResume();
        if (igFallo) ig.loadUrl(IG);
        aUi("{\"tipo\":\"volver\"}");
    }

    @Override
    protected void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    /* ----------------------------------------------------------------- otros */

    private void abrirFuera(String url) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { /* sin app */ }
    }

    private void pintarBarras() {
        Window w = getWindow();
        int c = oscuro ? 0xFF09090B : 0xFFF6F5F8;
        w.setStatusBarColor(c);
        w.setNavigationBarColor(c);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController ic = w.getInsetsController();
            if (ic != null) {
                int claras = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                ic.setSystemBarsAppearance(oscuro ? 0 : claras, claras);
            }
        } else {
            int f = oscuro ? 0 : (View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            w.getDecorView().setSystemUiVisibility(f);
        }
    }

    private void pedirPermisoAvisos() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("avisos", "Avisos de Ghoosted", NotificationManager.IMPORTANCE_DEFAULT));
    }

    private void avisar(String titulo, String texto) {
        Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, "avisos")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(titulo)
                .setContentText(texto)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();
        getSystemService(NotificationManager.class).notify((int) (System.currentTimeMillis() % 100000), n);
    }

    private static final Map<String, String> TIPOS = new HashMap<>();
    static {
        TIPOS.put("html", "text/html"); TIPOS.put("js", "application/javascript"); TIPOS.put("css", "text/css");
        TIPOS.put("woff2", "font/woff2"); TIPOS.put("png", "image/png"); TIPOS.put("svg", "image/svg+xml"); TIPOS.put("json", "application/json");
    }

    /** Sirve /web/... desde los assets. Solo /web: los scripts de /ig son para
        la otra vista y no se exponen aqui. */
    private WebResourceResponse asset(String ruta) {
        if (ruta == null || !ruta.startsWith("/web/") || ruta.contains("..")) return new WebResourceResponse("text/plain", "utf-8", 404, "No", null, null);
        try {
            InputStream in = act.abrir(ruta.substring(1));
            String ext = ruta.substring(ruta.lastIndexOf('.') + 1);
            String tipo = TIPOS.containsKey(ext) ? TIPOS.get(ext) : "application/octet-stream";
            return new WebResourceResponse(tipo, tipo.startsWith("text") || tipo.endsWith("javascript") ? "utf-8" : null, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "No", null, null);
        }
    }

    /** Las fotos y videos de Instagram, pedidos desde aqui. Instagram no deja
        que otra web los incruste, pero al telefono se los da. Solo sus CDN. */
    private WebResourceResponse foto(String url) {
        try {
            Uri u = Uri.parse(url);
            String h = u.getHost();
            if (!"https".equals(u.getScheme()) || h == null || !(h.endsWith(".cdninstagram.com") || h.endsWith(".fbcdn.net"))) {
                return new WebResourceResponse("text/plain", "utf-8", 403, "No", null, null);
            }
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setRequestProperty("User-Agent", WebSettings.getDefaultUserAgent(this));
            c.setRequestProperty("Referer", IG);
            int st = c.getResponseCode();
            String tipo = c.getContentType() == null ? "image/jpeg" : c.getContentType().split(";")[0];
            Map<String, String> cab = new HashMap<>();
            cab.put("Cache-Control", "max-age=86400");
            return new WebResourceResponse(tipo, null, st, st == 200 ? "OK" : "Error", cab, c.getInputStream());
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 502, "Error", null, null);
        }
    }

    private String leer(String ruta) {
        try (InputStream in = act.abrir(ruta)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return "";
        }
    }
}

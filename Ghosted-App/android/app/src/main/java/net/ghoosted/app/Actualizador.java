package net.ghoosted.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageInfo;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Iterator;

/**
 * Actualizaciones sin reinstalar.
 *
 * El diseño y el motor (web/ e ig/) son archivos: se bajan de
 * https://www.ghoosted.net/movil/, se comprueba cada uno con su sha256 del
 * manifiesto, y la app los usa en lugar de los que trae dentro. Solo de ese
 * dominio y solo por HTTPS.
 *
 * Si lo que cambia es la parte nativa (esta carpeta java/), hace falta un APK
 * nuevo: se baja y se le pasa al instalador de Android, que pide confirmar.
 */
final class Actualizador {
    static final String BASE = "https://www.ghoosted.net/movil/";
    private final Context ctx;
    private final SharedPreferences prefs;

    Actualizador(Context c) {
        ctx = c;
        prefs = c.getSharedPreferences("ghd_actualiza", Context.MODE_PRIVATE);
    }

    /** Version de web/ que viene dentro del APK. */
    int versionIncluida() {
        try {
            JSONObject j = new JSONObject(new String(leerTodo(ctx.getAssets().open("web/version.json")), "UTF-8"));
            return j.optInt("version", 0);
        } catch (Exception e) { return 0; }
    }

    /** Carpeta con la version descargada en uso, o null si se usa la del APK. */
    File carpetaActiva() {
        int v = prefs.getInt("web", 0);
        if (v <= versionIncluida()) return null;
        File d = new File(ctx.getFilesDir(), "web-" + v);
        return d.isDirectory() ? d : null;
    }

    int versionWeb() { return Math.max(prefs.getInt("web", 0), versionIncluida()); }

    int versionApk() {
        try {
            PackageInfo p = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            return (int) p.getLongVersionCode();
        } catch (Exception e) { return 0; }
    }

    /** Abre un archivo: primero el descargado, si no el del APK. */
    InputStream abrir(String ruta) throws Exception {
        File d = carpetaActiva();
        if (d != null) {
            File f = new File(d, ruta);
            if (f.getCanonicalPath().startsWith(d.getCanonicalPath() + File.separator) && f.isFile()) return new FileInputStream(f);
        }
        return ctx.getAssets().open(ruta);
    }

    /** Mira el manifiesto. Devuelve {web: hay/no, apk: hay/no}. Bloquea: llamar fuera del hilo principal. */
    JSONObject comprobar() throws Exception {
        JSONObject m = new JSONObject(new String(bajar(BASE + "manifest.json"), "UTF-8"));
        JSONObject r = new JSONObject();
        JSONObject w = m.optJSONObject("web");
        JSONObject a = m.optJSONObject("apk");
        r.put("web", w != null && w.optInt("version") > versionWeb());
        r.put("apk", a != null && a.optInt("versionCode") > versionApk());
        r.put("manifiesto", m);
        return r;
    }

    /** Baja la web nueva entera, la verifica y la deja activa para la proxima carga. */
    boolean instalarWeb(JSONObject manifiesto) throws Exception {
        JSONObject w = manifiesto.getJSONObject("web");
        int v = w.getInt("version");
        JSONObject archivos = w.getJSONObject("archivos");
        File tmp = new File(ctx.getFilesDir(), "web-" + v + ".tmp");
        borrar(tmp);
        Iterator<String> it = archivos.keys();
        while (it.hasNext()) {
            String ruta = it.next();
            if (ruta.contains("..") || !(ruta.startsWith("web/") || ruta.startsWith("ig/"))) throw new Exception("ruta rara: " + ruta);
            byte[] datos = bajar(BASE + ruta);
            if (!sha256(datos).equalsIgnoreCase(archivos.getString(ruta))) throw new Exception("no coincide: " + ruta);
            File f = new File(tmp, ruta);
            f.getParentFile().mkdirs();
            try (OutputStream o = new FileOutputStream(f)) { o.write(datos); }
        }
        File fin = new File(ctx.getFilesDir(), "web-" + v);
        borrar(fin);
        if (!tmp.renameTo(fin)) throw new Exception("no se pudo mover");
        int antes = prefs.getInt("web", 0);
        prefs.edit().putInt("web", v).apply();
        if (antes > 0 && antes != v) borrar(new File(ctx.getFilesDir(), "web-" + antes));
        return true;
    }

    /** Baja el APK nuevo y se lo pasa al instalador de Android. */
    void instalarApk(JSONObject manifiesto) throws Exception {
        JSONObject a = manifiesto.getJSONObject("apk");
        String url = a.getString("url");
        if (!url.startsWith(BASE)) throw new Exception("url rara");
        byte[] apk = bajar(url);
        if (!sha256(apk).equalsIgnoreCase(a.getString("sha256"))) throw new Exception("apk no coincide");
        PackageInstaller pi = ctx.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams sp = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        int id = pi.createSession(sp);
        try (PackageInstaller.Session s = pi.openSession(id)) {
            try (OutputStream o = s.openWrite("ghoosted.apk", 0, apk.length)) { o.write(apk); s.fsync(o); }
            Intent i = new Intent(ctx, MainActivity.class).setAction("net.ghoosted.app.INSTALADO");
            PendingIntent p = PendingIntent.getActivity(ctx, 7, i, PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            s.commit(p.getIntentSender());
        }
    }

    /* ------------------------------------------------------------------ */

    private static byte[] bajar(String url) throws Exception {
        if (!url.startsWith(BASE)) throw new Exception("solo ghoosted.net");
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(60000);
        c.setUseCaches(false);
        c.setRequestProperty("Cache-Control", "no-cache");
        if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode() + " " + url);
        try (InputStream in = c.getInputStream()) { return leerTodo(in); }
    }

    static byte[] leerTodo(InputStream in) throws Exception {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        byte[] b = new byte[16384];
        int n;
        while ((n = in.read(b)) > 0) o.write(b, 0, n);
        in.close();
        return o.toByteArray();
    }

    private static String sha256(byte[] d) throws Exception {
        byte[] h = MessageDigest.getInstance("SHA-256").digest(d);
        StringBuilder s = new StringBuilder();
        for (byte x : h) s.append(String.format("%02x", x));
        return s.toString();
    }

    private static void borrar(File f) {
        if (f == null || !f.exists()) return;
        File[] hijos = f.listFiles();
        if (hijos != null) for (File h : hijos) borrar(h);
        f.delete();
    }
}

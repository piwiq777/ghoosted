# Ghoosted — para empezar en otro ordenador

Dile a Claude: **"lee EMPEZAR-AQUI.md y sigue"**.

## Qué es esto

- **Ghosted-App** — app de Android (WebView + Instagram). Es el producto.
- **Ghosted-Landing** — la web, ghoosted.net (Vercel).
- **Ghosted-Pro** — la extensión de Chrome. Sus `src/page-api.js` e
  `ig-api.js` los usa TAMBIÉN la app: si los tocas, tocas las dos cosas.
  Los tests de todo el proyecto están aquí: `cd Ghosted-Pro && npm test`.

## Ramas

- `marca-v1` — donde se trabaja.
- `main` — lo que está publicado. **Empujar a main despliega producción.**

## Publicar una versión de la app

```bash
cd Ghosted-App && python3 tools/publicar.py          # solo web
cd Ghosted-App && python3 tools/publicar.py --apk    # además APK nuevo
```

Luego llevar `Ghosted-Landing/movil` y `Ghosted-App` a `main` y empujar.
La app se actualiza sola al abrirla.

## Reglas que ya costaron caro

- **Instagram restringió la cuenta dos veces.** Una revisión automática al
  día (9:00) y una manual más pasadas 6 h. No subir eso.
- Cerrar sesión y volver a entrar crea una sesión nueva en Instagram: es lo
  que dispara "no puedes crear varias sesiones". Evitarlo.
- El tope de peticiones vive en `window.__ghdTope` y lo lee page-api en cada
  petición. Se puede cambiar desde `Ghosted-App/ig/puente-ig.js` sin APK.
- Si algo falla, mirar el **Diagnóstico** de la app: dice cuánto se ha
  pedido ya y los últimos errores con su código.

## Cuentas y planes

Supabase, proyecto **`demos`** (`igqpjbdkrhrwhwelvuip`), no uno llamado
ghoosted. Tablas `perfiles` y `concesiones` en `public`.

## Lo que NO está en el repositorio (hay que llevarlo a mano)

- `Ghosted-Landing/.env.local` — claves de Stripe.
- `Ghosted-Landing/.vercel/`
- `~/.android/debug.keystore` — **la llave que firma el APK**. Si compilas
  con otra, la actualización no se instala encima. PENDIENTE: crear una
  llave de firma de verdad y guardarla aparte.

## Pendiente

1. Llave de firma propia del APK (lo más urgente).
2. Servidor de correo (Resend/Brevo): sin él no hay "olvidé mi contraseña"
   y el registro va con 2 correos/hora.
3. La web de `marca-v1` dice "sin cuenta, sin contraseña" en 11 idiomas y
   ya no es verdad: hay que reescribirlo.
4. Stripe: la web dice precios al año y el backend entrega clave de por
   vida. **No publicar la web hasta arreglarlo.**

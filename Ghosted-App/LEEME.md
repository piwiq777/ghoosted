# Ghoosted — app del móvil

La app de Android y de iPhone. Revisa Instagram desde el propio móvil, sin
Chrome y sin ordenador.

## Cómo funciona

Dos vistas web dentro de la app:

- **Instagram** (`instagram.com` de verdad): ahí inicias sesión en la página
  oficial. La contraseña va a Instagram y no pasa por Ghoosted. Dentro se
  cargan `page-api.js` e `ig-api.js` de la extensión (`Ghosted-Pro/src`), los
  mismos archivos que la extensión, y `ig/puente-ig.js`.
- **El diseño** (`web/`): el lienzo "Ghoosted — iOS light", pantalla por
  pantalla. `web/motor.js` hace la revisión igual que la extensión: seguidores,
  quién se fue, quién llegó, seguidos, espectadores, solicitudes, cuentas
  vigiladas. Todo se guarda en el móvil.

`page-api.js` e `ig-api.js` no están copiados en este directorio: se copian al
compilar, así que un arreglo en la extensión también llega a la app.

## Ver el diseño sin móvil

    cd web && python3 -m http.server 5190

y abre http://localhost:5190 (sale con datos de ejemplo).

## Android

Hace falta el Android SDK en `~/Android/Sdk` y Java 21.

    cd android
    JAVA_HOME=~/.local/opt/jdk21 ./gradlew assembleRelease

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. Se
instala en el móvil a mano. Antes, activa "Instalar apps desconocidas" para el
navegador o el explorador de archivos.

Para publicarla en la Play Store hace falta firmarla con una clave propia (no
la de depuración) y una cuenta de desarrollador de Google (25 $ una vez).

## iPhone

Hace falta un Mac con Xcode y XcodeGen:

    cd ios
    ./preparar.sh
    xcodegen
    open Ghoosted.xcodeproj

Para probarla en tu iPhone basta con tu Apple ID gratis, pero la instalación
caduca a los 7 días. Para que otros la instalen hace falta la cuenta de
desarrollador de Apple (99 €/año) y pasar por TestFlight o la App Store.

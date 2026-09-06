# Cuando Instagram cambia algo y la app deja de funcionar

Esto pasará. No es una posibilidad remota: Instagram toca su API sin avisar y
alguna función se cae. Lo que sigue es qué hacer, y **cuánto tarda de verdad**
en llegarle el arreglo a la gente.

La respuesta corta es incómoda pero conviene saberla antes de venderlo:

> **No se puede parchear a distancia.** Chrome prohíbe que una extensión
> descargue y ejecute código nuevo (Manifest V3, "no remote code"). Es un
> límite de la plataforma, no de cómo esté montado esto. Cualquiera que te
> prometa arreglos instantáneos te está contando un cuento.

Lo que sí se puede es **arreglar rápido y avisar al instante**. Eso ya está
construido.

---

## Lo que ya funciona hoy

**El canal de avisos.** Cada seis horas la extensión pregunta a
`https://ghoosted.net/api/status`. Ese endpoint devuelve tres cosas, que salen
de `Ghosted-Landing/lib/status.json`:

    {
      "latest":  "1.57.0",   ← hay versión nueva: banner normal
      "minimum": "1.51.0",   ← por debajo de esto, banner rojo de "está rota"
      "notice":  null        ← mensaje libre, en cualquier idioma
    }

Editas ese fichero, despliegas, y **en menos de seis horas lo ve todo el
mundo**. Sin tocar código y sin que nadie reinstale nada.

**La entrega.** `api/download.js` sirve el ZIP contra una clave de licencia
válida. El comprador vuelve a su enlace y se baja la versión nueva.

---

## El procedimiento, paso a paso

### 1. Avisar primero, arreglar después

Antes de tocar una línea de código, di lo que pasa. Edita
`Ghosted-Landing/lib/status.json`:

    "notice": {
      "id": "2026-09-historias",
      "level": "warn",
      "text": {
        "es": "Instagram ha cambiado algo y las historias no cargan. Estamos en ello.",
        "en": "Instagram changed something and stories aren't loading. We're on it."
      }
    }

Despliega la web. En seis horas como mucho, todos tus usuarios saben que lo
sabes. Esto vale más de lo que parece: la diferencia entre "está rota" y
"está rota y ya están arreglándolo" es la diferencia entre una reseña de una
estrella y una de cuatro.

El `id` importa: cuando alguien cierra el aviso, se guarda ese id y no vuelve
a salir. Cambia el id y vuelve a aparecer.

### 2. Arreglar en Ghosted-Pro

Pro es la fuente de verdad. Se toca ahí, siempre.

    cd Ghosted-Pro
    node test/run.js          # 265 comprobaciones, tienen que pasar
    node tools/construir-plus.js

### 3. Subir la versión

En `Ghosted-Pro/manifest.json`. Y si la versión rota es inservible, sube
también `minimum` en status.json: eso convierte el banner en rojo y no se
puede cerrar.

### 4. Empaquetar y publicar

    cd Ghosted-Pro
    node tools/empaquetar-pro.js

Deja el ZIP en `Ghosted-Landing/api/_private/`, que es de donde lo sirve
`api/download.js` contra la clave. Ofusca el JavaScript por el camino: Pro no
va a la tienda, asi que puede, y asi cuesta mas desactivar el interruptor de
licencia. El fuente se queda intacto.

Si un cliente reporta un fallo raro y sospechas de la ofuscacion:

    node tools/empaquetar-pro.js --claro

Empaqueta legible. Sirve para descartar en un minuto si el problema es del
codigo o de haberlo ofuscado.

Actualiza `latest` en status.json, quita el `notice` y despliega:

    cd Ghosted-Landing && npx vercel --prod

### 5. Y para Plus, la tienda

Plus va por la Chrome Web Store y **ahí no mandas tú**. Subes el ZIP nuevo,
esperas revisión (normalmente horas, a veces días) y Chrome actualiza solo a
todo el mundo en unas horas más.

Por eso el canal de avisos importa el doble en Plus: es lo único inmediato que
tienes mientras Google revisa.

---

## Cuánto tarda, de verdad

| | Aviso | Arreglo instalado |
|---|---|---|
| **Pro** (web) | < 6 h | Cuando el usuario se lo baja |
| **Plus** (tienda) | < 6 h | Revisión + ~5 h de Chrome |

---

## Lo que NO va a funcionar, para que no lo intentes

**`update_url` en el manifiesto.** Es el mecanismo de autoactualización de
Chrome, y no sirve aquí: Chrome bloquea la instalación y actualización de
extensiones fuera de la tienda en Windows y Mac desde hace años. Solo vale con
políticas de empresa. Para Pro, distribuido por tu web, no existe.

**Descargar el parche y ejecutarlo.** Prohibido por Manifest V3. Si lo
intentas, te retiran la extensión de la tienda — y con razón, porque es
exactamente lo que hacen las extensiones que se venden y luego se convierten
en malware.

**Un "modo remoto" con la lógica en tu servidor.** Misma prohibición, y además
te convierte en responsable de datos que ahora mismo no tocas. Perderías el
argumento de venta principal: que todo se queda en el dispositivo.

---

## Lo que sí puedes hacer para que se rompa menos

`Ghosted-Pro/src/ig-api.js` ya lo aplica: cada lectura tiene **más de una
vía**. Si la API interna falla, se prueba GraphQL; si eso falla, se lee del
HTML. Las 265 comprobaciones incluyen suites enteras dedicadas a esas vías de
respaldo (`publicaciones.test.js`, `perfil-por-nombre.test.js`).

Cuando añadas algo que hable con Instagram, hazlo igual y déjalo probado. Es
la única defensa real: no evita que Instagram cambie, pero hace que un cambio
tumbe una vía y no la función entera.

---
name: liquid-glass
description: El vidrio y el movimiento de iOS (liquid glass) tal cual quedó en la app de Ghoosted, para ponerlo en cualquier otra app o web. Barra de pestañas y selectores con una cápsula que viaja y se estira, hojas que suben desde abajo y se arrastran con el dedo, tema claro y oscuro. Úsala cuando haya que dar a una interfaz el aspecto de iOS, hacer una barra de pestañas o un selector segmentado con animación, o una hoja inferior (bottom sheet).
---

# Liquid Glass

Dos archivos sin dependencias, sacados de la app de Ghoosted y probados ahí:

- `assets/liquid-glass.css` — el vidrio (claro y oscuro) y las animaciones.
- `assets/liquid-glass.js` — el movimiento: cápsula que viaja y hojas que se arrastran.
- `assets/demo.html` — página de ejemplo con todo montado; ábrela para ver cómo queda.

Cópialos al proyecto y enlázalos. Nada de build, nada de npm. Funciona en
navegador normal y dentro de un WebView de Android o iOS.

## Lo que hace que parezca de Apple

Tres cosas, por orden de importancia:

1. **La pieza que marca lo elegido es UNA sola y se mueve.** No se enciende y
   se apaga el fondo de cada botón: hay una cápsula que viaja con `transform`.
2. **Se estira por el camino.** Mientras viaja se alarga y se aplasta un poco
   (`scale: 1.1 .88`), y al llegar hace lo contrario (`.97 1.05`) antes de
   asentarse. Eso es el "líquido".
3. **El muelle.** La curva `cubic-bezier(.34,1.32,.5,1)` pasa un poco de largo
   y vuelve. Con una curva normal parece un menú de web.

Medido en el ejemplo, saltando cuatro posiciones (la cápsula llega a 916 px):

| ms | posición | escala |
|---|---|---|
| 55 | 386 | 1,09 × 0,89 |
| 110 | 676 | 1,10 × 0,88 |
| 220 | 930 | 0,98 × 1,04 |
| 275 | 947 (se pasa) | 0,97 × 1,05 |
| 440 | 916 (llega) | 1 × 1 |

Sale estirada a lo ancho, se pasa de largo, se estira a lo alto y se asienta.

**Estos números son los de Ghoosted y están elegidos a propósito.** Subirlos
—más estirado, estela detrás, rebotes más grandes— parece chicle, no vidrio.
Si alguien pide "más efecto", enséñale esto antes de tocarlo.

El desenfoque es lo de menos: sin los tres puntos de arriba, el vidrio solo
parece un fondo gris.

## Montarlo

```html
<link rel="stylesheet" href="liquid-glass.css">
<script src="liquid-glass.js"></script>
```

**Barra de pestañas** (abajo, fija):

```html
<nav class="lg-tabs lg-vidrio" data-lg-tabs="principal">
  <button class="on" data-lg-valor="hoy"><i class="lg-ico">…icono…</i><span>Hoy</span></button>
  <button data-lg-valor="personas"><i class="lg-ico">…</i><span>Personas</span></button>
</nav>
```

**Selector segmentado** (arriba), en vidrio o plano:

```html
<div class="lg-segs lg-plano" data-lg-segs="filtro">
  <button class="on" data-lg-valor="todos">Todos</button>
  <button data-lg-valor="nuevos">Nuevos</button>
</div>
```

La cápsula la crea el JS; el `.on` marca cuál empieza elegido. Al pulsar, el
grupo lanza un evento:

```js
document.addEventListener('lg:cambio', function (e) {
  e.detail.valor;    // "nuevos"
  e.detail.indice;   // 1
  e.target;          // el grupo
});
```

**Hoja inferior:**

```js
var h = LiquidGlass.hoja('<h2>Título</h2><p>Lo que sea</p>', { titulo: 'Ajustes' });
// se cierra sola al tocar fuera o arrastrando; a mano: LiquidGlass.cerrarHoja()
```

`hoja()` inserta el HTML tal cual: si viene de fuera (nombres de usuario,
textos de una API), escápalo antes.

**Tema:** `document.documentElement.setAttribute('data-lg-tema', 'oscuro')`.

## Lo que se te va a olvidar (y rompe la animación)

- **Si repintas el HTML entero, la animación desaparece.** El navegador
  estrena la cápsula ya colocada en su sitio y no hay nada que animar. Por eso
  la librería guarda la posición anterior de cada grupo: después de repintar
  llama a `LiquidGlass.recolocar()` y el viaje se lanza igual. Identifica cada
  grupo con `data-lg-tabs="nombre"` o `data-lg-segs="nombre"`; ese nombre es
  el que se recuerda.
- **La barra de pestañas, mejor pintarla una sola vez** y cambiar solo el
  cuerpo. Es más fluido y no hay que recolocar nada.
- **Las hojas viven fuera del contenedor que repintas** (`document.body`), o
  al repintar se cortan en seco a mitad de animación.
- **Dentro de una hoja recién creada hay que llamar a `LiquidGlass.init()`**
  si mete selectores nuevos.
- **Android va a tirones con varias capas de `backdrop-filter`.** Pon
  `data-lg-ligero="1"` en `<html>` y el vidrio se queda sin desenfoque: sobre
  un fondo suave se ve casi igual y se acaban los tirones.
- **El vidrio necesita color detrás.** Sobre blanco liso no se ve. Pon un
  fondo con manchas de color difuminadas (en la demo están hechas con
  `radial-gradient`, que cuesta mucho menos que `filter: blur()`).
- **Respeta "reducir movimiento".** El CSS ya lo hace: si el sistema lo tiene
  activado, no hay animaciones. **Es la razón número uno de "no veo nada".**
  En Linux con GNOME suele venir puesto, y entonces el efecto no se ve ni en
  la demo. Para enseñarlo igualmente, pon `data-lg-forzar="1"` en `<html>`
  (el ejemplo lo trae) y se salta ese ajuste.
- **Para verlo con calma:** `data-lg-lento="1"` en `<html>` multiplica las
  duraciones (el ejemplo tiene el botón de la tortuga). Va muy bien para
  ajustar el estirado sin grabar vídeo.
- **Cómo comprobar que se mueve de verdad** sin depender del ojo: lee
  `getComputedStyle(capsula).transform` y `.scale` cada 50 ms después de
  pulsar. Si `x` avanza por pasos y la escala pasa de 1,3 a 0,87 y vuelve a 1,
  el efecto está corriendo.

## Piezas sueltas que trae el CSS

| Clase | Qué es |
|---|---|
| `.lg-vidrio` | fondo de vidrio con luz propia |
| `.lg-lista` | vidrio más lechoso, para listas con texto encima |
| `.lg-redondo` | botón redondo de 44 px |
| `.lg-boton`, `.lg-boton.lg-color` | botón principal, negro o con degradado |
| `.lg-tabs`, `.lg-segs`, `.lg-segs.lg-plano` | barra de pestañas y selectores |
| `.lg-hoja`, `.lg-velo`, `.lg-asa` | la hoja inferior |
| `.lg-entra` | el cuerpo entra desde abajo al cambiar de sección |

## Ajustarlo a otra marca

Cambia las variables de `:root` en el CSS: `--lg-acento`, `--lg-degradado`,
`--lg-fondo` y los tonos de tinta. El bloque de oscuro ya está resuelto. Si la
app no es de Instagram, lo primero que hay que cambiar es `--lg-degradado`,
que es el que canta.

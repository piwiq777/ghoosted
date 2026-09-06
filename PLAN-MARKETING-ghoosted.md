# Ghoosted · plan de lanzamiento en orgánico
6 de septiembre de 2026 · presupuesto 0 €

---

## Lo primero: no publiques nada todavía

Tres cosas están rotas y las tres queman el tráfico que mandes:

1. **ghoosted.net sirve la versión vieja.** Falta desplegar la carpeta del 6 de
   septiembre.
2. **No hay variables de entorno en Vercel.** Los botones de compra llaman a
   `api/checkout.js` y no puede crear la sesión de Stripe. Todo el que llegue
   hoy y quiera pagar, no puede.
3. **La extensión no está en la tienda.** Sin ficha publicada no hay a dónde
   mandar a la gente que no quiere sacar la tarjeta el primer día.

Un lanzamiento tiene una sola primera vez. Si el primer vídeo funciona y la web
no cobra, ese pico no vuelve. **Orden: desplegar → variables → comprar tú mismo
una licencia de 5 € con tu tarjeta → publicar Plus en la tienda → y entonces
contenido.**

---

## La decisión de posicionamiento

Tu producto son dos productos, y eso resuelve el problema de marketing más
grande que tienes:

- **Plus** (3,50 €) va a la Chrome Web Store. Solo tu propia cuenta: quién te
  dejó de seguir, quién no te sigue, seguidores nuevos. Sin modo fantasma, sin
  descargas, sin vigilar a nadie.
- **Pro** (5 €) se vende desde tu web con clave. Ahí viven el modo fantasma, la
  vigilancia de cuentas y las descargas.

**Haz marketing de Plus. Vende Pro a quien ya confía en ti.**

No es un consejo blando, es el que te deja el negocio en pie:

- Lo que engancha de Pro —"mira historias sin que se enteren", "vigila a
  cualquiera"— es lo que hace que te denuncien, que te tumben la ficha y que la
  persona cuyo nombre esté en la cuenta cargue con el marrón. Un vídeo viral
  sobre eso es un vídeo viral apuntando a tu dirección postal, que la
  verificación de comerciante publica.
- Lo que vende de Plus —"me dejó de seguir y no sé quién"— tiene volumen de
  búsqueda real, es una angustia universal en Instagram y no exige defender
  nada raro.
- Y hay un motivo puramente comercial: **quien compra Plus por 3,50 € es el que
  luego compra Pro.** Es más barato adquirir a alguien con la promesa fácil y
  subirlo después que intentar vender la promesa difícil a un desconocido.

### Un aviso sobre Instagram como canal

Instagram es tu mercado, no tu canal. Sus condiciones prohíben la recogida
automatizada de datos, y una cuenta que promociona una extensión que lee IG es
carne de cierre. Además pierdes la cuenta desde la que vendes.

**No abras cuenta de marca en Instagram para esto.** Publica en TikTok, YouTube
Shorts, Reddit y X, y que el enlace sea siempre a ghoosted.net.

### Un problema que hay que arreglar antes de enviar a la tienda

La ficha de Plus dice, textualmente, **"No vigila cuentas de otras personas"**.
El `homepage_url` del manifiesto apunta a ghoosted.net. La primera sección de
esa web se titula **"Watchlist — Pick any account and Ghoosted tells you when
they post a story"**, y más abajo hay **"Ghost mode"**.

El revisor va a hacer ese clic. Va a leer que la ficha niega justo lo que la
web anuncia como titular. Eso no es un matiz: es la contradicción exacta que
usan para rechazar.

**Antes de enviar Plus, separa las dos páginas.** O `homepage_url` apunta a
`ghoosted.net/plus` —una página que solo describa Plus— o la landing deja
clarísimo, arriba y no en la letra pequeña, que el modo fantasma y la vigilancia
son de Pro y que Pro no está en la tienda.

---

## 1 · Chrome Web Store

Es tu mejor canal y el único que no depende del algoritmo de nadie: quien busca
"unfollowers" en la tienda ya quiere lo que vendes.

La ficha que escribiste está bien y no la toco: es honesta, se puede comprobar
contra el paquete y responde por adelantado a las tres preguntas por las que
retiran estas extensiones. Lo que falta es esto.

### Capturas (lo que te bloquea ahora mismo)

Las que te preparé **no valen para la tienda**. Las hice contra Pro: salen seis
pestañas, incluida "Historias", que es precisamente lo que la ficha jura que
Plus no lleva. Enseñarlas sería el mismo error que la ficha antigua.

Hacen falta cuatro, de Plus, a 1280×800, en este orden:

1. El panel abierto con las cuatro pestañas y los contadores. *Es la primera y
   la que más pesa: tiene que entenderse en un segundo qué es esto.*
2. "Te dejaron" con la lista poblada.
3. "Actividad".
4. "¿Se siguen?" con un resultado.

Te las regenero con el mismo generador en cuanto me digas — sale del
`panel.css` de Plus y tarda lo mismo.

### Palabras que importan

La tienda indexa nombre y descripción corta. Tu descripción corta ya lleva
"deja de seguirte" e "Instagram", que es lo que la gente escribe. No metas
"unfollow tracker" en el **nombre** (marca ajena, riesgo de retirada), pero sí
en la primera línea de la descripción larga, que sí indexa y no tiene ese
problema.

### Las primeras reseñas

Una extensión sin reseñas no la instala nadie. No las compres ni las pidas a
cambio de nada: eso sí es motivo de expulsión. Lo que sí puedes hacer es
escribir a los primeros compradores de Pro a los quince días, uno a uno, y
preguntarles qué les ha parecido. Los que respondan bien, pídeles la reseña.

---

## 2 · TikTok · tres guiones

Formato 9:16, sin música con derechos, texto en pantalla grande porque se ve
sin sonido. Graba la pantalla real: se nota muchísimo si es un montaje.

El material lo tienes en `assets/shots-2026/`, carpeta `mockup-navegador`.

### Reel 1 · "El número que no cuadra"

> **Gancho (0-2 s, texto en pantalla):** "Tenías 1.204 seguidores. Ahora 1.198.
> Instagram no te va a decir quién."

**Plano 1 (0-3 s):** el perfil de Instagram, dedo señalando el contador.
**Plano 2 (3-6 s):** clic en el fantasma, el panel se abre.
**Plano 3 (6-11 s):** pestaña "Te dejaron". La lista aparece con nombres y
"hace 2 h". *Voz: "Seis personas. Con nombre y con hora."*
**Cierre (11-15 s):** "Extensión de navegador. 3,50 €, pago único. ghoosted.net"

*Por qué funciona:* el gancho es un agravio concreto con números, no una
promesa. Y la revelación es visual: la lista apareciendo hace el trabajo.

### Reel 2 · "La lista silenciosa"

> **Gancho:** "37 cuentas que sigues no te siguen a ti. ¿Las quieres ver?"

**Plano 1 (0-3 s):** el contador rojo del panel, en grande: **37**.
**Plano 2 (3-8 s):** pestaña "No te siguen", scroll lento por la lista.
**Plano 3 (8-12 s):** *Voz: "Sin contraseña. Sin subir tus datos a ningún
sitio. Se calcula en tu navegador y ahí se queda."*
**Cierre:** "ghoosted.net"

*Por qué funciona:* el número es el gancho. Y la frase de privacidad es tu
diferencia real frente a las apps que piden el usuario y la contraseña — que es
justo el miedo que tiene todo el que ha buscado esto alguna vez.

### Reel 3 · "Por qué no pido tu contraseña"

> **Gancho:** "Todas las apps de seguidores te piden el usuario y la contraseña.
> Te explico por qué la mía no."

**Plano 1 (0-4 s):** capturas de apps que piden login. *Voz: "Cuando le das tus
datos a una de estas, se los estás dando a un servidor de alguien."*
**Plano 2 (4-10 s):** el panel abriéndose sobre Instagram ya iniciado. *"Esto
es una extensión. Lee lo que tú ya estás viendo, con tu sesión. No hay login
porque no hace falta."*
**Plano 3 (10-15 s):** DevTools → pestaña Network, vacía. *"Y no sale nada."*
**Cierre:** "ghoosted.net · 3,50 €"

*Por qué funciona:* es el único de los tres que construye confianza en lugar de
curiosidad, y es el que te va a traer a los compradores buenos. Además te
diferencia de toda tu competencia de un plumazo. **Solo grábalo si la pestaña
Network está de verdad vacía.** Si sale una llamada, el vídeo se vuelve en tu
contra el día que alguien lo compruebe.

### Ritmo

Tres vídeos por semana, no tres el mismo día. Mira cuál retiene mejor a los
tres segundos y haz cuatro variantes del gancho de ese. En TikTok el gancho es
el 80 %: el mismo vídeo con otra primera frase hace 300 o 30.000.

---

## 3 · Reddit

Reddit te trae a tus primeros cien usuarios y a los que reportan bugs. También
te destroza si entras vendiendo.

**La regla:** ninguna cuenta nueva publica su propio producto y sobrevive. Pasa
dos semanas comentando en esos subs sin enlazar nada. Cuando publiques, di
desde la primera línea que es tuyo. Reddit perdona la autopromoción declarada
y castiga la disimulada.

### Dónde

| Subreddit | Enfoque | Ojo con |
|---|---|---|
| r/SideProject | "He hecho esto" — tu mejor sitio para el primer post | Nada, es el sub para esto |
| r/InternetIsBeautiful | Solo si haces una versión de prueba gratis y sin instalar | Rechazan lo que es puro anuncio |
| r/Instagram | Donde está la gente con el problema | Muchos prohíben herramientas de terceros: **lee las reglas antes** |
| r/webdev, r/chrome_extensions | El ángulo técnico: cómo funciona por dentro | Aquí quieren el cómo, no el qué |
| r/es, r/podemospreguntar | Mercado español | Solo si el post aporta sin el enlace |

### Borrador para r/SideProject

> **Título:** He hecho una extensión que te dice quién te dejó de seguir en
> Instagram sin pedirte la contraseña
>
> Llevaba tiempo con la duda de por qué todas las apps de seguidores te piden
> usuario y contraseña. La respuesta es que corren en un servidor y necesitan
> entrar como tú. Así que hice lo contrario: una extensión que lee lo que ya
> estás viendo en tu propia sesión y hace las cuentas en tu navegador.
>
> Qué hace: quién te dejó de seguir, quién no te sigue de vuelta, seguidores
> nuevos, y un registro de los cambios.
>
> Qué no hace: no publica ni sigue por ti, no te pide la contraseña, y no manda
> tus listas a ningún sitio — se guardan en el navegador.
>
> Es de pago, 3,50 € una vez, sin suscripción. Lo digo arriba para no hacer
> perder el tiempo a nadie.
>
> Lo que más me costó fue [una dificultad técnica real y concreta].
>
> Encantado de responder a lo que sea, sobre todo a lo escéptico.

Esa penúltima línea no es de relleno: en r/SideProject el post que cuenta una
dificultad técnica concreta va arriba y el que solo describe el producto se
hunde. Rellénala con algo de verdad.

**Nunca defiendas el producto en los comentarios.** Si alguien dice que
Instagram lo va a bloquear, dile que tiene razón en que depende de Instagram y
que por eso está escrito en la web. Discutir en Reddit es perder.

---

## 4 · La landing, antes de mandar a nadie

### Lo que hay que arreglar sí o sí

**Los 30 € y los 15 € tachados.** Ya lo marcaste tú en tu LEEME y tienes razón
en preocuparte. Un precio tachado afirma que ese fue el precio. Si Pro nunca se
ha vendido a 30 €, es publicidad engañosa, y en España la sanción no es
simbólica. Dos salidas honestas: vender de verdad a 30 € y que 5 € sea la
oferta de lanzamiento con fecha de fin real, o quitar el tachado y poner
"Precio de lanzamiento · sube a 30 € el [fecha]", que dice lo mismo, vende
igual y es cierto.

**El contador de "Ends in".** Si al llegar a cero no sube el precio, la cuenta
atrás es falsa y aplica lo mismo. Que caduque de verdad.

**El "Ghost mode" en la portada.** Ya está arriba: si Plus va a la tienda, esto
tiene que quedar visiblemente adscrito a Pro.

### Lo que mejoraría la conversión

**El titular.** "The real story. Behind the profile." es bonito y no dice nada.
Quien llega buscando "quién me dejó de seguir" no se reconoce. Prueba
literalmente el problema: **"Mira quién te dejó de seguir en Instagram"**, y
"The real story" de subtítulo. Ese cambio suele mover más que el resto de la
página junta.

**Un solo botón.** Ahora tienes "Get it · €5 lifetime" y "See what it does"
compitiendo, y luego dos planes. Deja un botón principal y manda el secundario a
un ancla, no a otra decisión.

**Web en inglés, vídeos en español.** Si vas a hacer TikTok en español, que el
enlace caiga en español. Ya tienes los once idiomas: asegúrate de que detecta
bien y de que la moneda cuadra.

**La objeción sin responder.** No hay ni una línea sobre "¿me pueden banear la
cuenta por usar esto?". Es la primera pregunta de todo el que ha buscado esto
alguna vez. Si no la contestas tú en la página, se la contesta otro en los
comentarios y pierdes la venta. Mejor una respuesta franca en el FAQ que un
silencio.

---

## Las cuatro semanas

| | Qué |
|---|---|
| **Semana 1** | Desplegar. Variables de entorno. Comprarte una licencia a ti mismo. Separar Plus de Pro en la web. Capturas de Plus y enviar a la tienda. Empezar a comentar en Reddit sin vender. |
| **Semana 2** | Reels 1 y 2. Post en r/SideProject. Aguantar la revisión de la tienda. |
| **Semana 3** | Reel 3. Variantes del gancho que mejor haya retenido. Escribir a los primeros compradores. |
| **Semana 4** | Mirar los números y decidir. Si un vídeo tira, más de ese. Si no tira ninguno, el problema es el gancho, no el producto. |

### Qué mirar

Solo cuatro números. Visitas a ghoosted.net, instalaciones desde la tienda,
compras, y retención a los 3 segundos en TikTok. Nada más los dos primeros
meses.

**El número que decide si esto funciona no es "cuánta gente lo ve", es "cuánta
gente que lo ve, paga".** Si de mil visitas compran menos de cinco, no
necesitas más vídeos: necesitas arreglar la página.

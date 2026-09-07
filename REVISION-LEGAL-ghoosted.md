# Revisión legal de ghoosted.net

**7 de septiembre de 2026** · Revisión de los cinco documentos legales publicados
(`aviso-legal`, `terms`, `privacy`, `cookies`, `refund`), contrastados con el código
que hay detrás (`api/checkout.js`, `api/m/push.js`, `api/m/pull.js`, `m.html`,
`locales/es.json`) y con la web en producción.

> No soy abogado y esto no es asesoramiento legal. Es una revisión de tus textos y
> tu código, con las normas que les aplican citadas para que las puedas comprobar.
> Los puntos del apartado 1 hay que verlos con una gestoría o un abogado: te digo
> exactamente qué preguntarles para que no pagues por que te lo averigüen.

---

## Resumen en cuatro líneas

Los textos están **mucho mejor escritos que la media** de lo que se ve en productos
de este tamaño: quien los redactó sabía lo que hacía. El problema no está en la
redacción, está en tres sitios: **los datos del vendedor siguen sin rellenar y en
producción**, **la web se contradice con tus propios Términos** en el punto que más
te puede costar dinero, y **hay dos hechos —que eres menor y que no tienes alta— que
ninguna cláusula arregla**.

---

## 1. Lo que ninguna cláusula puede arreglar

Esto va primero porque condiciona todo lo demás. No es un detalle formal.

### 1.1 Eres menor de edad

**Lo que dice la norma.** El artículo 1263 del Código Civil (redacción de la Ley
8/2021) establece que los menores no emancipados no pueden prestar consentimiento
contractual, salvo en los contratos "de la vida corriente propios de su edad".
Vender licencias de software por internet, con cobro por Stripe y obligaciones de
garantía durante años, no entra ahí.

**Qué significa en la práctica.** Los contratos que firmas son **anulables** (art.
1301 CC, durante 4 años desde que cumplas los 18). El riesgo real no es que un
cliente anule su compra de 7 € —eso no lo va a hacer nadie—. El riesgo es el
contrario: **tú eres la parte débil en cualquier conflicto**, y quien contrate
contigo lo sabe.

**El problema inmediato es Stripe.** Su política es explícita:

> "You must be at least 13 years old to create a Stripe account. If you are under
> 18, a legal guardian must assume the role of owner of your account before your
> account can accept charges and funds can be transferred to your bank account."

Traducido: **la cuenta puede aceptar cargos y transferirte el dinero solo cuando un
tutor legal figure como titular.** Tu cuenta ya está en vivo y cobrando. Hoy no
pasa nada porque nadie ha mirado. Cuando Stripe pida verificación de identidad —y
la pide, más pronto que tarde, sobre todo al superar cierto volumen o ante una
reclamación— la retención de fondos es el desenlace normal. Con 30 € dentro da
igual. Con 2.000 € acumulados, duele.

**Y el mismo muro en la Chrome Web Store**, que ya te encontraste: la verificación
de comerciante exige identidad de un adulto.

### 1.2 No tienes alta

Aquí hay un malentendido muy extendido que conviene deshacer:

**No estar dado de alta no te quita ni una sola obligación de vendedor.** La
condición de empresario a efectos de consumo (art. 4 TRLGDCU) depende de que actúes
"en el marco de su actividad empresarial o profesional", no de que estés en un
censo. Tienes una web, un catálogo, precios, pasarela de pago y política de
devoluciones: eres vendedor profesional a todos los efectos. Lo único que consigues
no dándote de alta es **acumular una infracción más** encima de las mismas
obligaciones.

Consecuencias concretas hoy:

- **No puedes rellenar honestamente el aviso legal.** Los corchetes del apartado 2.1
  no están sin rellenar por descuido: es que ahora mismo no hay un NIF de actividad
  que poner.
- **No puedes emitir factura** a quien te la pida, y te la van a pedir.
- **El IVA.** Tu web anuncia "el precio incluye impuestos" (Términos §5) y
  `checkout.js` tiene `automatic_tax[enabled]=true` — pero la cuenta de Stripe no
  tiene ninguna región registrada, así que calcula **cero**. Estás anunciando IVA
  incluido y no ingresando ninguno. El comentario del propio código lo reconoce.

### 1.3 La única salida real

El negocio a nombre de un adulto (padre, madre o tutor), dado de alta, con la cuenta
de Stripe a su nombre y el aviso legal con sus datos. Todo lo demás son parches
sobre una base que no aguanta.

Ya me preguntaste hace unos días por los riesgos de ponerlo a nombre de un tutor.
La respuesta corta: **quien figure responde de todo** — de las devoluciones, de las
reclamaciones de consumo, del IVA y de cualquier lío con Meta. Es una decisión suya,
no tuya, y merece que se la plantees con las cartas boca arriba.

---

## 2. Fallos concretos, ordenados por lo que te pueden costar

### 2.1 🔴 Los corchetes están publicados, en cuatro documentos

Ahora mismo, en producción, cualquiera lee esto:

> "operated by **[NOMBRE LEGAL COMPLETO]**, tax ID (NIF) **[NIF]**, with address at
> **[DIRECCIÓN]**, Spain"

Aparece en **aviso legal §1**, **Términos §1**, **Privacidad §9** (donde además
identificas al responsable del tratamiento) y **Devoluciones §8** (el formulario de
desistimiento).

Qué incumple:

- **LSSI-CE art. 10.1.a**, que obliga a publicar nombre, domicilio y datos de
  contacto efectivo. Es infracción leve (art. 38.4.d), con multa de hasta 30.000 €.
  Nadie inspecciona una web de 7 €, pero es la primera piedra que te tira un cliente
  cabreado, un competidor o una OMIC.
- **RGPD art. 13.1.a**: la identidad del responsable es información obligatoria. Una
  política de privacidad sin responsable identificado es, a efectos prácticos, una
  política sin responsable.

Es lo primero que hay que arreglar, y no se puede arreglar hasta resolver el
apartado 1.

### 2.2 🔴 La web dice una cosa y tus Términos dicen la contraria

Este es el hallazgo que más dinero te puede costar, y el más fácil de arreglar.

En la landing (`locales/es.json`):

| Clave | Texto |
|---|---|
| `a4` (FAQ "¿Me banean la cuenta?") | "Lee lo que Instagram ya te muestra, **sin modificar tu cuenta**." |
| `compat_not_3` | "[Ghoosted no hace] **Cambiar tu cuenta**, sus ajustes ni sus opciones de privacidad." |

En tus Términos §2:

> "**Two actions do change your account**, and both run only when you ask for them:
> unfollowing accounts you have selected, and approving follow requests."

Las dos cosas no pueden ser verdad. Y la que falta en la web —dejar de seguir en
lote y aprobar solicitudes automáticamente— es **precisamente la que dispara el
detector de Instagram**. Lo sabes de primera mano: le pasó a tu propia cuenta, y por
eso metiste los avisos dentro de la extensión.

Por qué te importa, y mucho:

- **Art. 61 TRLGDCU**: el contenido de la oferta y la publicidad es exigible y se
  integra en el contrato, y en caso de contradicción **prevalece lo más favorable al
  consumidor**. O sea: gana la versión de la web, no la de tus Términos.
- Tu **Devoluciones §4** excluye el reembolso por bloqueos de Instagram. Es una
  cláusula buena y te interesa conservarla. Pero si al comprador le dijiste "no
  modifica tu cuenta" y acaba restringido haciendo unfollow masivo desde tu
  extensión, esa exclusión **se cae**: no puedes excluir un riesgo que negaste que
  existiera.
- Añadido: omitir la característica más arriesgada del producto en la lista de "lo
  que no hace" encaja en la definición de **omisión engañosa** (art. 7 de la
  Directiva 2005/29/CE; arts. 5 y 7 de la Ley 3/1991 de Competencia Desleal).

**Arreglo** (media hora de trabajo, y te blinda la cláusula de devoluciones):

1. Quitar "sin modificar tu cuenta" de `a4` y de `compat_not_3`.
2. Decir en la web lo mismo que ya dicen tus Términos: que hay dos acciones que sí
   tocan la cuenta, que solo se ejecutan cuando el usuario las pide, y que son las
   que más riesgo tienen.
3. Poner el aviso de riesgo **antes del botón de pago**, no solo dentro de la
   extensión. Ahí es donde adquiere valor probatorio.

Paradoja que conviene entender: **decir la verdad sobre el riesgo te protege más que
ocultarlo.** El comprador informado que se arriesga no tiene reclamación; el
comprador al que le dijiste que no había riesgo, sí.

### 2.3 🟠 IVA: anuncias impuestos que no ingresas

Términos §5: "The price shown at checkout includes any applicable taxes."

Con Stripe Tax activo pero sin regiones dadas de alta, el impuesto aplicable
calculado es cero. La frase no es falsa en sentido estricto —si el impuesto
aplicable fuera cero, estaría incluido— pero se sostiene solo mientras no haya
obligación de repercutir. En cuanto haya alta, hay 21 % que sale de tus 7 €, no de
más: mantener el precio "IVA incluido" es lo correcto (Directiva 98/6/CE y art. 60
TRLGDCU obligan a anunciar precio final), pero significa que tu margen real por
licencia Pro es **5,79 €, no 7 €**. Cuéntalo así desde ya en tus números.

Si vendes a consumidores de otros países de la UE, el umbral de los 10.000 € anuales
marca cuándo tienes que pasar a la ventanilla única (OSS). Por debajo, IVA español.

### 2.4 🟠 Anuncias un SMS que no recoges

Privacidad §3 describe un envío de la clave por SMS con Twilio, "solo si eliges
dejar un número de móvil al pagar". Pero `api/checkout.js` **no recoge ningún
teléfono**: no hay `phone_number_collection` en la sesión de Stripe.

Dos posibilidades: o la copia del escritorio va por detrás del repositorio (donde ya
está `lib/entrega.js` con el SMS) y en producción sí se recoge, o la política
describe algo que no existe. Compruébalo. Una política de privacidad que declara un
tratamiento que no haces es un fallo menor; una que **no** declara uno que sí haces
es un fallo serio. Asegúrate de que estás en el primer caso, no en el segundo.

### 2.5 🟡 "All sales are final" como titular

Devoluciones §1 se titula así, y los §§2, 3 y 7 lo corrigen bien. Pero un titular
categórico que el propio documento desmiente tres párrafos después es justo el
patrón que las autoridades de consumo miran con lupa (art. 82 TRLGDCU, cláusulas
abusivas por falta de claridad).

**Arreglo:** cambiar el titular por algo como *"Entrega inmediata y sus
consecuencias"*. El contenido no cambia; el titular deja de ser atacable.

### 2.6 🟡 Indemnidad y tope de responsabilidad

- **Términos §12** (el comprador te defiende e indemniza) es una cláusula de
  contrato anglosajón. Frente a consumidores en España es muy probablemente **nula**
  (art. 86 TRLGDCU, limitación de derechos del consumidor). No te hace daño tenerla
  —la coletilla del §8 salva el conjunto— pero no cuentes con ella. Si quieres que
  sirva de algo, **acótala** a usos ilícitos y a usuarios que no sean consumidores.
- **Términos §8**, tope de responsabilidad al precio pagado: igual. Frente a
  consumidores no puedes limitar la responsabilidad por daños causados por tu propia
  negligencia. La frase "nothing in these Terms limits liability that cannot be
  limited" es la que hace que la cláusula no contamine el resto. Está bien puesta.

### 2.7 🟡 Fechas y cifras desfasadas

- Términos: "Last updated: 19 July 2026", pero el texto ya menciona los precios de
  7 € y 5 € que pusiste el **7 de septiembre**. La fecha miente.
- Aviso legal, privacidad, cookies y devoluciones: 26 de julio de 2026. Desde
  entonces has añadido el SMS, has cerrado la licencia y has cambiado los precios.
- El comentario de cabecera de `api/checkout.js` sigue diciendo "Pro 5€, Plus 3.50€".

La fecha de última actualización es lo primero que mira quien va a reclamar. Si está
desfasada, el resto del documento pierde credibilidad de golpe.

---

## 3. Lo que ya está bien y no deberías tocar

Merece decirse, porque es bastante:

- **El desistimiento está bien implementado.** `checkout.js` usa
  `consent_collection[terms_of_service]: required` con un texto a medida que dice
  exactamente lo que tiene que decir: solicitud de ejecución inmediata y
  reconocimiento de pérdida del derecho de desistimiento, citando el art. 16(m) de
  la Directiva 2011/83/UE y el art. 103.m TRLGDCU, con enlace a Términos y a
  Devoluciones. **Esto es lo que hace válido tu "no hay devoluciones"**, y mucha
  gente que vende software se lo salta. Está bien hecho.
- **El cifrado del espejo del móvil es real.** Lo he verificado en el código, no me
  he fiado del texto: `api/m/push.js` y `api/m/pull.js` solo manejan un id de canal y
  un blob opaco, y `m.html` descifra con AES-GCM usando una clave que viaja en el
  fragmento de la URL (`location.hash`), que por definición no llega al servidor. Lo
  que dice tu política de privacidad es cierto.
- **La ODR está actualizada y bien.** Devoluciones §9 dice que la plataforma europea
  de resolución de litigios se cerró en julio de 2025 y ya no admite reclamaciones.
  Es correcto: el Reglamento (UE) 2024/3228 derogó el Reglamento 524/2013 y la
  plataforma cesó el **20 de julio de 2025**. La mayoría de webs españolas siguen
  enlazándola. La tuya no. Punto a favor.
- **La política de cookies se sostiene.** El argumento del art. 22.2 LSSI y del art.
  5(3) de la Directiva ePrivacy para no pedir consentimiento está bien construido, y
  lo he comprobado: **no hay una sola petición a terceros** en tus páginas — ni
  analytics, ni píxeles, ni fuentes de Google. Las fuentes y las banderas están
  autoalojadas. La tabla de los cuatro `localStorage` coincide con la realidad.
- **La información precontractual de compatibilidad está donde tiene que estar**:
  `price_req` ("es una extensión de ordenador: Chrome, Edge o Brave") y `price_free`
  ("una clave = una cuenta de Instagram, para siempre") salen junto al precio, antes
  de pagar. Eso cubre el art. 97.1 TRLGDCU y te ahorra devoluciones por
  incompatibilidad.
- **Ley de accesibilidad (EAA):** desde el 28 de junio de 2025 aplica al comercio
  electrónico, pero las **microempresas de servicios están exentas**. Con una persona
  y esta facturación, estás fuera. No tienes que hacer nada.

---

## 4. Tu pregunta: el mínimo legal de la dirección

El artículo 10.1.a de la LSSI-CE pide, literalmente:

> "Su nombre o denominación social; su residencia o **domicilio** o, en su defecto,
> la dirección de uno de sus establecimientos permanentes en España; su dirección de
> correo electrónico y cualquier otro dato que permita establecer con él una
> **comunicación directa y efectiva**."

Lo que se deduce de ahí:

- **No exige que sea tu vivienda.** Exige una dirección postal donde se te pueda
  localizar de verdad. La clave está en "directa y efectiva": lo que no vale es una
  dirección donde no llegue nadie.
- **Un apartado de correos es discutible.** Sirve para recibir, y muchos lo usan como
  dirección de contacto. Pero no es un domicilio y **no vale como domicilio fiscal**
  en el modelo 036, así que resuelve la web y no resuelve Hacienda. Si tu problema es
  solo "que mi casa no salga en Google", cumple. Si quieres una sola dirección para
  todo, no.
- **La opción que resuelve las dos cosas** es una domiciliación en gestoría o
  coworking: entre 20 y 40 € al mes, vale para el 036 y para el aviso legal, y
  recogen las notificaciones. Es lo que hace casi todo el mundo que no quiere poner
  su casa.
- **El correo electrónico sí es obligatorio** y ya lo tienes: `hello@ghoosted.net`,
  con el reenvío funcionando.

Y un aviso para que no te lleves una sorpresa: **la verificación de comerciante de la
Chrome Web Store va a publicar esa dirección igualmente**, junto al nombre y el
teléfono, en la ficha de la extensión. Elige desde el principio una dirección que no
te importe que sea pública, porque vas a tenerla que dar dos veces.

---

## 5. El orden en que yo lo haría

1. **Habla con el adulto que vaya a figurar.** Sin esto, los puntos 2.1 y el IVA no
   tienen arreglo posible, y el dinero de Stripe está en el aire. Es la conversación
   incómoda que desbloquea todo lo demás.
2. **Arregla la contradicción del apartado 2.2 esta semana.** No depende de nadie,
   son treinta minutos, y es lo que convierte tu política de devoluciones en algo
   que aguanta. Hazlo aunque todo lo demás tarde meses.
3. **Cambia el titular de "All sales are final"** y **actualiza las cinco fechas**.
   Diez minutos.
4. **Comprueba lo del SMS de Twilio** y deja la política de privacidad describiendo
   exactamente lo que hace el código, ni más ni menos.
5. **Cuando tengas nombre, NIF y dirección**, rellena los cuatro documentos. Son
   cuatro búsquedas y reemplazos; te los dejo hechos en un rato.
6. **Acota la cláusula de indemnidad** a usos ilícitos y a no consumidores.
7. **Cuando haya alta**, da de alta España en Stripe Tax y recalcula tus márgenes con
   el 21 % dentro.

---

## Fuentes

- [Reglamento (UE) 2024/3228, que deroga el Reglamento 524/2013 y suprime la plataforma ODR](https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-81952)
- [Nota informativa oficial sobre el cese de la plataforma ODR el 20 de julio de 2025 — Consumo](https://portal-cec.consumo.gob.es/sites/default/files/documentos/NI_Finalizacion_ODR_21_04_2025.pdf)
- [Stripe — Age requirement to create a Stripe account](https://support.stripe.com/questions/age-requirement-to-create-a-stripe-account)
- [Stripe Services Agreement](https://stripe.com/legal/ssa)

# Stripe en Ghoosted — qué tienes que hacer

Todo lo técnico está montado. Quedan cuatro cosas, y son de rellenar
formularios. Media hora si vas del tirón.

---

## Antes de nada: lo que YA está hecho

No lo toques, ya funciona:

- Los dos productos existen en Stripe, con sus precios de 5 € y 3,50 €
- El webhook está creado y apunta a `www.ghoosted.net/api/stripe-webhook`
- El almacén de licencias funciona (lo probé: responde a claves inválidas)
- En Vercel ya están `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_PLUS` y `SITE_URL`

---

## Paso 1 · Las dos claves de Stripe (5 minutos)

Abre un terminal en la carpeta de la web y ejecuta:

    bash poner-claves.sh

Te pide las claves de una en una. Se escriben a ciegas y van directas a
Vercel: no quedan en el historial del terminal.

**`STRIPE_SECRET_KEY`**
Stripe → *Developers* → *API keys* → **Secret key**. Empieza por `sk_live_`.
Hay que pulsar "Reveal" para verla.

> Con esa clave se puede mover dinero de la cuenta. No la pegues en un chat,
> ni en un correo, ni en un documento compartido. Solo en Vercel. Si alguna
> vez sospechas que se ha visto, se rota desde el mismo panel en dos clics.

**`STRIPE_WEBHOOK_SECRET`**
Stripe → *Developers* → *Webhooks* → el que se llama **Ghoosted** →
**Signing secret**. Empieza por `whsec_`.

Con estas dos, ya se cobra.

---

## Paso 2 · El correo (10 minutos)

Sin esto se cobra igual y el cliente ve su clave en pantalla, pero **no le
llega por correo**. Quien cierre la pestaña sin copiarla se queda sin ella y
te escribe. Merece la pena.

1. Crea una cuenta en **resend.com**
2. *Domains* → *Add domain* → `ghoosted.net`
3. Te da unos registros DNS. Los añades en **Cloudflare** → ghoosted.net →
   DNS, tal cual, en **nube gris**
4. Vuelve a Resend y pulsa *Verify*. Tarda de minutos a una hora
5. *API Keys* → *Create*

Y vuelves a ejecutar `bash poner-claves.sh` para meter:

- **`RESEND_API_KEY`** — la que acabas de crear
- **`MAIL_FROM`** — `Ghoosted <hello@ghoosted.net>`

> El `MAIL_FROM` tiene que ser del dominio verificado. Con el remitente de
> pruebas de Resend los correos **solo te llegan a ti**: ningún cliente
> recibiría su clave y tú no te enterarías.

---

## Paso 3 · Volver a desplegar

Las variables no se aplican solas.

    npx vercel --prod

O simplemente haz un push: el repositorio está conectado y despliega solo.

---

## Paso 4 · La compra de prueba (esto NO te lo saltes)

Compra Ghoosted Pro con tu propia tarjeta. 5 € de verdad. Es la única forma
de saber que funciona, y te los devuelves después desde Stripe.

Comprueba las cinco:

1. La pantalla de pago dice **Ghoosted Pro** (no "Ghosted")
2. Al pagar, sale la **clave** en pantalla
3. Llega el **correo** con la clave y el enlace
4. El **ZIP se descarga** desde el enlace
5. La clave **activa la extensión** en Chrome

Y mira tu extracto: el cargo tiene que poner **GHOOSTED**, no el nombre de la
otra marca.

Si falla algo, en Stripe → *Developers* → *Webhooks* → Ghoosted verás los
intentos y el error exacto.

---

## Impuestos — léelo antes de tocar nada

**Hoy no estás cobrando IVA.** Stripe Tax está activo pero **sin ninguna
región dada de alta**, así que calcula cero. De los 5 € te quedan 5 € menos
la comisión, y el IVA que deberías ingresar no lo está cobrando nadie.

Eso no se arregla con una casilla. El orden es:

1. **Alta como autónomo** y en el censo de Hacienda
2. Si vendes a consumidores de otros países de la UE, alta en **OSS** (basta
   con superar 10.000 € al año en ventas intracomunitarias)
3. En Stripe → *Tax* → *Registrations*, añades España (y OSS si aplica)

En cuanto añadas el alta, **el IVA se calcula y se desglosa solo**: ya dejé
activado el cálculo automático en la pantalla de pago. No hay que tocar
código.

### Por qué el precio sigue con el IVA incluido

Me pediste cobrar los impuestos aparte del precio. **No se puede hacer
vendiendo a consumidores en la UE**: hay que anunciar el precio final con
impuestos (Directiva 98/6/CE y art. 60 del TRLGDCU). Poner 5 € en la web y
cobrar 6,05 € en la pantalla de pago es publicidad engañosa y lo multa
Consumo.

Lo que sí puedes hacer, y es lo normal:

- **Subir el precio anunciado.** Si quieres quedarte 5 € limpios, anuncia
  6,05 € con el IVA incluido. El cliente ve un solo número y tú cobras lo que
  querías.
- **Desglosarlo en el recibo.** Ya está: pondrá "Total 5,00 € · IVA incluido
  0,87 €". El impuesto se ve por separado sin engañar a nadie.

La única excepción es vender a **empresas** con NIF intracomunitario: ahí sí
se factura sin IVA. Stripe lo hace solo si activas la recogida de NIF.

---

## Lo que ya protege el sistema

Por si te lo preguntan, o por si algún día hay que auditarlo:

- **La firma del webhook se verifica** con HMAC y comparación en tiempo
  constante. Sin la firma correcta no se emite ninguna clave.
- **No se puede reenviar una petición vieja**: se rechazan firmas de más de
  5 minutos.
- **Una clave, una cuenta de Instagram**, atado en el servidor de forma
  atómica. Compartir la clave no sirve de nada.
- **Un pago, una clave**: si Stripe reintenta el webhook no emite otra.
- **El ZIP solo sale contra una clave válida**, y no lo indexa Google.
- **Freno por IP** en activar (10 cada 10 min), verificar (60) y pagar (20).
- **Reembolso completo = clave revocada**, automático.
- La web sirve HSTS, CSP y las cabeceras de siempre.

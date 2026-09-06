# Ficha para la Chrome Web Store — **Ghoosted Plus**

Escrita el 6 de septiembre de 2026, contra el paquete real de la 1.57.0
generado por `Ghosted-Pro/tools/construir-plus.js`.

**A la tienda va Plus. Pro no se envía**: se vende desde la web con clave de
licencia y descarga protegida, y la política de la tienda no gobierna lo que
distribuyes por tu cuenta.

Lo mínimo a propósito. Quien llega aquí ya viene de la landing o de redes: la
ficha no tiene que vender, sólo tiene que pasar la revisión y no contradecir
nada de lo que hace la extensión.

> **La regla que manda en este documento.** Cada frase de aquí abajo tiene que
> poder comprobarse abriendo el paquete. Describir una función que no está es
> motivo de rechazo exactamente igual que esconder una que sí está — y es el
> error que tenía la versión anterior de esta ficha, que hablaba de
> espectadores de historias y de descargas porque se escribió para Pro.

---

## Nombre
```
Ghoosted
```
Sin "Instagram" ni "unfollow tracker" detrás. Una marca ajena en el nombre puede
leerse como que la extensión es oficial, y eso se retira por propiedad
intelectual.

## Descripción corta (132 caracteres máximo)
```
Mira quién deja de seguirte en Instagram. Tus datos se quedan en tu equipo.
```
Es literalmente la `extDesc` del manifiesto, así que ficha y paquete no pueden
contradecirse.

## Descripción larga
```
Ghoosted te dice quién ha dejado de seguirte, quién no te sigue de vuelta y
quién ha empezado a seguirte, sobre tu propia cuenta de Instagram.

Qué hace:
· Quién te ha dejado de seguir, desde la primera revisión.
· Quién no te sigue de vuelta.
· Seguidores nuevos.
· Un registro de los cambios: quién llega, quién se va y cuándo.
· Ficha de un perfil con sus datos públicos y su engagement.
· Comprobar si dos cuentas se siguen entre ellas.
· Exportar todo lo tuyo en un archivo JSON.

Qué NO hace:
· No publica, ni da me gusta, ni comenta, ni sigue o deja de seguir por ti.
  Ghoosted no realiza ninguna acción sobre tu cuenta: sólo lee.
· No te pide la contraseña. Trabaja con la sesión que ya tienes abierta.
· No vigila cuentas de otras personas.

Todo se calcula y se guarda en tu propio navegador. Ghoosted no tiene copia de
tus seguidores ni de tus listas.

Funciona mientras tengas Instagram abierto en una pestaña.

No está asociada a Instagram ni a Meta. Instagram es una marca registrada de
Meta Platforms, Inc.
```

El bloque **"Qué NO hace"** no es humildad: es la respuesta anticipada a las
tres preguntas por las que se retira una extensión de este tipo. Que esté
escrito en la ficha y sea cierto en el código es lo que hace corta la revisión.

## Categoría
Redes sociales y comunicación.

## Justificación de cada permiso
La tienda los pide uno a uno. Son cuatro, y estos son todos:

| Permiso | Por qué |
|---|---|
| `storage` | Guardar tus listas y tus ajustes en el navegador. |
| `alarms` | Programar la revisión periódica. |
| `notifications` | Avisarte cuando alguien deja de seguirte. |
| `scripting` | Leer los datos de Instagram desde su propia página, con tu sesión. |

| Acceso a sitios | Por qué |
|---|---|
| `www.instagram.com`, `i.instagram.com` | Es de donde salen los datos. |
| `*.cdninstagram.com`, `*.fbcdn.net` | Mostrar las fotos de perfil de las cuentas que aparecen en el panel. Cuando Instagram rechaza la carga directa de la imagen, es el único camino para enseñarla. |
| `ghoosted.net` | Comprobar la licencia y si hay una versión nueva. |

El dominio propio es **ghoosted.net**, ya comprado y ya puesto en
`homepage_url` y en `host_permissions` del manifiesto.

**Los que NO pide**, y conviene saberlo por si el revisor pregunta:
- Sin `downloads`. Plus no puede guardar nada en tu disco salvo tu propia
  exportación en JSON, que la genera el navegador y no necesita permiso.
- Sin `unlimitedStorage`. El archivo local de fotos de perfil cabe en el
  almacenamiento normal.

## Uso de los datos (pestaña Privacidad)
Marcar únicamente:
- **Información de identificación personal**: no.
- **Actividad del usuario**: no.
- **Comunicaciones personales**: no.

Y declarar lo que sí sale del equipo:
- El **identificador numérico de la cuenta de Instagram**, sólo al activar o
  comprobar la licencia, para atarla a una cuenta y evitar que se comparta.
- Nada más. Ni seguidores, ni fotos, ni actividad.

Las tres casillas obligatorias:
- No se venden ni se transfieren datos a terceros.
- No se usan para nada ajeno a la función principal.
- No se usan para determinar solvencia ni para préstamos.

## Capturas
Google pide 1280×800 o 640×400. Con tres o cuatro basta, y **tienen que ser de
Plus**, no de Pro:

- [ ] El panel abierto sobre un perfil, con las cuatro pestañas y los contadores.
- [ ] La pestaña "Te dejaron" con la lista.
- [ ] La pestaña "Actividad".
- [ ] "¿Se siguen?" con un resultado.

Las que hay en la landing (`ghost.jpg`, `story.jpg`, el expediente con modo
fantasma) **no valen**: enseñan funciones que Plus no lleva y contradicen la
ficha.

## Antes de enviar
- [x] Código legible: sin ofuscar desde la 1.57.0 (notación de punto, números
      en decimal, un fichero por línea de lógica).
- [x] Ficha y paquete dicen lo mismo: comprobado contra el build del 6 de
      septiembre. Las 265 comprobaciones de `node test/run.js` incluyen 57 que
      verifican que Plus no lleva nada de lo que esta ficha dice que no lleva.
- [x] Política de privacidad al día: declara el identificador de cuenta, el
      archivo local de fotos de perfil y la comprobación de versión, en los 12
      idiomas.
- [x] **Dominio propio**: ghoosted.net, comprado y ya escrito en el manifiesto
      de Pro (Plus se regenera solo). Falta apuntarlo al proyecto de Vercel.
- [ ] Capturas nuevas, de Plus.
- [ ] Guardar copia del ZIP exacto que se sube y del código sin minificar, por
      si piden auditoría.
- [ ] Probada cargada en Chrome sobre una cuenta real.

## Lo que NO hay que tocar todavía
`FREE_MODE` sigue en `true`. Se envía a revisión así: la extensión funciona
completa y el revisor puede probarla sin pedir una clave, que es justo lo que
necesita para aprobarla. El interruptor se baja el día del lanzamiento, con los
pagos ya montados — y quien la tenga instalada pierde el acceso ese día, porque
no hay grandfathering.

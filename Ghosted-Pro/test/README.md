# Comprobaciones

```bash
cd Ghosted-Pro && npm test          # todas
cd Ghosted-Pro && npm test puente   # sólo las que contengan "puente"
```

Sale con código 1 si algo falla, así que se puede encadenar antes de empaquetar:

```bash
npm test && zip -r ../dist/Ghosted-Pro.zip . -x '.*' 'test/*' 'package.json'
```

## Por qué están escritas así

El código de la extensión va minificado en una sola línea y no exporta nada, así
que no se puede importar. `test/lib/extraer.js` saca cada función del fichero
leyendo carácter a carácter (saltándose comillas y expresiones regulares, porque
hay literales como `startsWith('{')` que descuadran cualquier cuenta de llaves) y
la ejecuta con dependencias de mentira. Así se prueba **el código que se envía**,
no una copia que se queda vieja.

## Qué vigila cada una

| fichero | qué protege |
|---|---|
| `integridad` | sintaxis, funciones declaradas dos veces, los 12 idiomas cuadrados, textos sin traducir, ficheros del manifiesto |
| `puente` | qué peticiones pueden escribir en Instagram y cuáles no, y la firma que exige |
| `clasificador` | traducir la respuesta de Instagram a un motivo, y el corte por endpoint |
| `publicaciones` | leer el tablón y las vías de respaldo |
| `perfil-por-nombre` | las tres vías para encontrar a alguien por su @ |
| `solicitudes` | aprobar en bloque sin arrasar y sin rechazar por su cuenta |
| `parejas` | avisar si A deja de seguir a B, sin falsos positivos |
| `fotos` | archivar la foto antes de que caduque y el antes/después |
| `caras` | recuperar las fotos que ya salieron como letra |
| `buscador` | encontrar nombres con tildes y alfabetos decorativos |
| `interfaz` | el botón de vigilar, la gráfica y el tiempo restante |
| `aviso-version` | el aviso de versión nueva y que el texto remoto no inyecte nada |

`integridad` es la que más veces ha encontrado algo: el minificador usa nombres
de dos letras y ya ha habido tres colisiones que rompieron el panel en silencio.

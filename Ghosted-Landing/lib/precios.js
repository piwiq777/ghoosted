'use strict';
/* ===========================================================================
   LO QUE CUESTA, EN UN SOLO SITIO
   ---------------------------------------------------------------------------
   El precio esta escrito a mano en veinticuatro sitios: dos repositorios, doce
   idiomas, y unos cuantos literales en HTML sin traducir. Lo que se COBRA, en
   cambio, sale de un identificador de precio de Stripe que vive en una
   variable de entorno.

   O sea que son dos verdades distintas que nadie compara. Cambiar una y
   olvidar la otra da el peor fallo posible de una tienda: la web anuncia un
   precio y el cargo es otro. Eso es una reclamacion al banco por cada compra,
   y en la UE ademas es publicidad enganosa.

   Esto es la verdad de la web. `/api/status?salud=1` compara estos numeros con
   los que Stripe dice de verdad, y una comprobacion de la bateria vigila que
   ningun fichero contradiga esto.
   =========================================================================== */

/* En centimos, como Stripe. Nunca en euros con coma flotante. */
const PRECIOS = {
  pro: 500,
  plus: 350,
};

/* Como se escribe cada uno, para poder buscarlo en los textos. La coma o el
   punto decimal cambian por idioma; lo que no cambia son los digitos. */
function digitos(centimos) {
  return centimos % 100 === 0 ? String(centimos / 100) : (centimos / 100).toFixed(2);
}

module.exports = { PRECIOS, digitos };

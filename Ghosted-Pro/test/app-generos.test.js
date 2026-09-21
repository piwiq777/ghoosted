'use strict';
/* HOMBRE O MUJER, A PARTIR DEL NOMBRE.
 * La regla de la terminacion (-a mujer, -o hombre) se disparaba con
 * cualquier palabra de 3 a 9 letras. "Biloba" es una discoteca y salia
 * contada como mujer. Ahora esa regla solo se aplica si detras hay algo que
 * parece una persona; lo demas va a "sin clasificar", que para eso esta. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { suite } = require('./lib/probar');

const FICHERO = path.join(__dirname, '..', '..', 'Ghosted-App', 'web', 'generos.js');

module.exports = () => {
  const s = suite('hombre o mujer · app');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(FICHERO, 'utf8'), ctx);
  const G = ctx.window.Generos;
  const de = (full, username) => G.de({ full_name: full, username: username || '' });

  /* Lo que NO puede pasar: inventarse el genero de un negocio. */
  s.eq('una discoteca no es una mujer', de('Biloba', 'biloba'), null);
  s.eq('ni con el nombre compuesto', de('Biloba Club', 'bilobaclub'), null);
  s.eq('ni una pizzeria', de('Pizzeria Roma', 'pizzaroma'), null);
  s.eq('ni un gimnasio', de('Forma Fit Studio', 'formafit'), null);
  s.eq('ni una cuenta de memes', de('', 'memesdiarios'), null);
  s.eq('ni una marca suelta', de('Sativa', 'sativa.store'), null);

  /* Lo que SI tiene que seguir saliendo: personas. */
  s.eq('un nombre de la lista, aunque vaya solo', de('Marta', 'marta_'), 'm');
  s.eq('  y uno de hombre', de('Javier', 'javi92'), 'h');
  s.eq('nombre y apellido fuera de la lista', de('Nadia Ferrer', 'nadiaf'), 'm');
  s.eq('  y el masculino', de('Nilo Arribas', 'niloarr'), 'h');
  s.eq('tres palabras tambien es una persona', de('Laura Gomez Ruiz', 'lgr'), 'm');
  s.eq('y por el @ cuando no hay nombre', de('', 'alvaro.c'), 'h');

  /* El reparto no cuenta a los que no sabe: si no, un negocio movia el %. */
  const r = G.reparto([
    { full_name: 'Marta Ruiz', username: 'marta' },
    { full_name: 'Biloba', username: 'biloba' },
    { full_name: 'Javier Ortiz', username: 'javi' },
  ]);
  s.eq('el reparto solo cuenta a quien sabe', r.total, 2);
  s.eq('  y deja fuera al que no', r.sin, 1);
  s.eq('  mitad y mitad', r.pctM, 50);

  /* Limite conocido y aceptado: una marca de dos palabras cuya primera
     palabra ES un nombre de persona (Estrella Galicia, Ginkgo Biloba) no se
     puede distinguir sin un diccionario de marcas. Se deja escrito para que
     nadie lo "arregle" rompiendo los nombres de verdad. */
  s.ok('limite anotado: marca con nombre de persona delante',
    de('Estrella Galicia', 'estrellagalicia') === 'm');

  return s;
};

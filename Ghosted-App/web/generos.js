/* Ghoosted — hombre o mujer, a partir del nombre.
 *
 * Instagram no dice el genero de nadie. Esto lo estima por el nombre de pila
 * (el del perfil y, si no hay, el del @), con una lista de nombres comunes y
 * la terminacion en castellano (-a / -o) cuando el nombre no esta en la
 * lista. Es una estimacion: lo que no se puede saber va a "sin clasificar" y
 * no cuenta en el porcentaje. */
window.Generos = (function () {
  'use strict';
  var M = ('adrian alejandro alex alvaro andres angel antonio carlos cesar cristian daniel david diego eduardo enrique ' +
    'fernando francisco gabriel gonzalo guillermo hector hugo ignacio ivan jaime javier jesus joan joaquin jordi jorge jose ' +
    'josep juan julian julio leo leonardo lucas luis manuel marc marcos mario martin mateo miguel nacho nicolas oscar pablo ' +
    'pau pedro pol rafael ramon raul ricardo roberto rodrigo ruben salvador samuel santiago sergio tomas victor xavi ' +
    'aaron abel adam aitor alberto albert alfonso alfredo alonso amador ander aritz arnau asier axel bruno cristobal dani ' +
    'dario denis eric erik ernesto esteban ezequiel fabian felipe fermin francesc gerard german gil gorka guille hernan ' +
    'iker inigo isaac ismael izan jacobo jairo jan jon jonathan josue kevin lorenzo marcelo mariano matias mauricio max ' +
    'maximo mohamed moises nahuel nil noel omar oriol paco pepe quique rayan rober roger ruben saul sebastian teo thiago ' +
    'tony unai valentin vicente yago yeray youssef ahmed ali alan andrew anthony ben brandon brian charles chris christian ' +
    'david dylan edward ethan frank george harry henry jack jacob jake james jason john johnny joseph josh justin kyle liam ' +
    'luke mark matt matthew michael mike nathan nick noah oliver patrick paul peter richard robert ryan sam scott steven ' +
    'thomas tom tyler william zack luca marco matteo giovanni francesco lorenzo alessandro pierre jean louis hans').split(' ');
  var F = ('ana andrea angela alba alejandra alicia amparo aurora beatriz belen blanca carla carmen carolina celia claudia ' +
    'cristina diana elena elisa elsa emma esther eva fatima gloria helena ines irene isabel julia laura lidia lola lorena ' +
    'lucia luisa marina marta maria mercedes miriam monica natalia nerea noelia nuria olga paula patricia pilar raquel ' +
    'rocio rosa sandra sara silvia sofia sonia susana teresa valeria vanesa veronica victoria yolanda ainhoa aitana ' +
    'alexandra africa abril adriana aina ainara alma amaia anna ariadna berta candela cayetana chloe daniela debora ' +
    'eli elsa estela estrella gala gemma georgina ingrid iratxe itziar jana jimena judith leire leyre lara lia lina ' +
    'luna macarena maialen malena mar mia martina mireia naia nahia nora olivia pepa rebeca regina rut salma sheila ' +
    'tamara valentina vega vera xenia yaiza zoe abigail amanda amber amy anna ashley brittany chelsea chloe emily emma ' +
    'grace hannah isabella jessica jennifer kate katie kim lauren lily madison megan melissa michelle natalie nicole ' +
    'rachel samantha sarah sophie stephanie taylor tiffany giulia francesca chiara giorgia alessia marie camille lea ' +
    'manon').split(' ');
  var HOMBRE = {}, MUJER = {};
  M.forEach(function (n) { HOMBRE[n] = 1; });
  F.forEach(function (n) { MUJER[n] = 1; });
  // Terminan en -a pero son de hombre, y al reves.
  var EXC_M = { luca: 1, nikita: 1, joshua: 1, garcia: 1, mustafa: 1, borja: 1, sasha: 1 };
  var EXC_F = { consuelo: 1, rocio: 1, amparo: 1, rosario: 1, socorro: 1, pilar: 1, carmen: 1, ines: 1 };

  function limpio(t) {
    return String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z\s._-]/g, ' ');
  }
  function trozos(p) {
    return limpio(p.full_name).trim().split(/[\s._-]+/).filter(function (x) { return x.length > 1; });
  }
  function candidato(p) {
    var n = trozos(p)[0];
    if (!n) n = limpio(p.username).split(/[\s._\-0-9]+/).filter(function (x) { return x.length > 2; })[0];
    return n || '';
  }
  /* ¿Esto parece una PERSONA? La terminacion -a / -o solo vale si lo es.
     "Biloba" es una discoteca y acababa contada como mujer, porque termina
     en -a y tiene seis letras. Un nombre y un apellido son dos palabras; un
     negocio suele ser una sola, o lleva algo que lo delata. */
  var NEGOCIO = /(oficial|official|store|shop|club|bar|cafe|caf|studio|estudio|salon|clinic|clinica|center|centro|team|crew|agency|agencia|company|events|eventos|music|media|fit|gym|hotel|restaurant|tattoo|beauty|nails|hair|barber|academy|academia|school|escuela|photo|foto|design|art|records|radio|tv|news|shoes|moda|boutique|pizzeria|burger|disco|lounge)/;
  function pareceGente(p) {
    var t = trozos(p);
    if (t.length < 2) return false;                 // un nombre suelto no basta
    if (t.length > 4) return false;                 // eso ya es una frase
    if (NEGOCIO.test(limpio(p.full_name) + ' ' + limpio(p.username))) return false;
    return t.every(function (x) { return x.length > 1 && x.length < 14; });
  }
  function de(p) {
    var n = candidato(p);
    if (!n) return null;
    // La lista de nombres manda: "Marta" es Marta aunque vaya sola.
    if (HOMBRE[n]) return 'h';
    if (MUJER[n]) return 'm';
    if (EXC_M[n]) return 'h';
    if (EXC_F[n]) return 'm';
    // Fuera de la lista, adivinar por la terminacion solo si detras hay una
    // persona. Si no, a "sin clasificar", que para eso esta.
    if (!pareceGente(p)) return null;
    if (n.length < 3 || n.length > 9) return null;
    if (/[aeiou](a)$/.test(n) || /[^aeiou]a$/.test(n)) return 'm';
    if (/[^aeiou]o$/.test(n)) return 'h';
    return null;
  }
  function reparto(lista) {
    var h = 0, m = 0, x = 0;
    (lista || []).forEach(function (p) { var g = de(p); if (g === 'h') h++; else if (g === 'm') m++; else x++; });
    var t = h + m;
    return { hombres: h, mujeres: m, sin: x, pctH: t ? Math.round(h / t * 100) : 0, pctM: t ? 100 - Math.round(h / t * 100) : 0, total: t };
  }
  return { de: de, reparto: reparto };
})();

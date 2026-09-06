'use strict';
/* Ejecuta todas las comprobaciones del directorio. Sale con código 1 si algo
 * falla, para poder encadenarlo antes de empaquetar. */
const fs = require('fs');
const path = require('path');

const VERDE = '\x1b[32m', ROJO = '\x1b[31m', GRIS = '\x1b[90m', FIN = '\x1b[0m';
const soloEste = process.argv[2];

(async () => {
  const ficheros = fs.readdirSync(__dirname)
    .filter((f) => f.endsWith('.test.js'))
    .filter((f) => !soloEste || f.includes(soloEste))
    .sort();

  let total = 0, fallos = 0;
  const conFallo = [];

  for (const f of ficheros) {
    let suite;
    try {
      suite = await require(path.join(__dirname, f))();
    } catch (e) {
      fallos++; total++;
      conFallo.push(f + ': ' + (e && e.message));
      console.log(`${ROJO}✗${FIN} ${f} ${GRIS}— reventó al ejecutarse${FIN}\n  ${e && e.message}`);
      continue;
    }
    const malos = suite.casos.filter((c) => !c.ok);
    total += suite.casos.length;
    fallos += malos.length;
    const marca = malos.length ? `${ROJO}✗${FIN}` : `${VERDE}✓${FIN}`;
    console.log(`${marca} ${suite.nombre} ${GRIS}(${suite.casos.length})${FIN}`);
    for (const c of malos) {
      conFallo.push(suite.nombre + ' → ' + c.titulo);
      console.log(`    ${ROJO}${c.titulo}${FIN}`);
      console.log(`      esperaba ${JSON.stringify(c.esperado)}`);
      console.log(`      obtuvo   ${JSON.stringify(c.obtenido)}`);
    }
  }

  console.log('');
  if (fallos) {
    console.log(`${ROJO}${fallos} de ${total} comprobaciones fallan${FIN}`);
    process.exit(1);
  }
  console.log(`${VERDE}${total} comprobaciones, todas correctas${FIN}`);
})();

'use strict';
/* Lo mínimo para escribir comprobaciones legibles. Nada de dependencias:
 * esto tiene que poder ejecutarse en cualquier sitio con sólo node. */
function suite(nombre) {
  const casos = [];
  const api = {
    nombre,
    casos,
    /* Compara por valor. El nombre se lee en el informe, así que se escribe
     * como una frase: "no encola dos veces al mismo". */
    eq(titulo, obtenido, esperado) {
      const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
      casos.push({ titulo, ok, obtenido, esperado });
      return ok;
    },
    ok(titulo, condicion) {
      casos.push({ titulo, ok: !!condicion, obtenido: !!condicion, esperado: true });
      return !!condicion;
    },
    /* Comprueba que algo revienta, y con qué tipo de error. */
    lanza(titulo, fn, clase) {
      let visto = '(no lanzó)';
      try { fn(); } catch (e) { visto = (e && e.kind) || (e && e.name) || String(e); }
      return api.eq(titulo, visto, clase);
    },
  };
  return api;
}
module.exports = { suite };

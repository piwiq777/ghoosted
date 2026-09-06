'use strict';
/* El puente al contexto de la página es la única vía de escritura, así que
 * su lista blanca es también la barrera de seguridad: si se abre de más,
 * cualquier página podría usarla de proxy. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('puente de escritura · permisos y firma');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'page-api.js'), 'utf8');
  // OJO: en el fuente hay DOS asignaciones. La primera, /(?!)/, es la que
  // hereda Plus (puente de solo lectura); la segunda es la de Pro. Aqui se
  // comprueba la de Pro, que es la que este paquete usa de verdad.
  const POST = eval(src.match(/^\s*POST_ALLOWED = (\/.*?\/);/m)[1]);
  const GET = eval(src.match(/var GET_ALLOWED = (\/.*?\/);/)[1]);
  const R = 'https://www.instagram.com/api/v1/';

  s.ok('dejar de seguir permitido', POST.test(R + 'friendships/destroy/12345/'));
  s.ok('seguir permitido', POST.test(R + 'friendships/create/12345/'));
  s.ok('aprobar solicitud permitido', POST.test(R + 'web/friendships/12345/approve/'));
  s.ok('rechazar solicitud permitido', POST.test(R + 'web/friendships/12345/ignore/'));
  s.ok('sin barra final también', POST.test(R + 'web/friendships/12345/approve'));
  s.eq('bloquear NO está permitido', POST.test(R + 'web/friendships/12345/block/'), false);
  s.eq('quitar seguidor NO está permitido', POST.test(R + 'web/friendships/12345/remove_follower/'), false);
  s.eq('otro endpoint NO', POST.test(R + 'media/1/delete/'), false);
  s.eq('otro dominio NO', POST.test('https://evil.com/api/v1/web/friendships/1/approve/'), false);
  s.eq('sin número de cuenta NO', POST.test(R + 'web/friendships/abc/approve/'), false);
  s.eq('ruta manipulada NO', POST.test(R + 'web/friendships/1/approve/../../x'), false);
  s.ok('las lecturas de la api siguen permitidas', GET.test(R + 'friendships/pending/?'));
  s.ok('graphql permitido', GET.test('https://www.instagram.com/graphql/query/?x=1'));
  s.eq('otro dominio en lectura NO', GET.test('https://evil.com/api/v1/x'), false);

  // Instagram firma cada POST con dos valores de su propio runtime
  const cuerpo = src.slice(src.indexOf('function signBody'), src.indexOf('// El claim que Instagram'));
  const ventana = (sp, dtsg) => ({ require: (n) => {
    if (n === 'PolarisConfig') return { getSprinkleToken: () => sp };
    if (n === 'SprinkleConfig') return { param_name: 'jazoest' };
    if (n === 'DTSG') return { getToken: () => dtsg };
    return null; } });
  const firmar = (win) => new Function('igModule', cuerpo + '; return signBody;')(
    (n) => { try { return win.require(n); } catch (e) { return null; } });

  s.eq('añade jazoest y fb_dtsg', firmar(ventana('22860', 'TOK'))('container_module=profile'),
    'container_module=profile&jazoest=22860&fb_dtsg=TOK');
  s.eq('un cuerpo vacío también se firma', firmar(ventana('1', 'T'))(''), 'jazoest=1&fb_dtsg=T');
  s.eq('no los duplica si ya venían', firmar(ventana('9', 'T'))('jazoest=9&fb_dtsg=T'), 'jazoest=9&fb_dtsg=T');
  s.eq('si Instagram mueve sus módulos, no revienta',
    firmar({ require: () => { throw new Error('no'); } })('a=1'), 'a=1');
  s.ok('un rechazo del puente se contesta en vez de callarse', /error: 'blocked_by_bridge'/.test(src));
  return s;
};

/* Ghoosted — la cuenta.
 *
 * Hablamos con Supabase por su API REST y nada mas. La libreria oficial son
 * 100 KB para hacer cuatro peticiones: aqui no compensa, y encima el APK se
 * baja entero cada vez que se actualiza.
 *
 * Lo que guarda el telefono: el pase de entrada (dos tokens) y el plan. La
 * contraseña NO se guarda en ningun sitio, ni un momento: se manda a Supabase
 * y se olvida.
 *
 * El plan NO se decide aqui. Esto solo lee lo que dice el servidor. Aunque
 * alguien cambie este fichero en su telefono y ponga "pro", el servidor sigue
 * diciendo lo que diga, y las listas que se piden a Instagram las recorta el
 * motor con ese dato. */
window.Cuenta = (function () {
  'use strict';

  var URL = 'https://igqpjbdkrhrwhwelvuip.supabase.co';
  var CLAVE = 'sb_publishable_ORoAIHvissgs_GjajzHPpQ_MpBcpjCy';
  var GUARDA = 'ghd_cuenta';

  var S = cargar();
  var oyentes = [];

  function cargar() {
    try { return JSON.parse(localStorage.getItem(GUARDA) || 'null') || vacia(); }
    catch (e) { return vacia(); }
  }
  function vacia() { return { token: null, refresco: null, caduca: 0, correo: null, id: null, plan: 'gratis', planHasta: null }; }
  function guardar() { try { localStorage.setItem(GUARDA, JSON.stringify(S)); } catch (e) {} }
  function avisar() { oyentes.forEach(function (f) { try { f(S); } catch (e) {} }); }
  function on(f) { oyentes.push(f); }

  async function pedir(ruta, opc) {
    opc = opc || {};
    var cab = { 'apikey': CLAVE, 'Content-Type': 'application/json' };
    if (opc.conSesion && S.token) cab['Authorization'] = 'Bearer ' + S.token;
    var r;
    try {
      r = await fetch(URL + ruta, { method: opc.metodo || 'GET', headers: cab, body: opc.cuerpo ? JSON.stringify(opc.cuerpo) : undefined });
    } catch (e) { throw { kind: 'red' }; }
    var j = null;
    try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw { kind: 'api', status: r.status, codigo: j && (j.error_code || j.code), msg: j && (j.msg || j.message || j.error_description) };
    return j;
  }

  function guardarSesion(j) {
    if (!j || !j.access_token) return false;
    S.token = j.access_token;
    S.refresco = j.refresh_token || S.refresco;
    S.caduca = Date.now() + (Number(j.expires_in || 3600) - 60) * 1000;
    S.correo = (j.user && j.user.email) || S.correo;
    S.id = (j.user && j.user.id) || S.id;
    guardar();
    return true;
  }

  /* Registrarse. Si el proyecto pide confirmar el correo, Supabase devuelve
     el usuario SIN pase de entrada: hay que pinchar el enlace del email
     antes de poder entrar. Se devuelve cual de las dos cosas ha pasado para
     que la pantalla diga lo que toca. */
  async function registrar(correo, clave) {
    var j = await pedir('/auth/v1/signup', { metodo: 'POST', cuerpo: { email: correo, password: clave } });
    if (guardarSesion(j)) { await refrescarPlan(); avisar(); return { dentro: true }; }
    return { dentro: false, confirmar: correo };
  }

  async function entrar(correo, clave) {
    var j = await pedir('/auth/v1/token?grant_type=password', { metodo: 'POST', cuerpo: { email: correo, password: clave } });
    if (!guardarSesion(j)) throw { kind: 'api', codigo: 'sin_sesion' };
    await refrescarPlan();
    avisar();
    return { dentro: true };
  }

  async function salir() {
    try { await pedir('/auth/v1/logout', { metodo: 'POST', conSesion: true, cuerpo: {} }); } catch (e) {}
    S = vacia(); guardar(); avisar();
  }

  /* El pase de entrada dura una hora. Antes de cada peticion se mira si esta
     a punto de caducar y se renueva con el de refresco, que dura mucho mas.
     Asi no hay que volver a entrar cada hora. */
  async function alDia() {
    if (!S.token) return false;
    if (Date.now() < S.caduca) return true;
    if (!S.refresco) { S = vacia(); guardar(); avisar(); return false; }
    try {
      var j = await pedir('/auth/v1/token?grant_type=refresh_token', { metodo: 'POST', cuerpo: { refresh_token: S.refresco } });
      return guardarSesion(j);
    } catch (e) {
      // Si el refresco ya no vale, la sesion se acabo de verdad.
      if (e && e.kind === 'api') { S = vacia(); guardar(); avisar(); }
      return false;
    }
  }

  /* El plan, preguntado al servidor. Si no hay red se queda el ultimo que se
     supo: quien ha pagado no se queda sin Pro por estar en el metro. */
  async function refrescarPlan() {
    if (!(await alDia())) return S.plan;
    try {
      var f = await pedir('/rest/v1/perfiles?select=plan,plan_hasta&limit=1', { conSesion: true });
      var p = f && f[0];
      if (p) {
        S.plan = p.plan || 'gratis';
        S.planHasta = p.plan_hasta || null;
        guardar(); avisar();
      }
    } catch (e) { /* sin red: se queda como estaba */ }
    return S.plan;
  }

  function caducado() {
    return !!(S.planHasta && Date.now() > Date.parse(S.planHasta));
  }
  function plan() { return caducado() ? 'gratis' : (S.plan || 'gratis'); }
  function esPro() { return plan() === 'pro'; }
  /* En el navegador (modo demo) no se pide cuenta: es para mirar el diseño,
     no para registrarse. */
  function dentro() { return !!S.token || !!(window.Puente && window.Puente.demo); }

  /* Los avisos de Supabase vienen en ingles y de lo mas variado. Aqui se
     traducen los que van a salir de verdad; el resto cae en uno generico que
     al menos no miente. */
  function texto(e) {
    var c = e && e.codigo, m = String((e && e.msg) || '');
    if (!e) return 'Algo ha fallado';
    if (e.kind === 'red') return 'Sin conexión';
    if (c === 'invalid_credentials' || /invalid login/i.test(m)) return 'Ese correo o esa contraseña no son';
    if (c === 'email_address_invalid' || /invalid/i.test(m) && /email/i.test(m)) return 'Ese correo no vale';
    if (c === 'user_already_exists' || /already registered/i.test(m)) return 'Ya hay una cuenta con ese correo. Entra en vez de registrarte';
    if (c === 'weak_password' || /password should be/i.test(m)) return 'La contraseña es muy corta: mínimo 6 letras';
    if (c === 'email_not_confirmed') return 'Confirma tu correo: te mandamos un enlace al registrarte';
    if (c === 'over_email_send_rate_limit') return 'No se pueden mandar más correos ahora mismo. Prueba dentro de un rato';
    if (e.status === 429) return 'Demasiados intentos. Espera un poco';
    return m ? m.slice(0, 80) : 'Algo ha fallado';
  }

  return {
    get estado() { return S; },
    on: on, registrar: registrar, entrar: entrar, salir: salir,
    alDia: alDia, refrescarPlan: refrescarPlan,
    dentro: dentro, plan: plan, esPro: esPro, caducado: caducado, texto: texto
  };
})();

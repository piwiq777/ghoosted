'use strict';
/* Activar la clave recien comprada.
 *
 * Es el unico tramo en el que el cliente ya ha pagado y todavia no tiene nada.
 * Si falla, lo que ve es una extension que no hace "una puta mierda" —palabras
 * del dueño— y un mensaje que le manda abrir Instagram con Instagram delante.
 * Cada comprobacion de aqui corresponde a una de las tres razones por las que
 * fallaba. */
const fs = require('fs');
const path = require('path');
const { suite } = require('./lib/probar');

const PRO = path.resolve(__dirname, '..');
const leer = (rel) => fs.readFileSync(path.join(PRO, rel), 'utf8');

module.exports = () => {
  const s = suite('activar la clave');

  /* 1 · Instagram sirve en los DOS dominios. Con solo www, quien entraba por
         instagram.com a secas no tenia ni content script ni permiso: la
         extension no existia en esa pestaña. */
  const man = JSON.parse(leer('manifest.json'));
  for (const c of man.content_scripts) {
    s.ok('el content script cubre www', c.matches.indexOf('https://www.instagram.com/*') !== -1);
    s.ok('y tambien instagram.com a secas', c.matches.indexOf('https://instagram.com/*') !== -1);
  }
  s.ok('los permisos cubren los dos dominios',
    man.host_permissions.indexOf('https://www.instagram.com/*') !== -1
    && man.host_permissions.indexOf('https://instagram.com/*') !== -1);

  const popup = leer('popup/popup.js');
  s.ok('el popup busca en los dos dominios',
    /'https:\/\/www\.instagram\.com\/\*', 'https:\/\/instagram\.com\/\*'/.test(popup));
  /* 2 · Y si Instagram no es la pestaña de delante, se busca en las demas:
         nadie tiene por que dejarla en primer plano para pegar una clave. */
  s.ok('si no es la pestaña activa, mira las demas',
    /if \(!pestanas\[0\]\) pestanas = await chrome\.tabs\.query\(\{ url: DOMINIOS \}\)/.test(popup));

  /* 3 · El id de la cuenta se releia una sola vez al cargar. Si la sesion no
         estaba lista en ese instante, se quedaba vacio para siempre y ni
         recargando se arreglaba. */
  const content = leer('src/content.js');
  s.ok('el id de la cuenta se relee al preguntarlo',
    /accountId: k\.getUserId\(\) \|\| O/.test(content));
  s.ok('y el listener se registra antes de la puerta de licencia',
    content.indexOf('getAccountId') < content.indexOf('if (!v()) {\n      G(Y("unlock_status")'));

  /* 4 · Mensajes que digan lo que pasa de verdad. "Abre Instagram" con
         Instagram abierto es lo que hace pensar que te han estafado. */
  const en = JSON.parse(leer('_locales/en/messages.json'));
  for (const k of ['popup_need_ig', 'popup_need_reload', 'popup_need_login']) {
    s.ok('existe el mensaje ' + k, !!en[k]);
  }
  s.ok('se distingue "no contesta" de "no hay pestaña"',
    /if \(!quien\) \{ aviso\(t\('popup_need_reload'\)/.test(popup));
  s.ok('y "no has iniciado sesion" de las otras dos',
    /if \(!quien\.accountId\) \{ aviso\(t\('popup_need_login'\)/.test(popup));

  /* 5 · El fantasma tiene que salir SIN licencia: es desde donde se pega la
         clave. Si solo saliera con licencia, no habria forma de activarla. */
  s.ok('el panel se monta antes de comprobar la licencia',
    content.indexOf('YM(), gt(), ghdStatusLoad();') < content.indexOf('if (!v()) {\n      G(Y("unlock_status")'));

  return s;
};

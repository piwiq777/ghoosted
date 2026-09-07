/* Ghosted — ventana de la extension (el icono de la barra).
 *
 * Reescrito desde el original minificado; mismo comportamiento, con dos
 * arreglos que importaban:
 *
 *   · FREE_MODE estaba escrito a mano aqui dentro. src/build.js dice que es
 *     "el unico fichero que cambia entre la version libre y la de pago", y no
 *     era verdad: al cerrar la puerta en build.js esta ventana seguia diciendo
 *     "Pro activo" y escondiendo el campo de la clave, o sea que el comprador
 *     no tenia donde meterla. Ahora lee la bandera de build.js, como todo lo
 *     demas.
 *   · Iba ofuscado en el codigo fuente. Pro se ofusca AL EMPAQUETAR; el
 *     fuente se mantiene legible porque Plus viaja tal cual a la Chrome Web
 *     Store, y alli el codigo ilegible es motivo de rechazo. */
'use strict';

const BUILD = globalThis.GhostedBuild || { FREE_MODE: true, PRODUCT: 'pro' };
const BUY_URL = 'https://ghoosted.net/#pricing';
const PRIVACY_URL = 'https://ghoosted.net/privacy.html';
const HELP_URL = 'https://ghoosted.net/#faq';
const LICENSE_KEY = 'ghosted_license';

const $ = (id) => document.getElementById(id);

/* Idioma elegido a mano en el panel. Si no hay, manda el del navegador. */
let CUSTOM = null;
async function cargarIdioma() {
  try {
    const { ghosted_lang: elegido } = await chrome.storage.local.get('ghosted_lang');
    if (!elegido || elegido === 'auto') return;
    const r = await chrome.runtime.sendMessage({ type: 'getLocaleMessages', code: elegido });
    CUSTOM = (r && r.messages) || null;
  } catch (e) {
    CUSTOM = null;
  }
}
const idiomaListo = cargarIdioma();

const t = (clave) => {
  if (CUSTOM && CUSTOM[clave] != null) return CUSTOM[clave];
  try { return chrome.i18n.getMessage(clave) || clave; } catch (e) { return clave; }
};

function traducir() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const texto = t(el.getAttribute('data-i18n'));
    if (texto) el.textContent = texto;
  });
}

function pintarPlan(activo, lic) {
  const caja = $('plan');
  if (activo) {
    caja.className = 'plan pro';
    $('plan-name').textContent = t('popup_status_pro');
    $('plan-desc').textContent = lic && lic.buyer
      ? t('popup_pro_desc') + ' — ' + lic.buyer
      : t('popup_pro_desc');
    $('buy-block').hidden = true;
    $('remove').hidden = false;
  } else {
    caja.className = 'plan locked';
    $('plan-name').textContent = t('popup_status_locked');
    $('plan-desc').textContent = t('popup_free_desc');
    $('buy-block').hidden = false;
    $('remove').hidden = true;
  }
}

async function refrescar() {
  /* Con la puerta abierta no hay nada que activar: sobra el campo y sobra el
     boton de comprar. */
  if (BUILD.FREE_MODE) {
    $('plan').className = 'plan pro';
    $('plan-name').textContent = t('popup_status_pro');
    $('plan-desc').textContent = t('popup_pro_desc');
    $('buy-block').hidden = true;
    const campo = document.querySelector('.license');
    if (campo) campo.hidden = true;
    return;
  }
  const guardado = await chrome.storage.local.get(LICENSE_KEY);
  const lic = guardado[LICENSE_KEY];
  pintarPlan(!!(lic && lic.valid && !lic.refunded), lic);
  if (lic && lic.key) $('key').value = lic.key;
}

function aviso(texto, clase) {
  const el = $('msg');
  el.textContent = texto;
  el.className = 'msg' + (clase ? ' ' + clase : '');
}

async function activar() {
  const clave = $('key').value.trim();
  if (!clave) { aviso(t('popup_enter_key'), 'err'); return; }
  $('activate').disabled = true;
  aviso(t('popup_activating'), 'work');
  try {
    /* La clave se ata a UNA cuenta de Instagram, asi que hace falta tener
       Instagram abierto para saber a cual. */
    const pestanas = await chrome.tabs.query({ active: true, currentWindow: true, url: 'https://www.instagram.com/*' });
    if (!pestanas[0]) { aviso(t('popup_need_ig'), 'err'); return; }
    const quien = await chrome.tabs.sendMessage(pestanas[0].id, { type: 'getAccountId' }).catch(() => null);
    if (!quien || !quien.accountId) { aviso(t('popup_need_ig'), 'err'); return; }

    const r = await chrome.runtime.sendMessage({ type: 'verifyLicense', key: clave, accountId: quien.accountId });
    if (r && r.valid) {
      aviso(t('popup_active'), 'ok');
      await refrescar();
    } else if (r && r.error === 'bound') aviso(t('popup_bound'), 'err');
    else if (r && r.error === 'wrong_product') aviso(t('popup_wrong_product'), 'err');
    else if (r && r.refunded) aviso(t('popup_refunded'), 'err');
    else if (r && r.error === 'network') aviso(t('popup_network'), 'err');
    else aviso(t('popup_invalid'), 'err');
  } catch (e) {
    aviso(t('popup_network'), 'err');
  } finally {
    $('activate').disabled = false;
  }
}

async function quitar() {
  await chrome.runtime.sendMessage({ type: 'clearLicense' });
  $('key').value = '';
  aviso(t('popup_removed'), 'ok');
  await refrescar();
}

document.addEventListener('DOMContentLoaded', async () => {
  await idiomaListo;
  traducir();
  /* El precio depende de que version sea esta, y no son el mismo. */
  $('buy').textContent = t(BUILD.PRODUCT === 'plus' ? 'popup_buy_plus' : 'popup_buy_pro');
  $('buy').href = BUY_URL;
  $('privacy').href = PRIVACY_URL;
  $('help').href = HELP_URL;
  $('open-ig').href = 'https://www.instagram.com/';
  $('activate').addEventListener('click', activar);
  $('remove').addEventListener('click', quitar);
  $('key').addEventListener('keydown', (e) => { if (e.key === 'Enter') activar(); });
  await refrescar();
});

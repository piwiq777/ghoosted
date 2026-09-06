/* Ghoosted — legal pages language switcher.
 * Same 12 languages / same dark dropdown as the main landing (index.html),
 * shared across terms.html / privacy.html / refund.html so all three files
 * use one script instead of three copies. Reads/writes the SAME
 * localStorage key ('ghosted_lang') as the main site's i18n.js, so a
 * language picked on either surface carries over to the other.
 */
(function () {
  'use strict';

  var LANGS = [
    { code: 'es',    name: 'Español',   cc: 'es' },
    { code: 'en',    name: 'English',   cc: 'gb' },
    { code: 'pt-BR', name: 'Português', cc: 'br' },
    { code: 'fr',    name: 'Français',  cc: 'fr' },
    { code: 'de',    name: 'Deutsch',   cc: 'de' },
    { code: 'it',    name: 'Italiano',  cc: 'it' },
    { code: 'tr',    name: 'Türkçe',    cc: 'tr' },
    { code: 'id',    name: 'Indonesia', cc: 'id' },
    { code: 'hi',    name: 'हिन्दी',      cc: 'in' },
    { code: 'ru',    name: 'Русский',   cc: 'ru' },
    { code: 'ar',    name: 'العربية',    cc: 'sa' },
    { code: 'ja',    name: '日本語',      cc: 'jp' },
  ];
  var RTL = ['ar'];
  var CODES = LANGS.map(function (l) { return l.code; });

  function show(code) {
    CODES.forEach(function (c) {
      var els = document.querySelectorAll('.lang-' + c);
      for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
    });
    var active = document.querySelectorAll('.lang-' + code);
    for (var j = 0; j < active.length; j++) active[j].style.display = 'block';
    document.documentElement.lang = code;
    document.documentElement.dir = RTL.indexOf(code) !== -1 ? 'rtl' : 'ltr';
    try { localStorage.setItem('ghosted_lang', code); } catch (e) {}
    var lang = null;
    for (var k = 0; k < LANGS.length; k++) if (LANGS[k].code === code) lang = LANGS[k];
    var flagEl = document.getElementById('langFlag');
    var nameEl = document.getElementById('langName');
    if (lang && flagEl) { flagEl.textContent = ''; flagEl.className = 'lang-flag fi fi-' + lang.cc + ' fis'; }
    if (lang && nameEl) nameEl.textContent = lang.name;
    var items = document.querySelectorAll('.lang-item');
    for (var m = 0; m < items.length; m++) {
      var isActive = items[m].getAttribute('data-code') === code;
      items[m].classList.toggle('active', isActive);
      items[m].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  }

  function pick() {
    var saved; try { saved = localStorage.getItem('ghosted_lang'); } catch (e) {}
    if (saved && CODES.indexOf(saved) !== -1) return saved;
    var nav = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < nav.length; i++) {
      var raw = nav[i]; if (!raw) continue;
      var low = raw.toLowerCase(); var two = low.split('-')[0];
      for (var j = 0; j < CODES.length; j++) {
        if (CODES[j].toLowerCase() === low || CODES[j].toLowerCase() === two) return CODES[j];
      }
    }
    return 'en';
  }

  function initSwitcher() {
    var wrap = document.getElementById('langWrap');
    var btn = document.getElementById('langBtn');
    var menu = document.getElementById('langMenu');
    if (!wrap || !btn || !menu) return;

    menu.innerHTML = LANGS.map(function (l) {
      return '<button type="button" class="lang-item" role="option" data-code="' + l.code + '" aria-selected="false">' +
        '<span class="lang-item-flag fi fi-' + l.cc + ' fis"></span><span class="lang-item-name">' + l.name + '</span>' +
        '<svg class="lang-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>';
    }).join('');

    function openMenu() { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.contains('open') ? closeMenu() : openMenu();
    });
    var items = menu.querySelectorAll('.lang-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function (e) { show(e.currentTarget.getAttribute('data-code')); closeMenu(); });
    }
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSwitcher();
    show(pick());
  });
})();

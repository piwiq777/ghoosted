/* Ghoosted landing — tiny i18n engine.
 * English lives inline in index.html (instant first paint + fallback).
 * Every other language is a JSON file in /locales fetched on demand.
 */
window.GhostedI18n = (function () {
  'use strict';

  // ready:true = fully translated for the current landing (shows a check).
  // Others show a "Soon" pill and can't be selected yet.
  // cc = ISO country code for the flag icon (real flags, cross-platform).
  const LANGS = [
    { code: 'es',    name: 'Español',   cc: 'es', ready: true },
    { code: 'en',    name: 'English',   cc: 'gb', ready: true },
    { code: 'pt-BR', name: 'Português', cc: 'br', ready: true },
    { code: 'fr',    name: 'Français',  cc: 'fr', ready: true },
    { code: 'de',    name: 'Deutsch',   cc: 'de', ready: true },
    { code: 'it',    name: 'Italiano',  cc: 'it', ready: true },
    { code: 'tr',    name: 'Türkçe',    cc: 'tr', ready: true },
    { code: 'id',    name: 'Indonesia', cc: 'id', ready: true },
    { code: 'hi',    name: 'हिन्दी',      cc: 'in', ready: true },
    { code: 'ru',    name: 'Русский',   cc: 'ru', ready: true },
    { code: 'ar',    name: 'العربية',    cc: 'sa', ready: true },
    { code: 'ja',    name: '日本語',      cc: 'jp', ready: true },
  ];
  const READY = new Set(LANGS.filter((l) => l.ready).map((l) => l.code));
  const RTL = ['ar'];
  const cache = {};
  let snapshot = null;
  let currentDict = null; // the active locale's loaded JSON (null for English)

  function snap() {
    snapshot = { text: {}, html: {}, attr: {} };
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      if (!(k in snapshot.text)) snapshot.text[k] = el.textContent;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const k = el.getAttribute('data-i18n-html');
      if (!(k in snapshot.html)) snapshot.html[k] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      const attr = spec.split('|')[0];
      snapshot.attr[spec] = el.getAttribute(attr);
    });
  }

  function applyDict(dict) {
    const pick = (bag, k) => (dict && dict[k] != null ? dict[k] : bag[k]);
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = pick(snapshot.text, el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = pick(snapshot.html, el.getAttribute('data-i18n-html'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const spec = el.getAttribute('data-i18n-attr');
      const parts = spec.split('|'); // "attr|key"
      const v = dict && dict[parts[1]] != null ? dict[parts[1]] : snapshot.attr[spec];
      if (v != null) el.setAttribute(parts[0], v);
    });
  }

  async function load(code) {
    if (code === 'en') return null;
    if (cache[code]) return cache[code];
    try {
      const r = await fetch('locales/' + code + '.json?v=66');
      if (!r.ok) throw new Error('404');
      cache[code] = await r.json();
      return cache[code];
    } catch (e) {
      return null; // fall back to the inline English
    }
  }

  async function set(code) {
    const dict = await load(code);
    currentDict = dict;
    applyDict(dict);
    document.documentElement.lang = code;
    document.documentElement.dir = RTL.indexOf(code) !== -1 ? 'rtl' : 'ltr';
    try { localStorage.setItem('ghosted_lang', code); } catch (e) {}
    // Aviso para quien tenga que rehacer un texto que no sale tal cual del
    // diccionario (por ejemplo el precio futuro, que lleva la fecha dentro).
    try { document.dispatchEvent(new CustomEvent('ghosted:lang', { detail: code })); } catch (e) {}
    const lang = LANGS.find((l) => l.code === code);
    const flagEl = document.getElementById('langFlag');
    const nameEl = document.getElementById('langName');
    if (lang && flagEl) { flagEl.textContent = ''; flagEl.className = 'lang-flag fi fi-' + lang.cc + ' fis'; }
    if (lang && nameEl) nameEl.textContent = lang.name;
    document.querySelectorAll('.lang-item').forEach((el) => {
      const active = el.getAttribute('data-code') === code;
      el.classList.toggle('active', active);
      el.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function pick() {
    let saved; try { saved = localStorage.getItem('ghosted_lang'); } catch (e) {}
    const codes = LANGS.map((l) => l.code);
    if (saved && READY.has(saved)) return saved;
    const nav = navigator.languages || [navigator.language || 'en'];
    for (const raw of nav) {
      if (!raw) continue;
      const low = raw.toLowerCase();
      const two = low.split('-')[0];
      const hit = codes.find((c) => c.toLowerCase() === low) || codes.find((c) => c.toLowerCase() === two);
      if (hit && READY.has(hit)) return hit; // only auto-pick a fully-translated language
    }
    return 'en';
  }

  function initSwitcher() {
    const wrap = document.getElementById('langWrap');
    const btn = document.getElementById('langBtn');
    const menu = document.getElementById('langMenu');
    if (!wrap || !btn || !menu) return;

    menu.innerHTML = LANGS.map((l) => {
      const rd = READY.has(l.code);
      return '<button type="button" class="lang-item' + (rd ? '' : ' soon') + '" role="option" data-code="' + l.code + '"' + (rd ? '' : ' disabled') + ' aria-selected="false">' +
        '<span class="lang-item-flag fi fi-' + l.cc + ' fis"></span><span class="lang-item-name">' + l.name + '</span>' +
        (rd
          ? '<svg class="lang-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<span class="lang-soon">Soon</span>') +
      '</button>';
    }).join('');

    function openMenu() { wrap.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

    btn.addEventListener('click', (e) => { e.stopPropagation(); wrap.classList.contains('open') ? closeMenu() : openMenu(); });
    menu.querySelectorAll('.lang-item').forEach((item) => {
      if (item.disabled) return; // "Soon" languages aren't selectable yet
      item.addEventListener('click', () => { set(item.getAttribute('data-code')); closeMenu(); });
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  function init() {
    snap();
    initSwitcher();
    set(pick());
  }

  // For JS-driven text that isn't a static data-i18n DOM node (e.g. a button
  // label set at click-time, an alert message) — looks up the active locale's
  // dict, falling back to the given English default if missing/untranslated.
  function t(key, fallback) {
    if (currentDict && currentDict[key] != null) return currentDict[key];
    return fallback != null ? fallback : key;
  }

  return { init, set, LANGS, t };
})();

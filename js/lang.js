/* ==========================================================================
   SMPA — English / Sindhi / Urdu language switch
   --------------------------------------------------------------------------
   English is the markup's own text, so the page reads correctly with
   JavaScript disabled; the other languages live in data-<code> attributes and
   the English original is cached into data-en the first time a swap runs.

   Loaded blocking in <head> on purpose: the direction, the lang attribute and
   the Bootstrap LTR/RTL sheet are applied before first paint, so a returning
   Sindhi or Urdu visitor never sees a left-to-right flash.
   ========================================================================== */
(function () {
  'use strict';

  var KEY   = 'smpa-lang';
  var LANGS = { en: 'ltr', sd: 'rtl', ur: 'rtl' };
  var ATTRS = ['placeholder', 'aria-label', 'alt', 'title'];
  var root  = document.documentElement;

  function valid(lang) {
    return Object.prototype.hasOwnProperty.call(LANGS, lang) ? lang : 'en';
  }
  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(lang) {
    try { window.localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
  }

  /* Direction + the matching Bootstrap stylesheet. Bootstrap's default build
     is LTR-compiled, so dir="rtl" alone would not mirror the grid — the RTL
     sheet has to be swapped in alongside it. */
  function applyChrome(lang) {
    var rtl = LANGS[lang] === 'rtl';
    root.lang = lang;
    root.dir  = LANGS[lang];

    var ltrSheet = document.getElementById('bs-ltr');
    var rtlSheet = document.getElementById('bs-rtl');
    if (ltrSheet) { ltrSheet.disabled = rtl; }
    if (rtlSheet) { rtlSheet.disabled = !rtl; }
  }

  /* Reads data-<lang>, falling back to the cached English if a string has no
     translation in the target language. */
  function pick(el, lang, suffix) {
    var attr = 'data-' + lang + (suffix ? '-' + suffix : '');
    var fallback = 'data-en' + (suffix ? '-' + suffix : '');
    return el.hasAttribute(attr) ? el.getAttribute(attr) : el.getAttribute(fallback);
  }

  function applyText(lang) {
    var nodes, i, el;

    nodes = document.querySelectorAll('[data-sd], [data-ur]');
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (!el.hasAttribute('data-en')) { el.setAttribute('data-en', el.textContent); }
      el.textContent = pick(el, lang, null);
    }

    /* Attribute-borne strings: placeholder, and the accessibility text that is
       never visible but is read aloud — it has to switch language too. */
    ATTRS.forEach(function (attr) {
      var sel = document.querySelectorAll('[data-sd-' + attr + '], [data-ur-' + attr + ']');
      for (var k = 0; k < sel.length; k++) {
        var node = sel[k];
        if (!node.hasAttribute('data-en-' + attr)) {
          node.setAttribute('data-en-' + attr, node.getAttribute(attr) || '');
        }
        node.setAttribute(attr, pick(node, lang, attr));
      }
    });

    nodes = document.querySelectorAll('.lang__btn');
    for (i = 0; i < nodes.length; i++) {
      var on = nodes[i].getAttribute('data-lang') === lang;
      nodes[i].classList.toggle('is-on', on);
      nodes[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function setLang(lang, persist) {
    lang = valid(lang);
    applyChrome(lang);
    applyText(lang);
    if (persist) { remember(lang); }
    /* Lets js/site.js re-render the strings it builds itself (search
       results). */
    try { document.dispatchEvent(new CustomEvent('smpa:lang', { detail: lang })); } catch (e) { /* old browser */ }
  }

  var initial = valid(stored());

  applyChrome(initial);           /* before paint */

  /* Also before paint: flag that scripts run (so reveal-on-scroll may hide
     content until it animates in) and restore the visitor's accessibility
     choices (text size, contrast, theme) set from the header panel by
     js/site.js. Without JavaScript none of this applies and nothing hides. */
  root.classList.add('js');

  /* Page loader (the district map of Sindh drawing itself) on every page
     load, except for visitors who prefer reduced motion. js/site.js lifts it
     once the page has loaded. */
  try {
    if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      root.classList.add('is-loading');
    }
  } catch (e) { /* no loader */ }
  try {
    var prefs = JSON.parse(window.localStorage.getItem('smpa-a11y') || '{}');
    if (prefs.fs) { root.setAttribute('data-fs', String(prefs.fs)); }
    if (prefs.contrast) { root.setAttribute('data-contrast', 'high'); }
    if (prefs.theme === 'dark') { root.setAttribute('data-theme', 'dark'); }
  } catch (e) { /* storage blocked: defaults */ }

  document.addEventListener('DOMContentLoaded', function () {
    applyText(initial);           /* once the DOM exists */

    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.lang__btn') : null;
      if (!btn) { return; }
      e.preventDefault();
      setLang(btn.getAttribute('data-lang'), true);
    });
  });
})();

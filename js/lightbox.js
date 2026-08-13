/* ==========================================================================
   SMPA — article image lightbox
   --------------------------------------------------------------------------
   Every full-size image link inside an article (the land use maps and the
   photo gallery) opens in an overlay instead of a new tab. The links keep
   their href and target, so with JavaScript off — or if this file fails to
   load — clicking still opens the file directly. Nothing here runs until a
   link is actually clicked.

   Markup it binds to:
     <a href="images/…webp"><img alt="…"></a>   inside .post
   Caption comes from the enclosing <figure>'s <figcaption> when there is one,
   otherwise from the image's alt text — which is already translated, so the
   overlay follows the page language for free.
   ========================================================================== */
(function () {
  'use strict';

  var IMG = /\.(webp|jpe?g|png|gif|avif)(\?|#|$)/i;

  var items = [];      /* [{ href, cap }] in document order */
  var index = 0;
  var opener = null;   /* the link that opened the overlay, for focus return */
  var box = null;      /* the overlay, built once on first open */
  var els = {};

  function reduced() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function rtl() {
    return getComputedStyle(document.documentElement).direction === 'rtl';
  }

  /* Sindhi and Urdu labels live here rather than in the markup, because the
     overlay is built by script and never passes through lang.js. */
  var LABEL = {
    close: { en: 'Close', sd: 'بند ڪريو', ur: 'بند کریں' },
    prev:  { en: 'Previous image', sd: 'پوئين تصوير', ur: 'پچھلی تصویر' },
    next:  { en: 'Next image', sd: 'اڳيون تصوير', ur: 'اگلی تصویر' },
    /* The overlay fits the image to the screen; the maps and the gazette scan
       carry detail that only reads at full resolution. */
    full:  { en: 'Open full size', sd: 'پوري سائيز ۾ کوليو', ur: 'مکمل سائز میں کھولیں' }
  };
  function label(key) {
    var lang = document.documentElement.lang;
    return LABEL[key][lang] || LABEL[key].en;
  }

  function caption(a) {
    var fig = a.closest ? a.closest('figure') : null;
    var cap = fig ? fig.querySelector('figcaption') : null;
    if (cap && cap.textContent.trim()) { return cap.textContent.trim(); }
    var img = a.querySelector('img');
    return img ? (img.getAttribute('alt') || '') : '';
  }

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.hidden = true;
    box.innerHTML =
      '<button class="lightbox__close" type="button"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
      '<button class="lightbox__nav lightbox__nav--next" type="button"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
      '<figure class="lightbox__stage">' +
      '  <img alt="">' +
      '  <figcaption>' +
      '    <span class="lightbox__count"></span>' +
      '    <span class="lightbox__cap"></span>' +
      '    <a class="lightbox__full" target="_blank" rel="noopener"><i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i><span></span></a>' +
      '  </figcaption>' +
      '</figure>';

    els.close = box.querySelector('.lightbox__close');
    els.prev  = box.querySelector('.lightbox__nav--prev');
    els.next  = box.querySelector('.lightbox__nav--next');
    els.stage = box.querySelector('.lightbox__stage');
    els.img   = box.querySelector('.lightbox__stage img');
    els.count = box.querySelector('.lightbox__count');
    els.cap   = box.querySelector('.lightbox__cap');
    els.full  = box.querySelector('.lightbox__full');

    els.close.addEventListener('click', close);
    /* The buttons mean "the previous/next photo", never a screen direction —
       CSS already mirrors where they sit, so the index must not flip too. */
    els.prev.addEventListener('click', function () { show(index - 1); });
    els.next.addEventListener('click', function () { show(index + 1); });
    /* Clicking the backdrop closes; clicking the photo or a control does not */
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === els.stage) { close(); }
    });

    document.body.appendChild(box);
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var it = items[index];
    els.img.src = it.href;
    els.img.alt = it.cap;
    els.cap.textContent = it.cap;
    els.count.textContent = (index + 1) + ' / ' + items.length;
    els.full.href = it.href;
    els.full.querySelector('span').textContent = label('full');
    els.count.hidden = items.length < 2;
    var solo = items.length < 2;
    els.prev.hidden = solo;
    els.next.hidden = solo;

    /* Warm the neighbours so stepping through feels instant */
    [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]]
      .forEach(function (n) { if (n) { new Image().src = n.href; } });
  }

  /* Arrow keys are the one place direction matters: pressing right moves the
     way the eye travels, which is backwards through a Sindhi or Urdu page. */
  function arrow(screenDir) {
    show(index + (rtl() ? -screenDir : screenDir));
  }

  function open(list, i, from) {
    items = list;
    opener = from;
    if (!box) { build(); }
    box.hidden = false;
    /* labels are re-read on every open: the visitor may have switched language */
    els.close.setAttribute('aria-label', label('close'));
    els.prev.setAttribute('aria-label', label('prev'));
    els.next.setAttribute('aria-label', label('next'));
    box.classList.toggle('lightbox--instant', reduced());
    document.documentElement.classList.add('has-lightbox');
    show(i);
    els.close.focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    if (!box || box.hidden) { return; }
    box.hidden = true;
    els.img.removeAttribute('src');
    document.documentElement.classList.remove('has-lightbox');
    document.removeEventListener('keydown', onKey);
    if (opener && opener.focus) { opener.focus(); }
    opener = null;
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowRight') { arrow(1); }
    else if (e.key === 'ArrowLeft') { arrow(-1); }
    else if (e.key === 'Tab') {
      /* Keep the tab ring inside the overlay while it is open */
      var focusable = [els.close, els.prev, els.next, els.full].filter(function (b) { return !b.hidden; });
      var at = focusable.indexOf(document.activeElement);
      var nextAt = (at + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      focusable[nextAt].focus();
      e.preventDefault();
    }
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.post a[href]') : null;
    if (!a || !IMG.test(a.getAttribute('href') || '')) { return; }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) { return; }

    var post = a.closest('.post');
    var links = [].filter.call(post.querySelectorAll('a[href]'), function (n) {
      return IMG.test(n.getAttribute('href') || '');
    });
    e.preventDefault();
    open(links.map(function (n) { return { href: n.getAttribute('href'), cap: caption(n) }; }),
         links.indexOf(a), a);
  });
})();

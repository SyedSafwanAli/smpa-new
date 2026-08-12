/* ==========================================================================
   SMPA — continuous card slider
   --------------------------------------------------------------------------
   Bootstrap's carousel pages a whole slide at a time, so a 6-card set shown
   4-up jumps to a half-empty second slide. This moves ONE card per click and
   loops seamlessly: the track is translated by one step, and on transition
   end the leading card is moved to the other end while the transform is reset
   with transitions off — so the shift is invisible and the loop never ends.

   Markup:
     <div class="slider" data-slider>
       <div class="slider__viewport">
         <ul class="slider__track"> <li class="slider__item">…</li> … </ul>
       </div>
       <button data-slider-prev> <button data-slider-next>
   ========================================================================== */
(function () {
  'use strict';

  var GAP = 24;   /* keep in sync with --slider-gap in the stylesheet */

  function perView() {
    var w = window.innerWidth;
    if (w >= 992) { return 4; }
    if (w >= 768) { return 2; }
    return 1;
  }

  function reduced() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function init(root) {
    var track = root.querySelector('.slider__track');
    var prev  = root.querySelector('[data-slider-prev]');
    var next  = root.querySelector('[data-slider-next]');
    if (!track || !track.children.length) { return; }

    var busy = false;

    /* Arrows are pointless when everything already fits. */
    function sync() {
      var enough = track.children.length > perView();
      [prev, next].forEach(function (b) {
        if (!b) { return; }
        b.hidden = !enough;
        b.disabled = !enough;
      });
    }

    function step() {
      var first = track.children[0];
      return first ? first.getBoundingClientRect().width + GAP : 0;
    }

    function move(dir) {
      if (busy || track.children.length <= perView()) { return; }
      busy = true;

      /* In RTL the track runs the other way, so the sign flips. */
      var rtl  = getComputedStyle(document.documentElement).direction === 'rtl';
      var sign = rtl ? 1 : -1;
      var dist = step() * dir * sign;

      function settle() {
        track.style.transition = 'none';
        track.style.transform  = 'none';
        if (dir > 0) {
          track.appendChild(track.firstElementChild);
        } else {
          track.insertBefore(track.lastElementChild, track.firstElementChild);
        }
        /* force reflow so the next transition starts from the reset position */
        void track.offsetWidth;
        busy = false;
      }

      if (reduced()) { settle(); return; }

      track.style.transition = 'transform 0.45s ease';
      track.style.transform  = 'translateX(' + dist + 'px)';
      track.addEventListener('transitionend', function handler() {
        track.removeEventListener('transitionend', handler);
        settle();
      });
    }

    if (prev) { prev.addEventListener('click', function () { move(-1); }); }
    if (next) { next.addEventListener('click', function () { move(1); }); }

    /* Touch: the arrows are the only way through on a phone otherwise, and a
       card rail that does not swipe reads as broken. Horizontal intent only —
       anything steeper than 45 degrees is the page being scrolled. */
    var sx = 0, sy = 0, tracking = false;
    root.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!tracking) { return; }
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx;
      var dy = t.clientY - sy;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) { return; }
      /* Swiping left pulls the next card in; RTL runs the other way. */
      var rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      var forward = rtl ? dx > 0 : dx < 0;
      move(forward ? 1 : -1);
    }, { passive: true });

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(sync, 150);
    });
    sync();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var all = document.querySelectorAll('[data-slider]');
    for (var i = 0; i < all.length; i++) { init(all[i]); }
  });
})();

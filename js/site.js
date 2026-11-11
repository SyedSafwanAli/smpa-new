/* ==========================================================================
   SMPA — site behaviour (js/site.js)
   --------------------------------------------------------------------------
   Plain ES2017, no dependencies, loaded with `defer` on every page.
   Each feature looks for its own markup and quietly does nothing when the
   page has none, so one file serves the homepage and the inner pages.

     header     shrink + blur on scroll
     mega       desktop mega-menu (hover, click, keyboard)
     mnav       full-screen mobile menu
     a11y       text size · high contrast · dark mode (persisted)
     cmdk       command-palette search (Ctrl/⌘+K, "/")
     reveal     fade-up on scroll, staggered
     timeline   horizontal master-plans timeline
     filter     tabbed card filter
     loader     page loader (district map of Sindh)
     hero       homepage carousel
     ticker     Latest News, one headline at a time
     lazy       mobile CTA visibility

   Text that lang.js manages lives in data-sd / data-ur attributes. Strings
   this file builds itself (search results) are kept here in
   three languages and re-rendered on the `smpa:lang` event.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var hdr = document.querySelector('[data-hdr]');
  var BASE = hdr ? hdr.getAttribute('data-base') || '' : '';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Scrollbar width, for layouts that bleed to the viewport edge (100vw
     includes the scrollbar; the page content does not). */
  function measureScrollbar() { root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px'); }
  measureScrollbar();
  window.addEventListener('resize', measureScrollbar);

  function lang() { var l = root.lang; return l === 'sd' || l === 'ur' ? l : 'en'; }
  function isRTL() { return root.dir === 'rtl'; }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function t(obj) { return obj[lang()] || obj.en; }

  /* ------------------------------------------------------------------ */
  /* Header: shrink + glass once the page has scrolled                   */
  /* ------------------------------------------------------------------ */
  if (hdr) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        hdr.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------ */
  /* Mega-menu                                                           */
  /* ------------------------------------------------------------------ */
  var items = $all('.nav__item[data-nav-group]');
  var openItem = null;
  var hoverTimer = null;

  function setOpen(item, open, focusFirst) {
    if (!item) { return; }
    var trigger = item.querySelector('.nav__trigger');
    if (open && openItem && openItem !== item) { setOpen(openItem, false); }
    item.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    openItem = open ? item : (openItem === item ? null : openItem);
    if (open && focusFirst) {
      var first = item.querySelector('.mega a');
      if (first) { first.focus(); }
    }
  }

  items.forEach(function (item) {
    var trigger = item.querySelector('.nav__trigger');
    var links = $all('.mega a', item);

    trigger.addEventListener('click', function () {
      setOpen(item, !item.classList.contains('is-open'));
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(item, true, true); }
    });

    if (finePointer) {
      item.addEventListener('mouseenter', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setOpen(item, true); }, openItem ? 0 : 90);
      });
      item.addEventListener('mouseleave', function () {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setOpen(item, false); }, 160);
      });
    }

    // Arrow keys move through the panel's links; Escape returns to the trigger.
    item.addEventListener('keydown', function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === 'Escape' && item.classList.contains('is-open')) {
        setOpen(item, false); trigger.focus();
      } else if (i > -1 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        var next = links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length];
        next.focus();
      }
    });
    // Tabbing out of the item closes it.
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) { setOpen(item, false); }
    });
  });

  document.addEventListener('click', function (e) {
    if (openItem && !openItem.contains(e.target)) { setOpen(openItem, false); }
  });

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                         */
  /* ------------------------------------------------------------------ */
  var mnav = document.querySelector('[data-mnav]');
  var mnavToggle = document.querySelector('[data-mnav-toggle]');
  var mcta = document.querySelector('.mcta');

  function setMnav(open) {
    if (!mnav) { return; }
    mnav.hidden = !open;
    document.body.classList.toggle('mnav-open', open);
    if (mnavToggle) { mnavToggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    if (open) {
      var closeBtn = mnav.querySelector('[data-mnav-close]');
      if (closeBtn) { closeBtn.focus(); }
    } else if (mnavToggle) {
      mnavToggle.focus();
    }
  }
  if (mnav && mnavToggle) {
    mnavToggle.addEventListener('click', function () { setMnav(true); });
    mnav.querySelector('[data-mnav-close]').addEventListener('click', function () { setMnav(false); });
    mnav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMnav(false); return; }
      // Keep Tab inside the open menu.
      if (e.key === 'Tab') {
        var f = $all('a, button, summary, [tabindex="0"]', mnav).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) { return; }
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1280px)').addEventListener('change', function (m) { if (m.matches && !mnav.hidden) { setMnav(false); } });
  }

  /* ------------------------------------------------------------------ */
  /* Language menu (the switching itself is js/lang.js)                  */
  /* ------------------------------------------------------------------ */
  var LANG_LABEL = { en: 'EN', ur: 'اردو', sd: 'سنڌي' };
  $all('.langdd').forEach(function (dd) {
    var btn = dd.querySelector('[data-langdd]');
    var menu = dd.querySelector('.langdd__menu');
    var cur = dd.querySelector('[data-langdd-cur]');
    function label() { var l = lang(); cur.textContent = LANG_LABEL[l]; cur.setAttribute('lang', l); }
    function set(open) { menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function () {
      set(menu.hidden);
      if (!menu.hidden) { (menu.querySelector('.is-on') || menu.querySelector('button')).focus(); }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('.lang__btn')) { set(false); btn.focus(); } });
    dd.addEventListener('keydown', function (e) {
      var opts = $all('button', menu), i = opts.indexOf(document.activeElement);
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
      else if (i > -1 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus(); }
    });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) { set(false); } });
    document.addEventListener('click', function (e) { if (!menu.hidden && !dd.contains(e.target)) { set(false); } });
    document.addEventListener('smpa:lang', label);
    label();
  });

  /* ------------------------------------------------------------------ */
  /* Accessibility: text size, contrast, theme — persisted, and applied  */
  /* before paint by lang.js on the next page.                           */
  /* ------------------------------------------------------------------ */
  var A11Y_KEY = 'smpa-a11y';
  var prefs = (function () { try { return JSON.parse(localStorage.getItem(A11Y_KEY) || '{}'); } catch (e) { return {}; } })();
  function savePrefs() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(prefs)); } catch (e) { /* blocked */ } }

  function applyPrefs() {
    var fs = prefs.fs || 0;
    if (fs) { root.setAttribute('data-fs', String(fs)); } else { root.removeAttribute('data-fs'); }
    if (prefs.contrast) { root.setAttribute('data-contrast', 'high'); } else { root.removeAttribute('data-contrast'); }
    if (prefs.theme === 'dark') { root.setAttribute('data-theme', 'dark'); } else { root.removeAttribute('data-theme'); }
    $all('[data-fs]').forEach(function (b) { if (b.tagName === 'BUTTON') { b.setAttribute('aria-pressed', 'false'); } });
    var cur = document.querySelector('button[data-fs="' + (fs === 0 ? 0 : (fs < 0 ? -1 : 1)) + '"]');
    if (cur) { cur.setAttribute('aria-pressed', 'true'); }
    $all('[data-pref="contrast"]').forEach(function (b) { b.setAttribute('aria-checked', prefs.contrast ? 'true' : 'false'); });
    $all('[data-pref="theme"]').forEach(function (b) { b.setAttribute('aria-checked', prefs.theme === 'dark' ? 'true' : 'false'); });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', prefs.theme === 'dark' ? '#0A1411' : '#0A3D2E'); }
  }

  var a11yToggle = document.querySelector('[data-a11y-toggle]');
  var a11yPanel = document.getElementById('a11yPanel');
  if (a11yToggle && a11yPanel) {
    var setPanel = function (open) {
      a11yPanel.hidden = !open;
      a11yToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    a11yToggle.addEventListener('click', function () { setPanel(a11yPanel.hidden); });
    document.addEventListener('click', function (e) {
      if (!a11yPanel.hidden && !a11yPanel.parentNode.contains(e.target)) { setPanel(false); }
    });
    a11yPanel.parentNode.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !a11yPanel.hidden) { setPanel(false); a11yToggle.focus(); }
    });
    a11yPanel.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) { return; }
      if (b.hasAttribute('data-fs')) {
        var step = parseInt(b.getAttribute('data-fs'), 10);
        prefs.fs = step === 0 ? 0 : Math.max(-1, Math.min(2, (prefs.fs || 0) + step));
      } else if (b.getAttribute('data-pref') === 'contrast') {
        prefs.contrast = !prefs.contrast;
      } else if (b.getAttribute('data-pref') === 'theme') {
        prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark';
      }
      savePrefs(); applyPrefs();
    });
  }
  applyPrefs();

  /* ------------------------------------------------------------------ */
  /* Command palette                                                     */
  /* ------------------------------------------------------------------ */
  var GROUPS = {
    page: { en: 'Pages', sd: 'صفحا', ur: 'صفحات', icon: 'file-text' },
    service: { en: 'Services', sd: 'خدمتون', ur: 'خدمات', icon: 'receipt' },
    doc: { en: 'Notifications & documents', sd: 'نوٽيفڪيشن ۽ دستاويز', ur: 'نوٹیفکیشنز اور دستاویزات', icon: 'file-check' },
    news: { en: 'News', sd: 'خبرون', ur: 'خبریں', icon: 'newspaper' }
  };
  // [group, url, en, sd, ur, extra keywords]
  var INDEX = [
    ['page', 'index.html', 'Home', 'مُک صفحو', 'مرکزی صفحہ', 'start'],
    ['page', 'about.html', 'Who We Are', 'اسان ڪير آهيون', 'ہم کون ہیں', 'about us vision mission statement mandate'],
    ['page', 'history.html', 'History', 'تاريخ', 'تاریخ', '1968 kda sbca kmc mpgo timeline'],
    ['page', 'management-organogram.html', 'Management & Organogram', 'انتظاميه ۽ آرگنوگرام', 'انتظامیہ اور آرگنوگرام', 'leadership chart senior director minister directorates'],
    ['page', 'officers-directory.html', 'Officer’s Directory', 'آفيسرن جي ڊائريڪٽري', 'افسران کی ڈائریکٹری', 'officers staff contact'],
    ['page', 'offices.html', 'Offices', 'آفيسون', 'دفاتر', 'contact address phone head office hyderabad civic center'],
    ['page', 'master-plans.html', 'Master Plans', 'ماسٽر پلان', 'ماسٹر پلان', 'karachi 1952 1974 2000 2020 kdp ksdp strategic development plan'],
    ['page', 'master-plans.html#mapsHeading', 'Land Use Plan Maps', 'لينڊ يوز پلان نقشا', 'لینڈ یوز پلان نقشے', 'zoning land use map 1974 1980 1987 2000 2020'],
    ['page', 'projects-studies.html', 'Projects & Studies', 'منصوبا ۽ مطالعا', 'منصوبے اور مطالعے', 'zonal surveys contingency'],
    ['page', 'laws.html', 'Laws', 'قانون', 'قوانین', 'act ordinance regulations by-laws'],
    ['page', 'notifications.html', 'Notifications', 'نوٽيفڪيشن', 'نوٹیفکیشنز', 'orders gazette'],
    ['page', 'reports.html', 'Reports', 'رپورٽون', 'رپورٹس', 'studies publications'],
    ['page', 'news/index.html', 'Latest News', 'تازيون خبرون', 'تازہ خبریں', 'media events'],
    ['page', 'news/press-releases.html', 'Press Releases', 'پريس رليز', 'پریس ریلیز', 'media statements'],
    ['service', 'permits-procedures-fee.html', 'Permits, Procedures & Fee', 'اجازت ناما، طريقيڪار ۽ فيس', 'اجازت نامے، طریقہ کار اور فیس', 'noc subdivision height certificate change of land use cng petrol pump fee permit'],
    ['service', 'offices.html', 'Online Complaint', 'آن لائن شڪايت', 'آن لائن شکایت', 'complain query grievance'],
    ['service', 'offices.html', 'Land File Status', 'لينڊ فائل جي صورتحال', 'لینڈ فائل کی صورتحال', 'track application file'],
    ['service', 'permits-procedures-fee.html#procHeading', 'Downloads & Forms', 'ڊائون لوڊ ۽ فارم', 'ڈاؤن لوڈ اور فارم', 'application form checklist'],
    ['service', 'tenders.html', 'Tenders', 'ٽينڊر', 'ٹینڈر', 'procurement bids'],
    ['service', 'approved-schemes.html', 'Approved Schemes', 'منظور ٿيل اسڪيمون', 'منظور شدہ اسکیمیں', 'schemes approved layouts'],
    ['service', 'careers.html', 'Careers', 'روزگار', 'روزگار', 'jobs vacancies recruitment'],
    ['doc', 'notices/revised-fee-structure-2026.html', 'Revised fee structure of SMPA (13-08-2026)', 'ايس ايم پي اي جو نظرثاني ٿيل فيس اسٽرڪچر (13-08-2026)', 'ایس ایم پی اے کا نظرثانی شدہ فیس اسٹرکچر (13-08-2026)', 'SO(HTP-I)/SMPA/20-17/2026 fee noc permit karachi hyderabad'],
    ['doc', 'documents/notifications/2020-02-18-establishment-of-smpa.pdf', 'Establishment of a separate Sindh Master Plan Authority (18-02-2020, PDF)', 'الڳ سنڌ ماسٽر پلان اٿارٽي جو قيام (18-02-2020، پي ڊي ايف)', 'الگ سندھ ماسٹر پلان اتھارٹی کا قیام (18-02-2020، پی ڈی ایف)', 'SO(G)/HTP/SBCA/7-63/2018 notification pdf'],
    ['doc', 'documents/notifications/2013-11-06-mpd-under-sbca.pdf', 'Master Plan Department placed under DG, SBCA (06-11-2013, PDF)', 'ماسٽر پلان کاتو ڊي جي، ايس بي سي اي هيٺ (06-11-2013، پي ڊي ايف)', 'ماسٹر پلان ڈیپارٹمنٹ ڈی جی، ایس بی سی اے کے تحت (06-11-2013، پی ڈی ایف)', 'SO(L&C)HTP/SBCA/12-14/2013 notification pdf'],
    ['news', 'news/un-habitat-delegation-meets-secretary-lghtp.html', 'UN-Habitat delegation meets Secretary, LG&HTP Department', 'يو اين-هيبيٽيٽ وفد جي سيڪريٽري ايل جي ۽ ايڇ ٽي پي سان ملاقات', 'یو این-ہیبیٹیٹ وفد کی سیکرٹری ایل جی اینڈ ایچ ٹی پی سے ملاقات', '2026 september collaboration'],
    ['news', 'news/grand-ceremony-at-sindh-master-plan-authority-on-independence-day-cake-cutting-ceremony-held.html', 'Grand ceremony at SMPA on Independence Day', 'سنڌ ماسٽر پلان اٿارٽي ۾ يومِ آزادي جي شاندار تقريب', 'سندھ ماسٹر پلان اتھارٹی میں یومِ آزادی کی شاندار تقریب', '14 august 2026 cake'],
    ['news', 'news/gis-technology.html', 'Sindh Minister inaugurates advanced GIS technology at SMPA', 'سنڌ جي وزير جديد جي آءِ ايس ٽيڪنالاجي جو افتتاح ڪيو', 'سندھ کے وزیر نے جدید جی آئی ایس ٹیکنالوجی کا افتتاح کیا', 'gis nasir hussain shah july 2026 north nazimabad'],
    ['news', 'news/draft-act-meeting.html', 'Meeting on the Draft Act of SMPA', 'ايس ايم پي اي جي مسودو ايڪٽ تي اجلاس', 'ایس ایم پی اے کے مسودہ ایکٹ پر اجلاس', 'law draft act'],
    ['news', 'news/introductory-meeting-lghtp.html', 'Introductory meeting chaired by the Caretaker Minister LG&HTP', 'نگران وزير ايل جي ۽ ايڇ ٽي پي جي صدارت ۾ تعارفي اجلاس', 'نگراں وزیر ایل جی اینڈ ایچ ٹی پی کی صدارت میں تعارفی اجلاس', 'meeting'],
    ['news', 'news/abad-issues-meeting.html', 'Meeting chaired by the Minister LG&HTP to address issues of ABAD', 'آباد جي مسئلن جي حل لاءِ وزير جي صدارت ۾ اجلاس', 'آباد کے مسائل کے حل کے لیے وزیر کی صدارت میں اجلاس', 'abad builders developers'],
    ['news', 'news/establishment-of-smpa.html', 'Establishment of SMPA in pursuance of the Supreme Court’s order', 'سپريم ڪورٽ جي حڪم تحت ايس ايم پي اي جو قيام', 'سپریم کورٹ کے حکم کے تحت ایس ایم پی اے کا قیام', '2020 supreme court'],
    ['news', 'news/merger-town-planning-hyderabad.html', 'Town Planning Department, Hyderabad merged into SMPA', 'ٽائون پلاننگ کاتو حيدرآباد ايس ايم پي اي ۾ ضم', 'ٹاؤن پلاننگ ڈیپارٹمنٹ حیدرآباد ایس ایم پی اے میں ضم', '14-09-2020 merger hyderabad']
  ];
  var cmdk = document.getElementById('cmdk');
  var cmdkInput = cmdk && cmdk.querySelector('.cmdk__input');
  var cmdkList = cmdk && cmdk.querySelector('.cmdk__list');
  var cmdkEmpty = cmdk && cmdk.querySelector('.cmdk__empty');
  var cmdkSel = 0;
  var cmdkLastFocus = null;

  function norm(s) { return String(s).toLowerCase().normalize('NFKD').replace(/[ً-ٰٟ]/g, '').replace(/[’'`]/g, ''); }
  function svgIcon(name) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function resolve(url) { return url.charAt(0) === '#' ? url : BASE + url; }

  function renderCmdk() {
    if (!cmdk) { return; }
    var q = norm(cmdkInput.value.trim());
    var terms = q ? q.split(/\s+/) : [];
    var l = lang(), idx = { en: 2, sd: 3, ur: 4 }[l];
    var hits = INDEX.filter(function (r) {
      if (!terms.length) { return r[0] !== 'news' && r[0] !== 'doc' || r[1].indexOf('notices/') === 0; }
      var hay = norm(r[2] + ' ' + r[3] + ' ' + r[4] + ' ' + r[5] + ' ' + r[1]);
      return terms.every(function (term) { return hay.indexOf(term) > -1; });
    });
    if (!terms.length) { hits = hits.slice(0, 10); }
    var html = '', last = '', n = 0;
    hits.forEach(function (r) {
      if (r[0] !== last) { html += '<li class="cmdk__group" role="presentation">' + esc(t(GROUPS[r[0]])) + '</li>'; last = r[0]; }
      var ext = /\.pdf$/.test(r[1]);
      html += '<li role="presentation"><a class="cmdk__item" role="option" id="cmdk-o' + n + '" aria-selected="' + (n === 0) + '" href="' + esc(resolve(r[1])) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
        svgIcon(ext ? 'file-down' : GROUPS[r[0]].icon) + '<span class="cmdk__item-t">' + esc(r[idx] || r[2]) + '</span>' +
        '<span class="cmdk__item-go">' + svgIcon('corner-down-left') + '</span></a></li>';
      n++;
    });
    cmdkList.innerHTML = html;
    cmdkEmpty.hidden = n > 0;
    cmdkSel = 0;
    cmdkInput.setAttribute('aria-activedescendant', n ? 'cmdk-o0' : '');
  }
  function moveSel(d) {
    var opts = $all('.cmdk__item', cmdkList);
    if (!opts.length) { return; }
    opts[cmdkSel].setAttribute('aria-selected', 'false');
    cmdkSel = (cmdkSel + d + opts.length) % opts.length;
    opts[cmdkSel].setAttribute('aria-selected', 'true');
    opts[cmdkSel].scrollIntoView({ block: 'nearest' });
    cmdkInput.setAttribute('aria-activedescendant', opts[cmdkSel].id);
  }
  function openCmdk(q) {
    if (!cmdk || cmdk.open) { return; }
    cmdkLastFocus = document.activeElement;
    if (openItem) { setOpen(openItem, false); }
    if (mnav && !mnav.hidden) { mnav.hidden = true; document.body.classList.remove('mnav-open'); }
    cmdkInput.value = q || '';
    renderCmdk();
    if (cmdk.showModal) { cmdk.showModal(); } else { cmdk.setAttribute('open', ''); }
    cmdkInput.focus();
  }
  function closeCmdk() {
    if (!cmdk || !cmdk.open) { return; }
    if (cmdk.close) { cmdk.close(); } else { cmdk.removeAttribute('open'); }
  }
  if (cmdk) {
    cmdk.addEventListener('close', function () { if (cmdkLastFocus && cmdkLastFocus.focus) { cmdkLastFocus.focus(); } });
    cmdkInput.addEventListener('input', renderCmdk);
    cmdkInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var cur = $all('.cmdk__item', cmdkList)[cmdkSel];
        if (cur) { cur.click(); closeCmdk(); }
      }
    });
    cmdkList.addEventListener('mousemove', function (e) {
      var a = e.target.closest('.cmdk__item');
      if (!a) { return; }
      var opts = $all('.cmdk__item', cmdkList), i = opts.indexOf(a);
      if (i !== cmdkSel) { moveSel(i - cmdkSel); }
    });
    cmdkList.addEventListener('click', function (e) { if (e.target.closest('.cmdk__item')) { closeCmdk(); } });
    // A click on the backdrop lands on the <dialog> itself.
    cmdk.addEventListener('click', function (e) { if (e.target === cmdk) { closeCmdk(); } });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cmdk-open]');
      if (b) { e.preventDefault(); openCmdk(); }
    });
    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (cmdk.open) { closeCmdk(); } else { openCmdk(); } }
      else if (e.key === '/' && !typing && !cmdk.open) { e.preventDefault(); openCmdk(); }
    });
    // Show the right shortcut for the platform.
    if (!/Mac|iPhone|iPad/.test(navigator.platform || '')) { $all('.hdr__kbd').forEach(function (k) { k.textContent = 'Ctrl K'; }); }
    document.addEventListener('smpa:lang', function () { if (cmdk.open) { renderCmdk(); } });
  }
  $all('[data-hero-search]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!cmdk) { return; }
      e.preventDefault();
      openCmdk(form.querySelector('input').value);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll (staggered)                                        */
  /* ------------------------------------------------------------------ */
  $all('[data-stagger]').forEach(function (group) {
    $all('[data-reveal]', group).forEach(function (el, i) {
      if (!el.style.getPropertyValue('--d')) { el.style.setProperty('--d', (i * 70) + 'ms'); }
    });
  });
  var revealEls = $all('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------ */
  /* Timeline                                                            */
  /* ------------------------------------------------------------------ */
  $all('[data-timeline]').forEach(function (tl) {
    var track = tl.querySelector('[data-tl-track]');
    var prev = tl.querySelector('[data-tl-prev]');
    var next = tl.querySelector('[data-tl-next]');
    var fill = tl.querySelector('.tl__fill');
    if (!track) { return; }

    function max() { return track.scrollWidth - track.clientWidth; }
    function pos() { return Math.abs(track.scrollLeft); }   // RTL scrollLeft runs negative
    function update() {
      var m = max(), p = m > 0 ? pos() / m : 1;
      if (fill) { fill.style.setProperty('--p', Math.max(0.06, p).toFixed(3)); }
      if (prev) { prev.disabled = pos() < 4; }
      if (next) { next.disabled = pos() > m - 4; }
      // Nothing to scroll (all cards fit): hide the arrows altogether.
      tl.classList.toggle("tl--fits", m <= 4);
    }
    function by(dir) {
      var card = track.querySelector('.tl__node');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
      var step = card ? card.getBoundingClientRect().width + gap : 320;
      track.scrollBy({ left: dir * step * (isRTL() ? -1 : 1), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (prev) { prev.addEventListener('click', function () { by(-1); }); }
    if (next) { next.addEventListener('click', function () { by(1); }); }
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function (e) {
      if (e.target !== track) { return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); by(isRTL() ? -1 : 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); by(isRTL() ? 1 : -1); }
    });

    // Drag to scroll with a mouse (touch already scrolls natively).
    var down = false, moved = false, x0 = 0, s0 = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) { return; }
      down = true; moved = false; x0 = e.clientX; s0 = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) { return; }
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); }
      if (moved) { track.scrollLeft = s0 - dx; }
    });
    window.addEventListener('pointerup', function () {
      if (!down) { return; }
      down = false;
      if (moved) {
        track.classList.remove('is-drag');
        // Swallow the click that ends a drag so a card link doesn't fire.
        track.addEventListener('click', function swallow(ev) { ev.preventDefault(); ev.stopPropagation(); track.removeEventListener('click', swallow, true); }, true);
      }
    });
    update();
  });

  /* ------------------------------------------------------------------ */
  /* Tabbed filter                                                       */
  /* ------------------------------------------------------------------ */
  $all('[data-filter]').forEach(function (box) {
    var btns = $all('[data-filter-btn]', box);
    var cards = $all('[data-cat]', box);
    function select(btn, focus) {
      var cat = btn.getAttribute('data-filter-btn');
      btns.forEach(function (b) { var on = b === btn; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      cards.forEach(function (c) { c.hidden = !(cat === 'all' || c.getAttribute('data-cat') === cat); if (!c.hidden) { c.classList.add('is-in'); } });
      if (focus) { btn.focus(); }
    }
    btns.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { select(b); });
      b.addEventListener('keydown', function (e) {
        var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!d) { return; }
        if (isRTL()) { d = -d; }
        e.preventDefault();
        select(btns[(i + d + btns.length) % btns.length], true);
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Page loader: lift it once the page has loaded, but not before the   */
  /* district map has finished drawing.                                  */
  /* ------------------------------------------------------------------ */
  if (root.classList.contains('is-loading')) {
    var LOADER_MIN = 1900;   // ms from navigation start: the full draw
    var lift = function () {
      var wait = Math.max(0, LOADER_MIN - (window.performance ? performance.now() : LOADER_MIN));
      setTimeout(function () {
        root.classList.add('is-loaded');
        setTimeout(function () { root.classList.remove('is-loading', 'is-loaded'); }, 650);
      }, wait);
    };
    if (document.readyState === 'complete') { lift(); } else { window.addEventListener('load', lift); }
  }

  /* ------------------------------------------------------------------ */
  /* Hero carousel                                                       */
  /* Cross-fading photographs under fixed copy. Autoplays (6.5s) unless   */
  /* the visitor prefers reduced motion; holds while hovered or focused; */
  /* a pause button stops it for good (WCAG 2.2.2). Arrows, dots, swipe  */
  /* and the ← → keys (while focus is in the controls) all work.         */
  /* ------------------------------------------------------------------ */
  $all('[data-hero]').forEach(function (hero) {
    var slides = $all('[data-slide]', hero);
    var dots = $all('[data-hero-go]', hero);
    var pauseBtn = hero.querySelector('[data-hero-pause]');
    if (slides.length < 2) { return; }
    var DELAY = 6500, idx = 0, timer = null, stopped = reduceMotion, held = false;
    hero.style.setProperty('--hero-delay', DELAY + 'ms');

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle('is-on', on);
        if (on) { s.removeAttribute('aria-hidden'); } else { s.setAttribute('aria-hidden', 'true'); }
        // Restart the slow zoom each time a slide comes in.
        var img = s.querySelector('img');
        if (on && img) { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
        $all('a', s).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, i) {
        var on = i === idx;
        d.classList.toggle('is-on', on);
        if (on) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); }
      });
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      var playing = !stopped && !held;
      hero.classList.toggle('is-playing', !stopped);
      hero.classList.toggle('is-held', held);
      if (playing) { timer = setTimeout(function () { show(idx + 1); }, DELAY); }
    }
    // The first slide's image is eager; warm the rest so the first fade is clean.
    slides.forEach(function (s) { var img = s.querySelector('img[loading="lazy"]'); if (img) { img.loading = 'eager'; } });

    hero.querySelector('[data-hero-prev]').addEventListener('click', function () { show(idx - 1); });
    hero.querySelector('[data-hero-next]').addEventListener('click', function () { show(idx + 1); });
    dots.forEach(function (d) { d.addEventListener('click', function () { show(parseInt(d.getAttribute('data-hero-go'), 10)); }); });
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        stopped = !stopped;
        pauseBtn.setAttribute('aria-pressed', stopped ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', stopped ? 'Play slideshow' : 'Pause slideshow');
        schedule();
      });
      if (reduceMotion) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.setAttribute('aria-label', 'Play slideshow'); }
    }
    // Hold while the visitor is reading or using the controls.
    hero.addEventListener('mouseenter', function () { held = true; schedule(); });
    hero.addEventListener('mouseleave', function () { held = false; schedule(); });
    hero.addEventListener('focusin', function () { held = true; schedule(); });
    hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { held = false; schedule(); } });
    hero.querySelector('.hnav').addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) { return; }
      e.preventDefault(); show(idx + (isRTL() ? -d : d));
    });
    // Swipe
    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(idx + ((dx < 0) !== isRTL() ? 1 : -1)); }
    });
    // Don't animate while the hero is off-screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var away = !en[0].isIntersecting;
        if (away !== hero.classList.contains('is-away')) { hero.classList.toggle('is-away', away); held = away; schedule(); }
      }).observe(hero);
    }
    var bar = hero.querySelector(".hbar");
    var fitBar = function () { if (bar) { hero.style.setProperty("--hbar-h", bar.offsetHeight + "px"); } };
    fitBar(); window.addEventListener("resize", fitBar); document.addEventListener("smpa:lang", fitBar);
    show(0);
  });

  /* ------------------------------------------------------------------ */
  /* Latest News bar: one headline at a time                            */
  /* Rotates every 5s, holds while hovered or focused, never rotates    */
  /* under reduced motion. Off-screen headlines are hidden from screen  */
  /* readers and out of the tab order.                                  */
  /* ------------------------------------------------------------------ */
  $all('[data-ticker]').forEach(function (bar) {
    var items = $all('.hbar__item', bar);
    var num = bar.querySelector('[data-ticker-num]');
    if (items.length < 2) { return; }
    var i = 0, timer = null, held = false;
    function go(n) {
      var prev = items[i];
      i = (n + items.length) % items.length;
      items.forEach(function (it, k) {
        var on = k === i;
        it.classList.toggle('is-on', on);
        it.classList.toggle('is-out', it === prev && !on);
        if (on) { it.removeAttribute('aria-hidden'); } else { it.setAttribute('aria-hidden', 'true'); }
        var a = it.querySelector('a'); if (a) { a.tabIndex = on ? 0 : -1; }
      });
      // Reset the exiting headline once it has slid away, ready to come in from below again.
      setTimeout(function () { if (prev !== items[i]) { prev.classList.remove('is-out'); } }, 520);
      if (num) { num.textContent = String(i + 1); }
      tick();
    }
    function tick() {
      clearTimeout(timer);
      if (!reduceMotion && !held) { timer = setTimeout(function () { go(i + 1); }, 5000); }
    }
    bar.querySelector('[data-ticker-prev]').addEventListener('click', function () { go(i - 1); });
    bar.querySelector('[data-ticker-next]').addEventListener('click', function () { go(i + 1); });
    bar.addEventListener('mouseenter', function () { held = true; tick(); });
    bar.addEventListener('mouseleave', function () { held = false; tick(); });
    bar.addEventListener('focusin', function () { held = true; tick(); });
    bar.addEventListener('focusout', function (e) { if (!bar.contains(e.relatedTarget)) { held = false; tick(); } });
    tick();
  });

  /* ------------------------------------------------------------------ */
  /* Footer map (lazy) + mobile complaint button                         */
  /* ------------------------------------------------------------------ */
  var mapFrame = document.querySelector('.ftr__map iframe[data-src]');
  var ftrBottom = document.querySelector('.ftr__bottom');
  if ('IntersectionObserver' in window) {
    if (mapFrame) {
      var mo = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { mapFrame.src = mapFrame.getAttribute('data-src'); mapFrame.removeAttribute('data-src'); mo.disconnect(); }
      }, { rootMargin: '400px 0px' });
      mo.observe(mapFrame);
    }
    if (mcta) {
      // Hidden while the homepage hero (it carries its own news and
      // controls) or the footer is on screen, so it never covers either.
      var inView = [];
      var mo2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var i = inView.indexOf(en.target);
          if (en.isIntersecting && i < 0) { inView.push(en.target); }
          if (!en.isIntersecting && i > -1) { inView.splice(i, 1); }
        });
        mcta.classList.toggle('is-hidden', inView.length > 0);
      });
      [ftrBottom, document.querySelector('[data-hero]')].forEach(function (el) { if (el) { mo2.observe(el); } });
    }
  } else if (mapFrame) {
    mapFrame.src = mapFrame.getAttribute('data-src');
  }
})();

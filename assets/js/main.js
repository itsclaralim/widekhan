/* WIDEKHAN — site behaviour: mobile nav, scroll reveal, form mailto handoff */
(function () {
  'use strict';

  /* ---- Mobile navigation ---- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close when a link is tapped
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    // close on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---- Scroll reveal ---- */
  var targets = document.querySelectorAll('.rv');
  if (targets.length) {
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

      targets.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 4, 3) * 80 + 'ms';
        io.observe(el);
      });
    }
  }

  /* ---- Inquiry form -> mailto handoff ----
     Static hosting (GitHub Pages) has no server, so the form composes a
     structured email in the visitor's mail client. Swap the handler for a
     Formspree/Basin endpoint later if you want inbox delivery without that step. */
  var form = document.getElementById('inquiry-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var get = function (k) { return (d.get(k) || '').toString().trim(); };

      var subject = '[Website Inquiry] ' + (get('division') || 'General') + ' — ' + (get('company') || get('name'));
      var body = [
        'Name:      ' + get('name'),
        'Company:   ' + get('company'),
        'Country:   ' + get('country'),
        'Email:     ' + get('email'),
        'Phone:     ' + get('phone'),
        'Division:  ' + get('division'),
        'Product:   ' + get('product'),
        'Volume:    ' + get('volume'),
        'Incoterms: ' + get('incoterms'),
        '',
        'Message:',
        get('message'),
        '',
        '--',
        'Sent from widekhan.com'
      ].join('\n');

      window.location.href = 'mailto:info@widekhan.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---- Footer year ---- */
  var yr = document.querySelectorAll('[data-year]');
  yr.forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* ---- Header scrolled state ---- */
(function () {
  var hdr = document.querySelector('.hdr');
  if (!hdr) return;
  var onScroll = function () {
    hdr.classList.toggle('hdr--scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---- Video: load and play only when it earns its bandwidth ----
   Skipped entirely on reduced-motion, Save-Data, slow connections and
   narrow screens — those visitors keep the poster still. */
(function () {
  var vids = document.querySelectorAll('video[data-autovideo]');
  if (!vids.length || !('IntersectionObserver' in window)) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var slow = conn.saveData === true || /2g|3g/.test(conn.effectiveType || '');
  if (reduce || slow || window.innerWidth < 768) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting) {
        if (v.getAttribute('preload') === 'none') {
          v.setAttribute('preload', 'auto');
          v.load();
        }
        var played = v.play();
        if (played && played.catch) played.catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.15 });

  vids.forEach(function (v) {
    v.addEventListener('playing', function () { v.classList.add('is-live'); }, { once: true });
    io.observe(v);
  });
})();

/* ---- Fact band: numerals count up once, on entry ----
   Leading zeros and the sup suffix are preserved, so "02" stays "02" and
   "18+" keeps its plus while the digits climb. */
(function () {
  var nums = document.querySelectorAll('.fact__n');
  if (!nums.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var pad = function (v, width) {
    var s = String(v);
    while (s.length < width) { s = '0' + s; }
    return s;
  };

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);

      var sup = el.querySelector('sup');
      var suffix = sup ? sup.outerHTML : '';
      var digits = (el.textContent || '').replace(/[^0-9]/g, '');
      var target = parseInt(digits, 10);
      if (isNaN(target)) return;

      var width = digits.length;
      var start = null;
      var DUR = 1150;

      var frame = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DUR, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.innerHTML = pad(Math.round(target * eased), width) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }, { threshold: 0.55 });

  nums.forEach(function (n) { io.observe(n); });
})();

/* ---- Entrance safety net ----
   Hero animations finish by ~1.65s. At 2.6s we stamp the final state
   regardless, so a paused/throttled animation can never leave the
   above-the-fold headline invisible. */
setTimeout(function () {
  document.documentElement.classList.add('motion-settled');
}, 2600);

/* ==========================================================================
   v7 — Elaboration layer. Every element below is constructed at runtime, so
   no page markup changes and nothing to break when JS is unavailable.
   ========================================================================== */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('motion')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Scroll progress ---- */
  var bar = null;
  if (!reduce) {
    var wrapEl = document.createElement('div');
    wrapEl.className = 'progress';
    wrapEl.setAttribute('aria-hidden', 'true');
    bar = document.createElement('span');
    bar.className = 'progress__bar';
    wrapEl.appendChild(bar);
    document.body.appendChild(wrapEl);
  }

  /* ---- In-page section nav, built from the section headings ---- */
  var main = document.querySelector('main');
  var targets = [];
  var isHome = !!document.querySelector('.hero--home');
  if (main && !isHome) {
    var sections = [].slice.call(main.querySelectorAll(':scope > section'));
    sections.forEach(function (sec, i) {
      var head = sec.querySelector('.head');
      if (!head || !head.querySelector('h2')) return;
      if (!sec.id) sec.id = 'sec-' + (i + 1);
      // The eyebrow is already written as a short section label; the h2 is a
      // full sentence and truncates badly, so it is only the fallback.
      var brow = head.querySelector('.eyebrow');
      var label = ((brow ? brow.textContent : head.querySelector('h2').textContent) || '')
        .trim().replace(/[.。]\s*$/, '');
      if (label.length > 22) label = label.slice(0, 20).trim() + '…';
      targets.push({ el: sec, label: label });
    });
  }

  var links = [];
  if (targets.length >= 3) {
    var nav = document.createElement('nav');
    nav.className = 'secnav';
    nav.setAttribute('aria-label', document.documentElement.lang === 'ko' ? '페이지 내 이동' : 'On this page');
    var inner = document.createElement('div');
    inner.className = 'wrap secnav__in';
    targets.forEach(function (t) {
      var a = document.createElement('a');
      a.href = '#' + t.el.id;
      a.textContent = t.label;
      inner.appendChild(a);
      links.push(a);
    });
    nav.appendChild(inner);
    var hero = main.querySelector('.hero');
    if (hero && hero.nextSibling) main.insertBefore(nav, hero.nextSibling);
    else main.insertBefore(nav, main.firstChild);
  }

  /* ---- One rAF-throttled scroll pass drives progress, spy and parallax ---- */
  var heroMedia = document.querySelector('.hero--home .hero__video');
  var ticking = false;

  var onScroll = function () {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop;

    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    if (links.length) {
      var line = y + window.innerHeight * 0.28;
      var active = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.offsetTop <= line) active = i;
      }
      for (var j = 0; j < links.length; j++) {
        links[j].classList.toggle('is-current', j === active);
      }
    }

    if (heroMedia && !reduce && y < window.innerHeight * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0) scale(1.06)';
    }
    ticking = false;
  };

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---- Page transition on same-origin navigation ---- */
  if (!reduce) {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (a.origin !== window.location.origin) return;
      if (a.pathname === window.location.pathname && a.search === window.location.search) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(function () { window.location.href = a.href; }, 260);
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) document.body.classList.remove('is-leaving');
    });
  }
})();

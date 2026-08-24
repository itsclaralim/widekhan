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

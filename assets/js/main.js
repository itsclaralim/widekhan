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

  /* ---- Scroll reveal ----
     threshold is 0, not a fraction. A zero-area target - an image card
     whose lazy image has not resolved yet - reports ratio 0 forever and can
     never cross a fractional threshold, so it would stay clipped and
     transparent permanently. A geometric sweep backs the observer up so no
     element can be trapped whatever the observer reports. */
  var targets = [].slice.call(document.querySelectorAll('.rv'));
  if (targets.length) {
    var reveal = function (el) {
      if (!el.classList.contains('in')) el.classList.add('in');
    };
    targets.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 80 + 'ms';
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach(reveal);
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(function (el) { io.observe(el); });

      var sweep = function () {
        var h = window.innerHeight || 0;
        for (var i = 0; i < targets.length; i++) {
          var el = targets[i];
          if (el.classList.contains('in')) continue;
          if (el.getBoundingClientRect().top < h * 0.94) {
            reveal(el);
            io.unobserve(el);
          }
        }
      };
      var queued = false;
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sweep(); });
      }, { passive: true });
      window.addEventListener('resize', sweep, { passive: true });
      window.addEventListener('load', sweep);
      setTimeout(sweep, 400);
      setTimeout(sweep, 1600);
      sweep();
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

      // The mailto hand-off is silent, so announce it for screen readers and
      // for anyone whose mail client opens in a background window.
      var status = form.querySelector('.formstatus');
      if (status) {
        status.textContent = document.documentElement.lang === 'ko'
          ? '메일 프로그램을 열었습니다. 창이 뜨지 않으면 info@widekhan.com 으로 직접 보내주십시오.'
          : 'Your email client should now be open. If nothing appeared, write to info@widekhan.com directly.';
      }
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
      // A content section is one carrying both an eyebrow and an h2. That
      // matches .head blocks and split layouts alike, and naturally excludes
      // the CTA, which has an h2 but no eyebrow.
      var brow = sec.querySelector('.eyebrow');
      var h2 = sec.querySelector('h2');
      if (!brow || !h2) return;
      if (!sec.id) sec.id = 'sec-' + (i + 1);
      // The eyebrow is already written as a short section label; the h2 is a
      // full sentence and truncates badly.
      var label = (brow.textContent || '').trim().replace(/[.。]\s*$/, '');
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

/* ==========================================================================
   v8 — Mega menu + product finder, built from the generated index.
   ========================================================================== */
(function () {
  'use strict';
  var idx = window.WK_INDEX;
  if (!idx) return;
  var ko = document.documentElement.lang === 'ko';
  var rows = idx[ko ? 'ko' : 'en'] || [];
  var t = ko
    ? { chem: '화학', agri: '식품·농산물', ind: '산업분야', all: '전체 보기',
        search: '품목 검색', ph: '품목명을 입력하세요 — 예: 아세톤, 소맥, 가소제',
        hint: '취급 품목과 카테고리 전체에서 검색합니다.', none: '검색 결과가 없습니다.',
        close: '닫기', cat: '카테고리' }
    : { chem: 'Chemicals', agri: 'Food & Agri', ind: 'Industries', all: 'View all',
        search: 'Search products', ph: 'Search a product — e.g. acetone, wheat, plasticiser',
        hint: 'Searching every listed product and category.', none: 'No match.',
        close: 'Close', cat: 'Category' };

  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };
  var byPage = function (p) {
    return rows.filter(function (r) { return r.p === p; });
  };
  var imgBase = /\/ko\//.test(location.pathname) ? '../assets/img/' : 'assets/img/';

  /* ---------- Mega menu ---------- */
  var hdr = document.querySelector('.hdr');
  var navEl = document.querySelector('.nav');

  if (hdr && navEl && window.innerWidth > 1023) {
    var panels = {};

    var build = function (pageFile, featImg, kicker) {
      var list = byPage(pageFile);
      if (!list.length) return;
      var half = Math.ceil(list.length / 2);
      var col = function (arr) {
        return '<ul>' + arr.map(function (r) {
          return '<li><a href="' + pageFile + '#' + r.id + '">' + esc(r.n) + '</a></li>';
        }).join('') + '</ul>';
      };
      var el = document.createElement('div');
      el.className = 'mega';
      el.innerHTML =
        '<div class="wrap mega__in">' +
          '<div class="mega__col"><h4>' + esc(t.cat) + ' 01</h4>' + col(list.slice(0, half)) + '</div>' +
          '<div class="mega__col"><h4>' + esc(t.cat) + ' 02</h4>' + col(list.slice(half)) + '</div>' +
          '<a class="mega__feat" href="' + pageFile + '">' +
            '<img src="' + featImg + '" alt="" loading="lazy" />' +
            '<span><em>' + esc(kicker) + '</em>' + esc(t.all) + '</span>' +
          '</a>' +
        '</div>';
      document.body.appendChild(el);
      panels[pageFile] = el;
    };

    build('chemicals.html', imgBase + 'div-chemicals.jpg', t.chem);
    build('agri.html', imgBase + 'div-agri.jpg', t.agri);
    build('industries.html', imgBase + 'hero-industries.jpg', t.ind);

    var openKey = null;
    var closeTimer = null;

    var place = function (el) {
      el.style.top = Math.max(0, hdr.getBoundingClientRect().bottom) + 'px';
    };
    var closeAll = function () {
      Object.keys(panels).forEach(function (k) { panels[k].classList.remove('is-open'); });
      navEl.querySelectorAll('a[data-mega]').forEach(function (a) { a.classList.remove('is-open'); });
      openKey = null;
    };
    var openPanel = function (key, link) {
      if (openKey === key) return;
      closeAll();
      var el = panels[key];
      if (!el) return;
      place(el);
      el.classList.add('is-open');
      link.classList.add('is-open');
      openKey = key;
    };
    var armClose = function () {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(closeAll, 180);
    };

    navEl.querySelectorAll('a').forEach(function (a) {
      var file = (a.getAttribute('href') || '').split('#')[0];
      if (!panels[file]) return;
      a.setAttribute('data-mega', file);
      a.addEventListener('mouseenter', function () { clearTimeout(closeTimer); openPanel(file, a); });
      a.addEventListener('mouseleave', armClose);
      a.addEventListener('focus', function () { clearTimeout(closeTimer); openPanel(file, a); });
    });
    Object.keys(panels).forEach(function (k) {
      panels[k].addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
      panels[k].addEventListener('mouseleave', armClose);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    window.addEventListener('scroll', function () {
      if (openKey) place(panels[openKey]);
    }, { passive: true });
  }

  /* ---------- Product finder ---------- */
  var side = document.querySelector('.hdr__side');
  if (!side) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'searchbtn';
  btn.setAttribute('aria-label', t.search);
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>' +
    '<path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  side.insertBefore(btn, side.firstChild);

  var ov = document.createElement('div');
  ov.className = 'finder';
  ov.innerHTML =
    '<div class="finder__panel">' +
      '<div class="wrap">' +
        '<div class="finder__bar">' +
          '<input type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t.ph) + '" aria-label="' + esc(t.search) + '" />' +
          '<button type="button" class="finder__close">' + esc(t.close) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="wrap finder__results"><p class="finder__hint">' + esc(t.hint) + '</p></div>' +
    '</div>';
  document.body.appendChild(ov);

  var input = ov.querySelector('input');
  var results = ov.querySelector('.finder__results');

  var mark = function (s, q) {
    var i = s.toLowerCase().indexOf(q);
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  };

  var render = function (raw) {
    var q = raw.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '<p class="finder__hint">' + esc(t.hint) + '</p>';
      return;
    }
    var hits = [];
    rows.forEach(function (r) {
      if (r.n.toLowerCase().indexOf(q) > -1) {
        hits.push({ k: t.cat, n: r.n, p: r.p, id: r.id });
      }
      r.i.forEach(function (item) {
        if (item.toLowerCase().indexOf(q) > -1) {
          hits.push({ k: r.n, n: item, p: r.p, id: r.id });
        }
      });
    });
    if (!hits.length) {
      results.innerHTML = '<p class="finder__hint">' + esc(t.none) + '</p>';
      return;
    }
    results.innerHTML = hits.slice(0, 40).map(function (h) {
      return '<a class="fres" href="' + h.p + '#' + h.id + '">' +
        '<span class="fres__k">' + esc(h.k) + '</span>' +
        '<span class="fres__n">' + mark(h.n, q) + '</span>' +
        '<span class="fres__p">' + esc(h.p.replace('.html', '')) + '</span>' +
      '</a>';
    }).join('');
  };

  var openFinder = function () {
    ov.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 60);
  };
  var closeFinder = function () {
    ov.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', openFinder);
  ov.querySelector('.finder__close').addEventListener('click', closeFinder);
  ov.addEventListener('click', function (e) { if (e.target === ov) closeFinder(); });
  input.addEventListener('input', function () { render(input.value); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ov.classList.contains('is-open')) closeFinder();
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      openFinder();
    }
  });
})();

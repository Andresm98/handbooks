/* AnaxDevBook — comportamiento compartido de los handbooks.
   Todo el estado local (tema, capítulos dominados) es opcional: si el
   almacenamiento del navegador no está disponible la página funciona igual. */
(function () {
  'use strict';

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------- Tema ---------- */
  var root = document.documentElement;
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
  }
  applyTheme(store.get('devbook.theme', null));
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next); store.set('devbook.theme', next);
    });

    /* ---------- Menú móvil ---------- */
    var menuBtn = document.getElementById('menuBtn');
    var scrim = document.getElementById('scrim');
    function closeNav() { document.body.classList.remove('nav-open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); }
    if (menuBtn) menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (scrim) scrim.addEventListener('click', closeNav);
    document.querySelectorAll('.sidebar a').forEach(function (a) { a.addEventListener('click', closeNav); });

    /* ---------- Índice activo ---------- */
    var chapters = Array.prototype.slice.call(document.querySelectorAll('section.chapter'));
    var tocByCh = {};
    document.querySelectorAll('.toc-ch').forEach(function (el) { tocByCh[el.getAttribute('data-ch')] = el; });
    var subLinks = {};
    document.querySelectorAll('.toc-sub').forEach(function (a) { subLinks[a.getAttribute('href').slice(1)] = a; });
    var heads = Array.prototype.slice.call(document.querySelectorAll('section.chapter h3[id]'));
    var activeCh = null, activeSub = null;

    function setActive() {
      var y = window.scrollY + 120;
      var ch = null;
      for (var i = 0; i < chapters.length; i++) { if (chapters[i].offsetTop <= y) ch = chapters[i]; else break; }
      var id = ch ? ch.id : null;
      if (id !== activeCh) {
        if (activeCh && tocByCh[activeCh]) { tocByCh[activeCh].classList.remove('open'); tocByCh[activeCh].querySelector('.toc-link').classList.remove('active'); }
        if (id && tocByCh[id]) {
          tocByCh[id].classList.add('open');
          var link = tocByCh[id].querySelector('.toc-link');
          link.classList.add('active');
          var sb = document.getElementById('sidebar');
          if (sb && !document.body.classList.contains('nav-open')) {
            var r = link.getBoundingClientRect(), sr = sb.getBoundingClientRect();
            if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) sb.scrollTop += r.top - sr.top - sr.height / 3;
          }
        }
        activeCh = id;
      }
      var sub = null;
      for (var j = 0; j < heads.length; j++) { if (heads[j].offsetTop <= y) sub = heads[j]; else break; }
      var sid = sub && sub.closest('section.chapter') === ch ? sub.id : null;
      if (sid !== activeSub) {
        if (activeSub && subLinks[activeSub]) subLinks[activeSub].classList.remove('active');
        if (sid && subLinks[sid]) subLinks[sid].classList.add('active');
        activeSub = sid;
      }
      var bar = document.getElementById('progressBar');
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
      }
      var top = document.getElementById('backToTop');
      if (top) top.classList.toggle('show', window.scrollY > 900);
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(function () { setActive(); ticking = false; }); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', setActive);
    setActive();

    var backToTop = document.getElementById('backToTop');
    if (backToTop) backToTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); });

    /* ---------- Filtro del índice ---------- */
    var filter = document.getElementById('tocFilter');
    if (filter) {
      filter.addEventListener('input', function () {
        var q = normalize(filter.value);
        document.querySelectorAll('.toc-ch').forEach(function (ch) {
          var subs = ch.querySelectorAll('.toc-sub');
          var chMatch = normalize(ch.querySelector('.toc-link').textContent).indexOf(q) > -1;
          var anySub = false;
          subs.forEach(function (s) {
            var m = !q || chMatch || normalize(s.textContent).indexOf(q) > -1;
            s.classList.toggle('toc-hidden', !m);
            if (m && q) anySub = true;
          });
          ch.classList.toggle('toc-hidden', !!q && !chMatch && !anySub);
          ch.classList.toggle('open', !!q && (anySub || chMatch) || ch.getAttribute('data-ch') === activeCh);
        });
        document.querySelectorAll('.toc-group').forEach(function (g) {
          g.classList.toggle('toc-hidden', !g.querySelector('.toc-ch:not(.toc-hidden)'));
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault(); document.body.classList.add('nav-open'); filter.focus();
        }
        if (e.key === 'Escape') { filter.blur(); closeNav(); }
      });
    }

    /* ---------- Capítulos dominados ---------- */
    var book = document.body.getAttribute('data-book');
    var doneKey = 'devbook.done.' + book;
    var done = store.get(doneKey, {});
    function paintDone(id) {
      var btn = document.querySelector('.mark-done[data-ch="' + id + '"]');
      var on = !!done[id];
      if (btn) { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? '✓ Dominado' : 'Marcar como dominado'; }
      var t = tocByCh[id];
      if (t) {
        var mark = t.querySelector('.done');
        if (on && !mark) { mark = document.createElement('span'); mark.className = 'done'; mark.textContent = '✓'; t.querySelector('.toc-link').appendChild(mark); }
        if (!on && mark) mark.remove();
      }
    }
    function paintCount() {
      var el = document.getElementById('doneCount');
      if (el) el.textContent = Object.keys(done).filter(function (k) { return done[k] && tocByCh[k]; }).length + ' / ' + chapters.length;
    }
    document.querySelectorAll('.mark-done').forEach(function (btn) {
      var id = btn.getAttribute('data-ch');
      paintDone(id);
      btn.addEventListener('click', function () {
        if (done[id]) delete done[id]; else done[id] = true;
        store.set(doneKey, done); paintDone(id); paintCount();
      });
    });
    paintCount();

    /* ---------- Copiar código ---------- */
    document.querySelectorAll('.content pre').forEach(function (pre) {
      if (pre.closest('.diagram')) return;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'copy-btn'; btn.textContent = 'copiar';
      btn.addEventListener('click', function () {
        var clone = pre.cloneNode(true);
        clone.querySelectorAll('.copy-btn, .lang-label').forEach(function (n) { n.remove(); });
        var text = clone.textContent.replace(/\s+$/, '');
        var ok = function () { btn.textContent = 'copiado'; setTimeout(function () { btn.textContent = 'copiar'; }, 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () {}); else ok();
      });
      pre.appendChild(btn);
    });

    /* ---------- Impresión: abrir plegables ---------- */
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details').forEach(function (d) { if (!d.open) { d.setAttribute('data-print-open', ''); d.open = true; } });
    });
    window.addEventListener('afterprint', function () {
      document.querySelectorAll('details[data-print-open]').forEach(function (d) { d.open = false; d.removeAttribute('data-print-open'); });
    });

    /* ---------- Abrir plegable al navegar a un ancla interna ---------- */
    function openTarget() {
      if (!location.hash) return;
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!el) return;
      var d = el.closest('details');
      while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    }
    window.addEventListener('hashchange', openTarget);
    openTarget();
  });

  function normalize(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      var swUrl = document.body.getAttribute('data-sw') || 'sw.js';
      navigator.serviceWorker.register(swUrl).catch(function () { /* offline opcional */ });
    });
  }
})();

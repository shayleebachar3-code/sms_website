/* S.M.S Drinks: anonymous visitor-behavior events (v1). Standalone and fail-safe: if anything fails, the site keeps working.
   No personal data: random ids only, field NAMES (never what people type), referrer host only. Respects Do Not Track.
   Events go to Supabase table site_events (insert-only for the browser). See the privacy policy. */
(function () {
  'use strict';
  var S = window.SITE || {};
  if (!S.SUPABASE_URL || !S.SUPABASE_KEY || !window.fetch || !document.querySelector) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent || '')) return;

  function rid() {
    try { var a = new Uint8Array(9); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
    catch (e) { return (Math.random().toString(36) + Math.random().toString(36)).replace(/0\./g, '').slice(0, 18); }
  }
  function store(kind, key) { try { var s = window[kind], v = s.getItem(key); if (!v) { v = rid(); s.setItem(key, v); } return v; } catch (e) { return rid(); } }
  var sid = store('sessionStorage', 'sms_sid'), vid = store('localStorage', 'sms_vid');
  var page = (location.pathname || '/').replace(/\/index\.html$/, '/') || '/';
  var dev = window.matchMedia && matchMedia('(max-width: 767px)').matches ? 'm' : 'd';
  var ref = ''; try { var rh = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; if (rh && rh !== location.hostname.replace(/^www\./, '')) ref = rh.slice(0, 80); } catch (e) {}
  var attr = null; try { attr = window.SMS_ATTR ? window.SMS_ATTR.get() : null; } catch (e) {}
  var cut = function (s, n) { return s == null ? null : String(s).slice(0, n); };
  var base = { sid: sid, vid: vid, page: cut(page, 80), dev: dev, ref: ref || null,
    src: attr ? cut(attr.label, 60) : null, med: attr ? cut(attr.utm_medium, 60) : null, camp: attr ? cut(attr.utm_campaign, 80) : null };

  var q = [], sent = 0, MAX = 300, timer = 0;
  function ev(name, sec, val, n) {
    if (sent + q.length >= MAX) return;
    var r = {}; for (var k in base) r[k] = base[k];
    r.ev = name; r.sec = cut(sec, 40); r.val = cut(val, 60); r.n = n == null ? null : Math.max(0, Math.min(100000, Math.round(n)));
    q.push(r);
    if (q.length >= 12) flush(); else if (!timer) timer = setTimeout(flush, 4000);
  }
  function flush(final) {
    clearTimeout(timer); timer = 0;
    if (!q.length) return;
    var body = JSON.stringify(q); sent += q.length; q = [];
    try {
      fetch(S.SUPABASE_URL + '/rest/v1/site_events', { method: 'POST', keepalive: !!final, body: body,
        headers: { 'Content-Type': 'application/json', apikey: S.SUPABASE_KEY, Authorization: 'Bearer ' + S.SUPABASE_KEY, Prefer: 'return=minimal' } })
        .catch(function () {});
    } catch (e) {}
  }
  window.SMS_TRACK = ev;

  /* page view, time on page, last section seen */
  ev('view', null, null, null);
  var shown = Date.now(), active = 0, cur = 'hero', left = false;
  function leave() {
    if (left) return; left = true;
    active += Date.now() - shown;
    ev('leave', cur, null, active / 1000); flush(true);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (!left) { active += Date.now() - shown; shown = Date.now(); ev('leave', cur, 'hidden', active / 1000); flush(true); left = true; } }
    else if (left) { left = false; shown = Date.now(); }
  });
  addEventListener('pagehide', leave);

  /* sections entering the screen */
  var seen = {};
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id || (e.target.classList.contains('final') ? 'final' : '');
        if (!id || id === 'top') { cur = 'hero'; return; }
        cur = id;
        if (!seen[id]) { seen[id] = 1; ev('sec', id, null, (Date.now() - shown + active) / 1000); }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(document.querySelectorAll('main section'), function (s) { io.observe(s); });
  }

  /* scroll depth */
  var depth = 0;
  addEventListener('scroll', function () {
    var h = document.documentElement, max = h.scrollHeight - innerHeight; if (max <= 0) return;
    var p = (scrollY || h.scrollTop) / max * 100;
    [25, 50, 75, 100].forEach(function (m) { if (p >= m - 1 && depth < m) { depth = m; ev('scroll', null, null, m); } });
  }, { passive: true });

  function where(el) {
    if (el.closest('.fab')) return 'fab';
    if (el.closest('#res')) return 'calc';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.hdr')) return 'header';
    var s = el.closest('section'); return s ? (s.id || (s.classList.contains('final') ? 'final' : 'other')) : 'other';
  }

  /* clicks */
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var wa = t.closest('a.wa, .wa a, a[href*="wa.me"]'); if (wa) { ev('wa', where(wa)); flush(true); return; }
    if (t.closest('#rlead')) { ev('calc_lead', 'calc'); return; }
    var nav = t.closest('.hdr nav a'); if (nav) { ev('nav', 'header', nav.getAttribute('href')); return; }
    var fq = t.closest('.acc-btn');
    if (fq) setTimeout(function () { if (fq.getAttribute('aria-expanded') === 'true') ev('faq', 'faq', fq.id); }, 0);
  }, true);

  /* calculator */
  var panels = document.getElementById('panels'), calcOn = false, lastEdit = {};
  function calcTouch(e) {
    var t = e.target; if (!t || !panels.contains(t)) return;
    if (!calcOn) { calcOn = true; ev('calc_start', 'build'); }
    var f = t.id || t.name || (t.closest('[data-k]') && t.closest('[data-k]').getAttribute('data-k')) || (t.closest('button') && (t.closest('button').getAttribute('data-v') || t.closest('button').className)) || t.tagName.toLowerCase();
    var now = Date.now(); if (lastEdit[f] && now - lastEdit[f] < 1500) return; lastEdit[f] = now;
    ev('calc_edit', 'build', f);
  }
  if (panels) { panels.addEventListener('input', calcTouch, true); panels.addEventListener('change', calcTouch, true); panels.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button,label,input')) calcTouch(e); }, true); }

  /* lead form */
  var form = document.getElementById('leadForm'), fOn = false, fSeen = {};
  if (form) {
    form.addEventListener('focusin', function (e) {
      var n = e.target && (e.target.name || e.target.id); if (!n || n === 'contact_me_by_fax_only') return;
      if (!fOn) { fOn = true; ev('form_start', 'contact', n); }
      if (!fSeen[n]) { fSeen[n] = 1; ev('form_field', 'contact', n); }
    });
    if (window.MutationObserver) {
      Array.prototype.forEach.call(form.querySelectorAll('.err'), function (sp) {
        new MutationObserver(function () { if (sp.textContent.trim()) ev('form_error', 'contact', sp.id); }).observe(sp, { childList: true, characterData: true, subtree: true });
      });
      var fm = document.getElementById('formMsg');
      if (fm) new MutationObserver(function () { if (/\bok\b/.test(fm.className) && fm.textContent) { ev('lead', 'contact'); flush(true); } }).observe(fm, { attributes: true, childList: true });
    }
  }
})();

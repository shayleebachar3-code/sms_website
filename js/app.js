/* S.M.S Drinks — site logic: header, reveal, accessibility, live calculator, FAQ, lead form. */
(function () {
'use strict';

const SITE = window.SITE || {};
let RM = false;
const $ = id => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const root = document.documentElement;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* ---------- WhatsApp ---------- */
const waUrl = t => 'https://wa.me/' + (SITE.WA_NUMBER || '') + '?text=' + encodeURIComponent(t);
document.querySelectorAll('a.wa').forEach(a => { if (a.id !== 'rwa') a.href = waUrl(SITE.DEFAULT_MSG || ''); });

/* ---------- accessibility widget ---------- */
(function () {
  const btn = $('a11yBtn'), panel = $('a11yPanel');
  const FLAGS = ['a11y-contrast', 'a11y-gray', 'a11y-links', 'a11y-font', 'a11y-still', 'a11y-cursor'];
  let st = {};
  try { st = JSON.parse(store.get('sms-a11y') || '{}') || {}; } catch (e) { st = {}; }
  const apply = () => {
    FLAGS.forEach(f => {
      root.classList.toggle(f, !!st[f]);
      const b = panel.querySelector('[data-a="' + f + '"]');
      if (b) b.setAttribute('aria-pressed', st[f] ? 'true' : 'false');
    });
    root.style.setProperty('--fs', st.fs || 1);
    RM = !!st['a11y-still'];
    store.set('sms-a11y', JSON.stringify(st));
  };
  apply();
  const open = o => {
    panel.classList.toggle('open', o);
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) panel.querySelector('button').focus(); else btn.focus();
  };
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'fs+') st.fs = Math.min(1.3, +((st.fs || 1) + .1).toFixed(2));
    else if (a === 'fs-') st.fs = Math.max(.9, +((st.fs || 1) - .1).toFixed(2));
    else if (a === 'reset') st = {};
    else st[a] = !st[a];
    apply();
  });
})();

/* ---------- header, progress, back-to-top, nav highlight, timeline ---------- */
(function () {
  const bar = $('progBar'), top = $('toTop');
  let tick = false;
  const upd = () => {
    const y = scrollY, h = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? clamp(y / h, 0, 1) : 0) + ')';
    top.classList.toggle('show', y > 900);
    tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd);
  upd();
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

  const links = [...document.querySelectorAll('.hdr nav a')];
  if ('IntersectionObserver' in window) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(en => {
      const a = map.get(en.target.id); if (a && en.isIntersecting) { links.forEach(l => l.classList.remove('cur')); a.classList.add('cur'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((a, id) => { const s = $(id); if (s) io.observe(s); });
  }
})();

/* ---------- scroll reveals: tag every block, then reveal softly on entry ---------- */
(function () {
  const sel = 'main section > .wrap > *, .trust .tr, .bento > *, .pk > *, .panels > *, .acc, .form > *:not(.hp):not([type=hidden]), .split > *, .lead > *, footer .wrap > *, .final .wrap > *';
  const groups = new Map();
  document.querySelectorAll(sel).forEach(el => {
    if (el.closest('.hero') || el.classList.contains('rv') || el.classList.contains('glow') || el.matches('.ring-track')) return;
    const par = el.parentElement;
    const i = groups.get(par) || 0; groups.set(par, i + 1);
    el.classList.add('rv');
    if (par.classList.contains('split') || par.classList.contains('lead')) el.classList.add(i % 2 ? 'rv-l' : 'rv-r');
    else if (el.matches('.pc,.bc,.tr')) el.classList.add('rv-s');
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i * .09, .45).toFixed(2) + 's');
  });
})();

/* ---------- reveal + counters ---------- */
(function () {
  const rv = document.querySelectorAll('.rv');
  if (RM || !('IntersectionObserver' in window)) rv.forEach(e => e.classList.add('on'));
  else {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(e => io.observe(e));
    setTimeout(() => rv.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('on'); }), 400);
  }
  const fmt = n => n.toLocaleString('en-US');
  const run = el => {
    const to = +el.dataset.to, box = el.closest('b'), dur = to > 100 ? 2800 : 1900, t0 = performance.now();
    box.classList.add('run');
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(Math.round(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p))));
      if (p < 1) requestAnimationFrame(step);
      else { box.classList.remove('run'); box.classList.add('done'); }
    };
    requestAnimationFrame(step);
  };
  const nums = document.querySelectorAll('[data-to]');
  if (!RM && 'IntersectionObserver' in window) {
    nums.forEach(el => { el.textContent = '0'; });
    const io2 = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); io2.unobserve(en.target); } }), { threshold: .8 });
    nums.forEach(el => io2.observe(el));
  }
})();

/* ---------- FAQ accordion ---------- */
(function () {
  const list = $('faqList');
  list.addEventListener('click', e => {
    const b = e.target.closest('.acc-btn'); if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    list.querySelectorAll('.acc-btn').forEach(x => {
      const o = x === b ? !open : false;
      x.setAttribute('aria-expanded', o ? 'true' : 'false');
      $(x.getAttribute('aria-controls')).classList.toggle('open', o);
    });
  });
})();

/* ---------- 3D logo: very gentle pointer tilt ---------- */
(function () {
  const hdr = $('hdr'), logo = document.querySelector('.logo');
  if (!hdr || !logo || !window.matchMedia('(hover:hover)').matches) return;
  hdr.addEventListener('pointermove', e => {
    if (RM) return;
    const r = hdr.getBoundingClientRect();
    logo.style.setProperty('--ry', (-8 + ((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + 'deg');
    logo.style.setProperty('--rx', (5 - ((e.clientY - r.top) / r.height - .5) * 6).toFixed(2) + 'deg');
  });
  hdr.addEventListener('pointerleave', () => { logo.style.removeProperty('--ry'); logo.style.removeProperty('--rx'); });
})();

/* ---------- 360 ring: pinned while scrolling, progress equals scroll, last stage always reached ---------- */
(function () {
  const track = $('ringTrack'), wrap = $('ringWrap'); if (!track || !wrap) return;
  const ring = $('ring'), prog = $('ringProg'), glow = $('ringGlow'), head = $('ringHead'), now = $('ringNow');
  const ticks = [...wrap.querySelectorAll('.tk')], nodes = [...wrap.querySelectorAll('.nd')], steps = [...wrap.querySelectorAll('.rs')];
  const C = 2 * Math.PI * 150, LABELS = ['אפיון', 'תיאום', 'אספקה', 'זיכוי'], FULL = .72;
  let cur = 0, target = 0, raf = 0, shown = -1;
  const calc = () => {
    const r = track.getBoundingClientRect();
    const travel = Math.max(1, track.offsetHeight - wrap.offsetHeight);
    target = RM ? 1 : clamp(-r.top / (travel * FULL), 0, 1);
  };
  const draw = () => {
    const off = (C * (1 - cur)).toFixed(1);
    prog.style.strokeDashoffset = off; glow.style.strokeDashoffset = off;
    const a = cur * 2 * Math.PI;
    head.setAttribute('transform', 'translate(' + (200 + 150 * Math.sin(a)).toFixed(1) + ' ' + (200 - 150 * Math.cos(a)).toFixed(1) + ')');
    head.style.opacity = cur > .004 && cur < .996 ? 1 : 0;
    ticks.forEach(t => t.classList.toggle('on', cur > 0 && +t.dataset.a <= cur * 360));
    const k = Math.min(3, Math.floor(cur * 4));
    steps.forEach((s, i) => { const on = cur >= i * .25 + .02; s.classList.toggle('act', on); s.classList.toggle('cur', i === k); if (nodes[i]) nodes[i].classList.toggle('on', on); });
    ring.classList.toggle('done', cur >= .995);
    if (k !== shown) {
      const first = shown === -1; shown = k;
      now.style.opacity = 0;
      setTimeout(() => { now.textContent = LABELS[k]; now.style.opacity = 1; }, first ? 0 : 240);
      if (!first && !RM) { ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse'); }
    }
  };
  const loop = () => {
    cur += (target - cur) * (RM ? 1 : .1);
    if (Math.abs(target - cur) < .0004) cur = target;
    draw();
    raf = cur !== target ? requestAnimationFrame(loop) : 0;
  };
  const go = () => { calc(); if (!raf) raf = requestAnimationFrame(loop); };
  addEventListener('scroll', go, { passive: true });
  addEventListener('resize', go);
  go();
})();

/* ---------- scroll spotlight: whatever passes through the middle of the screen lights up ---------- */
(function () {
  const els = [...document.querySelectorAll('.sec-head, .vi, .rt, .tr, .ticks li')];
  const val = new Map(els.map(e => [e, 0]));
  let raf = 0;
  const tick = () => {
    const vh = innerHeight, line = vh * .5; let busy = false;
    els.forEach(e => {
      const r = e.getBoundingClientRect(); let t = 0;
      if (r.bottom > 0 && r.top < vh) {
        t = clamp(1 - Math.abs((r.top + r.bottom) / 2 - line) / (vh * .36), 0, 1);
        t = t * t * (3 - 2 * t);
      }
      let v = val.get(e); v += (t - v) * (RM ? 1 : .14);
      if (Math.abs(t - v) < .004) v = t; else busy = true;
      val.set(e, v); e.style.setProperty('--f', v.toFixed(3));
    });
    raf = busy ? requestAnimationFrame(tick) : 0;
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', go, { passive: true }); addEventListener('resize', go); go();
})();

/* ---------- journey rail ---------- */
(function () {
  const rail = $('rail'); if (!rail) return;
  const items = [...rail.querySelectorAll('a')], secs = items.map(a => $(a.getAttribute('href').slice(1)));
  let t = false;
  const upd = () => {
    const vh = innerHeight; rail.classList.toggle('show', scrollY > vh * .7);
    let k = -1; secs.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= vh * .5 && r.bottom > vh * .5) k = i; });
    items.forEach((a, i) => { a.classList.toggle('cur', i === k); a.classList.toggle('past', i < k); });
    t = false;
  };
  addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

/* ---------- drifting gold dust (parallax with scroll) ---------- */
(function () {
  const cv = $('dust'); if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, ps = [], raf = 0;
  const init = () => {
    dpr = Math.min(2, devicePixelRatio || 1); W = cv.width = Math.round(innerWidth * dpr); H = cv.height = Math.round(innerHeight * dpr);
    const n = clamp(Math.round(innerWidth * innerHeight / 24000), 16, 56);
    ps = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, d: .15 + Math.random() * .85, s: .5 + Math.random() * 1.2, ph: Math.random() * 6.28, a: .2 + Math.random() * .4 }));
  };
  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      const y = (((p.y * H - scrollY * p.d * .4 * dpr - (RM ? 0 : t * .005 * p.s * dpr)) % H) + H) % H;
      const x = (p.x * W + (RM ? 0 : Math.sin(t * .0003 * p.s + p.ph) * 26 * dpr)) % W;
      const tw = RM ? .8 : .55 + .45 * Math.sin(t * .0012 * p.s + p.ph);
      ctx.beginPath(); ctx.fillStyle = 'rgba(235,211,160,' + (p.a * tw).toFixed(3) + ')';
      ctx.shadowColor = 'rgba(217,186,124,.9)'; ctx.shadowBlur = 10 * dpr * p.d;
      ctx.arc(x, y, p.r * dpr, 0, 6.2832); ctx.fill();
    }
    raf = RM ? 0 : requestAnimationFrame(draw);
  };
  init(); draw(0);
  addEventListener('resize', () => { init(); if (RM) draw(0); });
})();

/* ---------- calculator ---------- */
const CFG = JSON.parse(atob(window.SITE_CALC));
const NAME = { v: 'וודקה', w: 'וויסקי', a: 'ערק', g: "ג'ין", t: 'טקילה', f: 'וודקה בטעמים' };
const ORDER = ['v', 'w', 'a', 'g', 't', 'f'];
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const BUD = { u10: 'עד 10,000 ₪', m20: '10,000 עד 20,000 ₪', m30: '20,000 עד 30,000 ₪', na: 'עוד לא החלטנו' };
const S = { guests: 200, day: '2', type: 'wedding', aud: 'mixed', vibe: 'mid', end: '1', rank: ['v', 'w', 'a', 'g', 't'], flav: true, cock: 'rec', budget: 'na' };

function compute(a) {
  const g = a.guests;
  const early = +a.day <= 2;
  let per;
  if (!early || a.end === '3') per = CFG.l;
  else {
    const au = { young: 0, mixed: .5, mature: 1 }[a.aud], vb = { party: 0, mid: .5, quiet: 1 }[a.vibe];
    per = CFG.p[0] + (CFG.p[1] - CFG.p[0]) * ((au + vb) / 2);
  }
  const L = Math.ceil(g / per);
  const sh = {};
  a.rank.forEach((k, i) => { sh[k] = CFG.b[k] * CFG.r[i]; });
  sh.f = a.flav ? CFG.b.f : 0;
  const keys = Object.keys(sh).filter(k => sh[k] > 0);
  const tot = keys.reduce((s, k) => s + sh[k], 0);
  const raw = keys.map(k => L * sh[k] / tot);
  const n = raw.map(Math.floor);
  let rem = L - n.reduce((s, x) => s + x, 0);
  raw.map((x, i) => [x - Math.floor(x), i]).sort((p, q) => q[0] - p[0]).forEach(([, i]) => { if (rem > 0) { n[i]++; rem--; } });
  const mn = L >= 20 ? 2 : 1;
  if (L >= keys.length * mn) {
    for (let i = 0; i < n.length; i++) while (n[i] < mn) {
      const j = n.indexOf(Math.max(...n));
      if (n[j] <= mn) break;
      n[j]--; n[i]++;
    }
  }
  const qty = {}; ORDER.forEach(k => { qty[k] = 0; }); keys.forEach((k, i) => { qty[k] = n[i]; });
  const vod = qty.v;
  const mix = [];
  if (vod > 0) mix.push([Math.ceil(vod / CFG.e) + 1, 'מגשי משקה אנרגיה']);
  const jc = CFG.c * Math.ceil(g / CFG.k);
  mix.push([jc, 'משקה חמוציות'], [jc, 'משקה ראשן']);
  return { L, qty, mix };
}

const tween = (el, to, dur) => {
  const from = parseInt(el.textContent, 10) || 0;
  if (RM || from === to) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / (dur || 900)); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
const barsHtml = () => ORDER.map(k => '<div class="bar" data-k="' + k + '"><span>' + NAME[k] + '</span><span class="t"><i></i></span><span class="n" dir="ltr">0</span></div>').join('');
function fillBars(box, qty) {
  const mx = Math.max(1, ...ORDER.map(k => qty[k]));
  box.querySelectorAll('.bar').forEach(r => {
    const k = r.dataset.k, v = qty[k];
    r.hidden = v === 0;
    r.querySelector('i').style.width = Math.round(v / mx * 100) + '%';
    r.querySelector('.n').textContent = v;
  });
}

/* input panels */
let tipN = 0;
const label = (txt, tip) => {
  const id = 'tp' + (++tipN);
  const tb = tip ? '<button type="button" class="tipbtn" aria-label="הסבר" aria-describedby="' + id + '">?<span class="tip" role="tooltip" id="' + id + '">' + tip + '</span></button>' : '';
  return '<div class="lab"><span>' + txt + '</span>' + tb + '</div>';
};
const chips = (name, opts) => '<div class="chips" role="radiogroup" aria-label="' + name + '">' + opts.map((o, i) => {
  const id = 'c-' + name + '-' + i;
  return '<div class="chip"><input type="radio" name="' + name + '" id="' + id + '" value="' + o[0] + '"' + (String(S[name]) === o[0] ? ' checked' : '') + (o[3] ? ' aria-describedby="' + id + 't"' : '') + '><label for="' + id + '">' + o[1] + (o[2] ? '<small>' + o[2] + '</small>' : '') + '</label>' + (o[3] ? '<span class="tip" role="tooltip" id="' + id + 't">' + o[3] + '</span>' : '') + '</div>';
}).join('') + '</div>';

const rankHtml = () => '<ol class="rank" id="rk">' + S.rank.map((k, i) =>
  '<li><span class="pos" aria-hidden="true">' + (i + 1) + '</span><span>' + NAME[k] + '</span><span class="mv"><button type="button" data-k="' + k + '" data-d="-1" aria-label="' + NAME[k] + ', הזזה למעלה"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-k="' + k + '" data-d="1" aria-label="' + NAME[k] + ', הזזה למטה"' + (i === 4 ? ' disabled' : '') + '>▼</button></span></li>').join('') + '</ol>';

function buildPanels() {
  $('panels').innerHTML =
    '<section class="glass panel"><h3><span class="n">1</span>האירוע</h3>' +
      '<div class="fld">' + label('כמה אורחים מוזמנים, לכל היותר?', 'הזינו את המספר המקסימלי. אנחנו מקטינים את החבילה כשבוע לפני האירוע, לפי אישורי ההגעה. בין 20 ל-1,500.') +
        '<div class="gin"><div class="box"><button type="button" id="dec" aria-label="הפחתת 10 אורחים">−</button><input id="gin" type="number" inputmode="numeric" min="20" max="1500" value="' + S.guests + '" aria-label="מספר אורחים"><button type="button" id="inc" aria-label="הוספת 10 אורחים">+</button></div></div>' +
        '<input class="rng" id="grange" type="range" min="20" max="600" step="10" value="' + clamp(S.guests, 20, 600) + '" aria-label="בחירה מהירה של מספר אורחים"><div class="err" id="gerr" role="alert"></div></div>' +
      '<div class="fld">' + label('באיזה יום האירוע?', 'יום האירוע משפיע על קצב השתייה לאורך הערב.') + chips('day', DAYS.map((d, i) => [String(i), d])) + '</div>' +
      '<div class="fld">' + label('איזה אירוע?', '') + chips('type', [['wedding', 'חתונה'], ['henna', 'חינה'], ['other', 'אחר']]) + '</div>' +
    '</section>' +
    '<section class="glass panel"><h3><span class="n">2</span>הקהל והערב</h3>' +
      '<div class="fld">' + label('מי האורחים?', 'הרכב הגילאים הוא אחד המדדים החשובים לבניית הבר.') + chips('aud', [['young', 'צעיר'], ['mixed', 'מעורב'], ['mature', 'בוגר']]) + '</div>' +
      '<div class="fld">' + label('איזה ערב אתם מדמיינים?', 'ערב עם רחבה פעילה מרגיש אחרת מערב של ארוחה ארוכה, וגם הבר שלו.') + chips('vibe', [['quiet', 'ארוחה ושיחה', 'בעיקר ישיבה'], ['mid', 'שילוב', 'ישיבה וגם ריקודים'], ['party', 'מסיבה', 'רחבה פעילה']]) + '</div>' +
      '<div class="fld">' + label('עד מתי החגיגה?', 'אורך הערב קובע כמה זמן הבר צריך להישאר מלא.') + chips('end', [['1', 'עד 1:00'], ['3', 'עד 3:00'], ['na', 'עוד לא החלטנו']]) + '</div>' +
    '</section>' +
    '<section class="glass panel"><h3><span class="n">3</span>הטעם</h3>' +
      '<div class="fld">' + label('מה האורחים שלכם שותים הכי הרבה?', 'הדירוג קובע את חלוקת הבר בין הסוגים. מקום 1 הוא הסוג הכי חשוב לכם.') + rankHtml() + '</div>' +
      '<div class="fld"><label class="switch" for="flav"><span>וודקה בטעמים לשוטים</span><input type="checkbox" id="flav" role="switch"' + (S.flav ? ' checked' : '') + '></label></div>' +
      '<div class="fld">' + label('קוקטייל בר, למשל אפרול ספריץ?', 'קוקטייל בר מוסיף נגיעה מיוחדת וקל לשלב בהרכב.') + chips('cock', [['yes', 'כן, נשמח'], ['no', 'לא צריך'], ['rec', 'תמליצו לנו']]) + '</div>' +
    '</section>' +
    '<section class="glass panel" id="budgetPanel"><h3><span class="n">4</span>התקציב</h3>' +
      '<div class="fld">' + label('מה טווח התקציב המשוער לבר?', 'עד 30,000 ₪. זה עוזר לנו להתאים הצעה, ואין בזה שום התחייבות.') + chips('budget', [['u10', 'עד 10,000 ₪'], ['m20', '10,000 עד 20,000 ₪'], ['m30', '20,000 עד 30,000 ₪'], ['na', 'עוד לא החלטנו']]) + '</div>' +
    '</section>';
  $('rBars').innerHTML = barsHtml();
}
buildPanels();

const R_C = 2 * Math.PI * 52;
function summary(res) {
  const lines = ['היי, בניתי באתר בר לאירוע ואשמח להצעה.'];
  lines.push('אורחים (מקסימום): ' + S.guests, 'יום: ' + DAYS[+S.day], 'אירוע: ' + { wedding: 'חתונה', henna: 'חינה', other: 'אחר' }[S.type]);
  lines.push('קהל: ' + { young: 'צעיר', mixed: 'מעורב', mature: 'בוגר' }[S.aud] + ', ערב: ' + { quiet: 'ארוחה ושיחה', mid: 'שילוב', party: 'מסיבה' }[S.vibe]);
  lines.push('סיום: ' + { '1': 'עד 1:00', '3': 'עד 3:00', na: 'לא הוחלט' }[S.end]);
  lines.push('תקציב משוער: ' + BUD[S.budget]);
  lines.push('סה"כ כ-' + res.L + ' ליטר:');
  ORDER.forEach(k => { if (res.qty[k]) lines.push('- ' + NAME[k] + ': ' + res.qty[k]); });
  res.mix.forEach(m => lines.push('- ' + m[1] + ': ' + m[0]));
  return lines.join('\n');
}

let lastL = 0, liveT = 0;
function update() {
  if (!(S.guests >= 20 && S.guests <= 1500)) return;
  const res = compute(S);
  const inten = res.L / S.guests;
  const lv = inten < .112 ? [1, 'ערב רגוע'] : inten < .135 ? [2, 'ערב מאוזן'] : [3, 'ערב אנרגטי'];
  const frac = clamp((inten - .08) / .08, .12, 1);
  $('rMeta').textContent = S.guests + ' אורחים · יום ' + DAYS[+S.day] + (S.budget === 'na' ? '' : ' · ' + BUD[S.budget]);
  tween($('rL'), res.L, 700);
  $('gval').style.strokeDasharray = (frac * R_C).toFixed(1) + ' 999';
  $('gauge').className = 'gauge lvl' + lv[0];
  const b = $('badge'); b.className = 'badge lvl' + lv[0]; b.textContent = lv[1];
  fillBars($('rBars'), res.qty);
  $('rMix').innerHTML = res.mix.map(m => '<span>' + m[0] + ' ' + m[1] + '</span>').join('');
  const sum = summary(res);
  $('rwa').href = waUrl(sum);
  $('calcField').value = sum;
  clearTimeout(liveT);
  liveT = setTimeout(() => { if (res.L !== lastL) { $('live').textContent = 'הבר מתעדכן: כ-' + res.L + ' ליטר אלכוהול, ' + lv[1] + '.'; lastL = res.L; } }, 900);
}

(function bindCalc() {
  const gi = $('gin'), gr = $('grange'), err = $('gerr');
  const setG = v => {
    S.guests = v;
    const ok = v >= 20 && v <= 1500;
    err.textContent = ok ? '' : 'הזינו מספר אורחים בין 20 ל-1,500.';
    if (ok && v <= 600) gr.value = v;
    update();
  };
  gi.addEventListener('input', () => setG(parseInt(gi.value, 10) || 0));
  gr.addEventListener('input', () => { gi.value = gr.value; setG(+gr.value); });
  $('dec').onclick = () => { gi.value = Math.max(20, (parseInt(gi.value, 10) || 20) - 10); setG(+gi.value); };
  $('inc').onclick = () => { gi.value = Math.min(1500, (parseInt(gi.value, 10) || 0) + 10); setG(+gi.value); };
  $('panels').addEventListener('change', e => {
    const t = e.target;
    if (t.type === 'radio') { S[t.name] = t.value; update(); }
    else if (t.id === 'flav') { S.flav = t.checked; update(); }
  });
  $('panels').addEventListener('click', e => {
    const tb = e.target.closest('.tipbtn'); if (tb) { tb.classList.toggle('open'); return; }
    const b = e.target.closest('.rank button'); if (!b || b.disabled) return;
    const k = b.dataset.k, d = +b.dataset.d, i = S.rank.indexOf(k), j = i + d;
    if (j < 0 || j > 4) return;
    [S.rank[i], S.rank[j]] = [S.rank[j], S.rank[i]];
    $('rk').outerHTML = rankHtml();
    let t = document.querySelector('#rk button[data-k="' + k + '"][data-d="' + d + '"]');
    if (!t || t.disabled) t = document.querySelector('#rk button[data-k="' + k + '"]:not([disabled])');
    if (t) t.focus();
    $('live').textContent = NAME[k] + ' במקום ' + (j + 1);
    update();
  });
  const rl = $('rlead');
  if (rl) rl.addEventListener('click', e => { e.preventDefault(); $('contact').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); });
  update();
})();

/* ---------- lead form (Netlify Forms by default, Formspree if configured) ---------- */
(function () {
  const form = $('leadForm'), msg = $('formMsg'), btn = $('sendBtn');
  const set = (id, t) => { $(id).textContent = t; };
  const hint = $('okHint');
  const syncOk = () => { const on = $('f-ok').checked; btn.disabled = !on; if (hint) hint.hidden = on; };
  $('f-ok').addEventListener('change', () => { syncOk(); if ($('f-ok').checked) set('e-ok', ''); });
  syncOk();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'fmsg'; msg.textContent = '';
    const name = $('f-name').value.trim(), phone = $('f-phone').value.replace(/[^\d+]/g, ''), mail = $('f-mail').value.trim();
    const eN = name.length < 2 ? 'כתבו את השם המלא.' : '';
    const eP = phone.replace(/\D/g, '').length < 9 ? 'הזינו מספר טלפון תקין.' : '';
    const eM = mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? 'כתובת האימייל אינה תקינה.' : '';
    const eK = $('f-ok').checked ? '' : 'יש לסמן את אישור הדיוור ויצירת הקשר כדי לשלוח את הפרטים.';
    set('e-name', eN); set('e-phone', eP); set('e-mail', eM); set('e-ok', eK);
    const bad = eN ? 'f-name' : eP ? 'f-phone' : eM ? 'f-mail' : eK ? 'f-ok' : '';
    if (bad) { $(bad).focus(); return; }
    if (form.company && form.company.value) return;
    if (!$('f-ok').checked) { syncOk(); return; }
    btn.disabled = true; const lab = btn.textContent; btn.textContent = 'שולחים…';
    try {
      const fd = new FormData(form);
      let res;
      if (SITE.SUPABASE_URL && SITE.SUPABASE_KEY) {
        // Parameterised REST insert through the Supabase API (PostgREST): no SQL is ever built from user input.
        const notes = [fd.get('message') || '', fd.get('calc') ? '— סימולציית בר מהאתר —\n' + fd.get('calc') : '', '[אישור דיוור ויצירת קשר: כן · ' + new Date().toISOString() + ' · תקנון 2026-11-09]'].filter(Boolean).join('\n\n').slice(0, 6000);
        res = await fetch(SITE.SUPABASE_URL + '/rest/v1/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SITE.SUPABASE_KEY, Authorization: 'Bearer ' + SITE.SUPABASE_KEY, Prefer: 'return=minimal' },
          body: JSON.stringify({ name, phone: $('f-phone').value.trim(), email: mail || null, notes: notes || null, source: 'אתר' })
        });
      } else if (SITE.FORM_ENDPOINT) res = await fetch(SITE.FORM_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      else res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() });
      if (!res.ok) throw new Error('bad status');
      msg.className = 'fmsg ok';
      msg.textContent = 'תודה, קיבלנו. נחזור אליכם בהקדם עם הצעה.';
      form.reset(); update(); syncOk();
    } catch (err) {
      msg.className = 'fmsg bad';
      msg.innerHTML = 'לא הצלחנו לשלוח כרגע. אפשר לכתוב לנו ישירות <a href="' + esc(waUrl('היי, השארתי פרטים באתר: ' + name + ', ' + phone)) + '" target="_blank" rel="noopener">בוואטסאפ</a>.';
    } finally { btn.textContent = lab; syncOk(); }
  });
})();

})();

/* S.M.S Drinks: realistic whiskey pour for the hero glass (v1).
   Standalone and fail-safe: if anything here fails, the original CSS-animated glass stays on screen.
   Physics: the stream is a chain of ballistic particles emitted from the bottle lip, so glug pulses
   travel down it and the tail falls naturally; the surface is a 1D spring-wave simulation; ice floats
   when the level reaches it. Reduced motion or the "stop animations" button shows a still, full glass. */
(function () {
  'use strict';
  var svg = document.getElementById('pourSvg');
  if (!svg || !window.requestAnimationFrame || !svg.querySelector) return;
  var NS = 'http://www.w3.org/2000/svg', root = document.documentElement, box = svg.parentNode;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var $ = function (id) { return document.getElementById(id); };
  var dyn = $('pDyn'), sl = $('pStreamL'), bot = $('pBottle'), glint = $('pGlint');
  var glow = $('pGlow'), table = $('pTable'), refl = $('pRefl');
  if (!dyn || !sl || !bot) return;
  function mk(tag, a, p) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function still() { return (mq && mq.matches) || root.classList.contains('a11y-still'); }
  var small = window.innerWidth < 640;

  /* ---------- geometry ---------- */
  var BOT = 306, MAXH = 114, CX = 160, G = 1500, KV = 24;
  function wl(y) { return 68 + (y - 122) * 10 / 184; }
  function wr(y) { return 252 - (y - 122) * 10 / 184; }
  var NW = 44, X0 = 62, DX = 196 / (NW - 1), wh = [], wv = [];
  for (var i = 0; i < NW; i++) { wh.push(0); wv.push(0); }
  var vol = 0;
  function lvl() { return BOT - vol; }
  function col(x) { return Math.max(0, Math.min(NW - 1, Math.round((x - X0) / DX))); }
  function surfAt(x) { return lvl() + wh[col(x)]; }

  /* ---------- scene ---------- */
  var liq = mk('path', { fill: 'url(#gl)' }, dyn);
  var liqD = mk('path', { fill: 'url(#gd)' }, dyn);
  var caus = mk('ellipse', { cx: 160, cy: 296, rx: 80, ry: 22, fill: 'url(#cg)', opacity: 0 }, dyn);
  var band = mk('path', { fill: 'url(#sf)', opacity: '.82' }, dyn);
  var hiB = mk('path', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.42', 'stroke-width': '1.1', 'stroke-linecap': 'round' }, dyn);
  var ICE = [
    { x: 158, w: 34, h: 30, rest: 251, fo: 11, r0: -9 },
    { x: 121, w: 46, h: 40, rest: 285, fo: 14, r0: 4 },
    { x: 202, w: 32, h: 29, rest: 291, fo: 10, r0: -3 }
  ];
  var clip = mk('clipPath', { id: 'pIceClip' }, svg.querySelector('defs'));
  function rr(w, h, r, j) { var a = w / 2, b = h / 2;
    return 'M' + (-a + r) + ' ' + (-b + j) + ' L' + (a - r) + ' ' + (-b) + ' Q' + a + ' ' + (-b) + ' ' + a + ' ' + (-b + r) + ' L' + (a + j * .4) + ' ' + (b - r) + ' Q' + a + ' ' + b + ' ' + (a - r) + ' ' + b + ' L' + (-a + r) + ' ' + (b + j * .5) + ' Q' + (-a) + ' ' + b + ' ' + (-a) + ' ' + (b - r) + ' L' + (-a - j * .3) + ' ' + (-b + r) + ' Q' + (-a) + ' ' + (-b) + ' ' + (-a + r) + ' ' + (-b + j) + ' Z'; }
  ICE.forEach(function (c, k) {
    var a = c.w / 2, b = c.h / 2;
    c.y = c.rest; c.vy = 0; c.a = c.r0; c.va = 0; c.dx = 0;
    c.o = mk('path', { id: 'pIce' + k, d: rr(c.w, c.h, 6, 1.5 - k), fill: 'url(#ig)', stroke: '#fff', 'stroke-opacity': '.55', 'stroke-width': '1' }, dyn);
    c.f = mk('path', { d: 'M' + (-a + 5) + ' ' + (-b + 5) + ' L' + (a - 4) + ' ' + (-b + 3) + ' M' + (-a + 4) + ' ' + (b - 5) + ' L' + (a - 5) + ' ' + (b - 6) + ' M' + (-a + 9) + ' ' + (-b + 3) + ' L' + (-a + 6) + ' ' + (b - 4), fill: 'none', stroke: '#fff', 'stroke-opacity': '.3', 'stroke-width': '.9' }, dyn);
    c.s = mk('path', { d: 'M' + (-a + 4) + ' ' + (-b + 4) + ' L' + (-a + 15) + ' ' + (-b + 3) + ' L' + (-a + 11) + ' ' + (b - 4) + ' L' + (-a + 4) + ' ' + (b - 3) + ' Z', fill: '#fff', 'fill-opacity': '.2' }, dyn);
    mk('use', { href: '#pIce' + k }, clip);
  });
  var tintG = mk('g', { 'clip-path': 'url(#pIceClip)' }, dyn);
  var tint = mk('path', { fill: 'url(#gl)', opacity: '.62' }, tintG);
  var men = mk('path', { fill: 'none', stroke: '#ffe7b0', 'stroke-opacity': '.6', 'stroke-width': '1.3', 'stroke-linecap': 'round' }, dyn);
  var bubG = mk('g', { fill: '#fff1cf' }, dyn);
  var BUB = [], DROP = [];
  for (i = 0; i < (small ? 16 : 28); i++) BUB.push({ on: 0, e: mk('circle', { r: 1, opacity: 0 }, bubG) });
  var str = mk('path', { fill: '#de953a', 'fill-opacity': '.94' }, sl);
  var strHi = mk('path', { fill: '#fff4d2', 'fill-opacity': '.62' }, sl);
  var dropG = mk('g', { fill: '#f4bf66' }, sl);
  for (i = 0; i < (small ? 10 : 18); i++) DROP.push({ on: 0, e: mk('circle', { r: 1, opacity: 0 }, dropG) });

  bot.innerHTML =
    '<path d="M-8 0 H8 V7 H6 V56 C6 76 27 82 27 104 V224 Q27 232 19 232 H-19 Q-27 232 -27 224 V104 C-27 82 -6 76 -6 56 V7 H-8 Z" fill="url(#bt)"/>' +
    '<path d="M-8 0 H8 V7 H6.3 V34 H-6.3 V7 H-8 Z" fill="url(#bf)"/><rect x="-6.3" y="31" width="12.6" height="1.6" fill="#4a3410"/>' +
    '<ellipse cx="0" cy=".6" rx="7.6" ry="1.8" fill="#120700"/>' +
    '<rect x="-24" y="128" width="48" height="62" rx="2" fill="url(#lbl)"/><rect x="-21" y="131" width="42" height="56" fill="none" stroke="#a88a4e" stroke-width=".8"/>' +
    '<text x="0" y="158" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="13" font-weight="700" fill="#3a2508" letter-spacing="1.4">S.M.S</text>' +
    '<text x="0" y="170" text-anchor="middle" font-family="Heebo,Arial,sans-serif" font-size="5" fill="#6b5226" letter-spacing="2">DRINKS</text>' +
    '<path d="M-17 108 Q-18 103 -14 99 L-12 99 V222 H-17 Z" fill="#fff" opacity=".26"/><rect x="-3.6" y="36" width="1.5" height="22" fill="#fff" opacity=".34"/>' +
    '<path d="M23 108 V222" stroke="#ffcf8a" stroke-opacity=".35" stroke-width="1.2"/>';

  /* ---------- helpers ---------- */
  function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function poly(pts, move) { /* smooth curve through points (quadratic midpoints) */
    var s = (move ? 'M' : 'L') + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var k = 1; k < pts.length - 1; k++) {
      var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
      s += ' Q' + pts[k][0].toFixed(1) + ' ' + pts[k][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    var l = pts[pts.length - 1]; return s + ' L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1);
  }
  var KEYS = [ /* time, lip x, lip y, angle (deg) */
    [0, 336, -160, -28], [.7, 336, -160, -28], [2.0, 172, 28, -100], [2.6, 170, 31, -128],
    [7.3, 168, 33, -137], [8.0, 177, 24, -95], [9.4, 344, -170, -24]];
  function pose(t) {
    if (t <= KEYS[0][0]) return KEYS[0];
    for (var k = 1; k < KEYS.length; k++) if (t < KEYS[k][0]) {
      var A = KEYS[k - 1], B = KEYS[k], p = (t - A[0]) / (B[0] - A[0]), e = k === 4 ? p : ease(p);
      return [t, A[1] + (B[1] - A[1]) * e, A[2] + (B[2] - A[2]) * e, A[3] + (B[3] - A[3]) * e];
    }
    return KEYS[KEYS.length - 1];
  }
  var LOOP = 15.2, T = 0, flow = 0, fStart = -9, fStop = -9, hist = [], wasFlow = false, last = 0, acc = 0;

  function reset() {
    vol = 0; for (var k = 0; k < NW; k++) { wh[k] = 0; wv[k] = 0; }
    ICE.forEach(function (c) { c.y = c.rest; c.vy = 0; c.a = c.r0; c.va = 0; });
    BUB.forEach(function (b) { b.on = 0; b.e.setAttribute('opacity', 0); });
    DROP.forEach(function (d) { d.on = 0; d.e.setAttribute('opacity', 0); });
    hist.length = 0; flow = 0; wasFlow = false; fStop = -9;
  }
  function kick(x, dv) { var c = col(x); wv[c] += dv; if (c > 0) wv[c - 1] += dv * .5; if (c < NW - 1) wv[c + 1] += dv * .5; }
  function spawnBub(x, y, vy, r) { for (var k = 0; k < BUB.length; k++) if (!BUB[k].on) { var b = BUB[k]; b.on = 1; b.x = x; b.y = y; b.vy = vy; b.r = r; b.ph = Math.random() * 6; b.e.setAttribute('r', r.toFixed(2)); return; } }
  function spawnDrop(x, y) { for (var k = 0; k < DROP.length; k++) if (!DROP[k].on) { var d = DROP[k]; d.on = 1; d.x = x; d.y = y; d.vx = (Math.random() - .5) * 110; d.vy = -(70 + Math.random() * 170); d.r = .7 + Math.random() * 1.1; d.e.setAttribute('r', d.r.toFixed(2)); return; } }

  /* ---------- simulation step (fixed dt) ---------- */
  function step(dt) {
    T += dt;
    if (T >= LOOP) { T = 0; reset(); }
    var P = pose(T), ang = P[3], lx = P[1], ly = P[2];
    if (T > 2.6 && T < 7.3) { ang += Math.sin(T * 9.1) * .5 + Math.sin(T * 23.7) * .22; lx += Math.sin(T * 5.3) * .35; }
    var ft = Math.max(0, Math.min(1, (-ang - 106) / 16));
    flow += (ft - flow) * Math.min(1, dt * 9);
    if (vol >= MAXH) flow *= .9;
    var on = flow > .03;
    if (on && !wasFlow) fStart = T;
    if (!on && wasFlow) fStop = T;
    wasFlow = on;
    var f = on ? flow * (.84 + .16 * Math.sin(T * 20.1) + .07 * Math.sin(T * 48.4 + 1.3)) * (1 + .5 * Math.exp(-(T - fStart) * 3)) : 0;
    P.ang = ang; P.lx = lx; P.ly = ly; P.f = f; step.P = P;

    /* emit one stream particle from the lip */
    var ar = ang * Math.PI / 180, dx = Math.sin(ar), dy = -Math.cos(ar), v0 = 50 + 50 * flow;
    if (T > .6 && T < 9.6) hist.push({ te: T, x: lx + dx * 3, y: ly + dy * 3, vx: dx * v0, vy: dy * v0, f: f, dt: dt, hit: 0 });
    for (var k = hist.length - 1; k >= 0; k--) {
      var h = hist[k], a = T - h.te;
      if (a > 1.4) { hist.splice(0, k + 1); break; }
      if (h.hit) continue;
      var px = h.x + h.vx * a, py = h.y + h.vy * a + .5 * G * a * a;
      h.px = px; h.py = py;
      if (py >= surfAt(px) && py > 120) {
        h.hit = 1;
        if (h.f > .02) {
          vol = Math.min(MAXH, vol + h.f * h.dt * KV);
          kick(px, 2600 * h.f * h.dt);
          ICE.forEach(function (c) { if (Math.abs(px - c.x - c.dx) < c.w * .5 && c.y < c.rest - 1) { c.vy += 900 * h.f * h.dt; c.va += (px < c.x ? -1 : 1) * 500 * h.f * h.dt; } });
          if (Math.random() < h.f * h.dt * 26) spawnDrop(px, lvl() - 1);
          if (Math.random() < h.f * h.dt * (small ? 26 : 48)) spawnBub(px + (Math.random() - .5) * 16, lvl() + 12 + Math.random() * Math.min(70, vol * .7), -(30 + Math.random() * 55), .7 + Math.random() * 1.5);
        }
      }
    }
    /* after-pour bubbles from the bottom, fading out */
    if (vol > 20 && !on && T > fStop && Math.random() < dt * 7 * Math.exp(-(T - fStop) / 2.6)) spawnBub(84 + Math.random() * 150, BOT - 3 - Math.random() * 10, -(14 + Math.random() * 22), .5 + Math.random() * 1);

    /* surface waves */
    var lap, S = 800, K = 5, D = 1.1;
    for (k = 0; k < NW; k++) {
      lap = (k > 0 ? wh[k - 1] : wh[k]) + (k < NW - 1 ? wh[k + 1] : wh[k]) - 2 * wh[k];
      wv[k] += (S * lap - K * wh[k] - D * wv[k]) * dt;
    }
    for (k = 0; k < NW; k++) { wh[k] += wv[k] * dt; if (wh[k] > 7) wh[k] = 7; else if (wh[k] < -7) wh[k] = -7; }

    /* ice */
    ICE.forEach(function (c, n) {
      c.dx = Math.sin(T * .45 + n * 2.1) * (c.y < c.rest - 2 ? 3 : 0);
      var s = surfAt(c.x + c.dx), tg = Math.min(c.rest, s + c.fo);
      c.vy += (55 * (tg - c.y) - 4.2 * c.vy) * dt; c.y += c.vy * dt;
      if (c.y > c.rest) { c.y = c.rest; c.vy = 0; }
      var cc = col(c.x + c.dx), sl2 = (wh[Math.min(NW - 1, cc + 2)] - wh[Math.max(0, cc - 2)]) * 4;
      var at = c.y < c.rest - 2 ? c.r0 * .4 + sl2 : c.r0;
      c.va += (30 * (at - c.a) - 3.2 * c.va) * dt; c.a += c.va * dt;
    });
    /* bubbles */
    BUB.forEach(function (b) {
      if (!b.on) return;
      b.vy -= 18 * dt; b.y += b.vy * dt; b.x += Math.sin(T * 7 + b.ph) * .12;
      if (b.y <= surfAt(b.x) + b.r) { b.on = 0; b.e.setAttribute('opacity', 0); kick(b.x, -6); }
    });
    /* splash drops */
    DROP.forEach(function (d) {
      if (!d.on) return;
      d.vy += 950 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.vy > 0 && d.y >= surfAt(d.x)) { d.on = 0; d.e.setAttribute('opacity', 0); kick(d.x, 30); }
    });
  }

  /* ---------- render ---------- */
  function render() {
    var Y = lvl(), rx = (wr(Y) - wl(Y)) / 2, ry = rx * .07, back = [], front = [], mid = [], k, x, u, q;
    var amb = vol > 2 ? T : 0;
    for (k = 0; k < NW; k++) {
      x = X0 + k * DX; u = Math.max(-1, Math.min(1, (x - CX) / rx)); q = Math.sqrt(1 - u * u);
      var w = wh[k] + (vol > 2 ? .35 * Math.sin(amb * 2.3 + k * .55) : 0);
      back.push([x, Y - ry * q + w * .55]); front.push([x, Y + ry * q + w]); mid.push([x, Y + w * .8]);
    }
    var show = vol > 1.5;
    liq.setAttribute('d', show ? poly(back, true) + ' L262 352 L58 352 Z' : '');
    liqD.setAttribute('d', show ? poly(back, true) + ' L262 352 L58 352 Z' : '');
    tint.setAttribute('d', show ? poly(mid, true) + ' L262 352 L58 352 Z' : '');
    band.setAttribute('d', show ? poly(back, true) + ' ' + poly(front.slice().reverse(), false) + ' Z' : '');
    hiB.setAttribute('d', show ? poly(back.slice(5, Math.round(NW * .55)), true) : '');
    men.setAttribute('d', show ? poly(front.slice(2, NW - 2), true) : '');
    var fr = vol / MAXH;
    caus.setAttribute('opacity', (fr * .9).toFixed(3));
    if (glow) glow.setAttribute('opacity', (.05 + .13 * fr).toFixed(3));
    if (table) table.setAttribute('opacity', (.08 + .22 * fr).toFixed(3));
    if (refl) refl.setAttribute('opacity', (.08 + .16 * fr).toFixed(3));
    ICE.forEach(function (c) {
      var tr = 'translate(' + (c.x + c.dx).toFixed(2) + ' ' + c.y.toFixed(2) + ') rotate(' + c.a.toFixed(2) + ')';
      c.o.setAttribute('transform', tr); c.f.setAttribute('transform', tr); c.s.setAttribute('transform', tr);
    });
    BUB.forEach(function (b) { if (b.on) { b.e.setAttribute('cx', b.x.toFixed(1)); b.e.setAttribute('cy', b.y.toFixed(1)); b.e.setAttribute('opacity', '.6'); } });
    DROP.forEach(function (d) { if (d.on) { d.e.setAttribute('cx', d.x.toFixed(1)); d.e.setAttribute('cy', d.y.toFixed(1)); d.e.setAttribute('opacity', '.95'); } });

    /* stream: contiguous runs of un-landed particles with flow */
    var P = step.P, segs = [], cur = null;
    for (k = hist.length - 1; k >= 0; k--) {
      var h = hist[k];
      if (h.hit || h.f < .03 || h.px == null) { if (cur && h.hit && h.f >= .03) cur.push({ x: h.px, y: Math.min(h.py, surfAt(h.px) + 1), f: h.f, a: T - h.te, vy: h.vy + G * (T - h.te), vx: h.vx }); cur = null; continue; }
      if (!cur) { cur = []; segs.push(cur); }
      cur.push({ x: h.px, y: h.py, f: h.f, a: T - h.te, vy: h.vy + G * (T - h.te), vx: h.vx });
    }
    var dS = '', dH = '';
    segs.forEach(function (sg) {
      if (sg.length < 2) return;
      var L = [], R = [], HL = [], HR = [];
      for (var m = 0; m < sg.length; m++) {
        var p = sg[m], pa = sg[Math.max(0, m - 1)], pb = sg[Math.min(sg.length - 1, m + 1)];
        var tx = pb.x - pa.x, ty = pb.y - pa.y, tl = Math.sqrt(tx * tx + ty * ty) || 1; tx /= tl; ty /= tl;
        var nx = -ty, ny = tx, sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
        var wd = Math.max(.7, 10.5 * p.f * Math.pow(70 / Math.max(70, sp), .4));
        var wob = Math.sin(p.a * 38 + p.y * .05) * .45 * Math.min(1, p.a * 5);
        var cx = p.x + nx * wob, cy = p.y + ny * wob;
        L.push([cx + nx * wd / 2, cy + ny * wd / 2]); R.push([cx - nx * wd / 2, cy - ny * wd / 2]);
        HL.push([cx - nx * wd * .05, cy - ny * wd * .05]); HR.push([cx - nx * wd * .3, cy - ny * wd * .3]);
      }
      dS += poly(L, true) + ' ' + poly(R.reverse(), false) + ' Z ';
      dH += poly(HL, true) + ' ' + poly(HR.reverse(), false) + ' Z ';
    });
    str.setAttribute('d', dS); strHi.setAttribute('d', dH);

    /* bottle */
    var vis = T > .55 && T < 9.5;
    bot.setAttribute('opacity', vis ? '1' : '0');
    if (vis) bot.setAttribute('transform', 'translate(' + P.lx.toFixed(2) + ' ' + P.ly.toFixed(2) + ') rotate(' + P.ang.toFixed(2) + ') scale(.8)');
    /* glass glint while the drink rests */
    if (glint) { var gp = (T - 10.1) / 1.5; glint.setAttribute('opacity', gp > 0 && gp < 1 ? (Math.sin(gp * Math.PI) * .7).toFixed(3) : '0'); glint.setAttribute('x', (-80 + 420 * Math.max(0, Math.min(1, gp))).toFixed(1)); }
    /* fade out at the end of the loop, fade ice in at the start */
    var o = T > 14 ? Math.max(0, 1 - (T - 14) / .9) : T < .6 ? T / .6 : 1;
    dyn.setAttribute('opacity', o.toFixed(3));
  }

  /* ---------- still frame (reduced motion) ---------- */
  function freeze() {
    reset(); vol = MAXH * .96; T = 11.8;
    for (var n = 0; n < 400; n++) { /* settle ice without waves */
      ICE.forEach(function (c) { var tg = Math.min(c.rest, lvl() + c.fo); c.y += (tg - c.y) * .2; c.a = c.r0 * .4; });
    }
    step.P = pose(11.8); render();
    bot.setAttribute('opacity', '0'); if (glint) glint.setAttribute('opacity', '0'); dyn.setAttribute('opacity', '1');
  }

  /* ---------- loop control ---------- */
  var visible = true, raf = 0, frozen = false;
  function frame(now) {
    raf = 0;
    if (!last) last = now;
    var dt = Math.min(.05, (now - last) / 1000); last = now; acc += dt;
    while (acc >= 1 / 120) { step(1 / 120); acc -= 1 / 120; }
    render();
    kick2();
  }
  function kick2() {
    var run = visible && !document.hidden && !still();
    if (!run) { last = 0; if (still() && !frozen) { frozen = true; freeze(); } return; }
    if (frozen) { frozen = false; reset(); T = 0; }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  try {
    box.classList.add('pour-on');
    reset(); step.P = pose(0); render();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick2(); }, { rootMargin: '80px' }).observe(box);
    document.addEventListener('visibilitychange', kick2);
    if (mq && mq.addEventListener) mq.addEventListener('change', kick2);
    if (window.MutationObserver) new MutationObserver(kick2).observe(root, { attributes: true, attributeFilter: ['class'] });
    kick2();
  } catch (err) {
    box.classList.remove('pour-on');
    try { console.error('pour', err); } catch (x) {}
  }
})();

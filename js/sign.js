(function () {
  'use strict';
  var S = window.SITE || {}, app = document.getElementById('app');
  var tok = (new URLSearchParams(location.search).get('t') || '').trim();
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.textContent = h; return e; }
  function rpc(fn, body) {
    return fetch(S.SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: S.SUPABASE_KEY, Authorization: 'Bearer ' + S.SUPABASE_KEY }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'error'); return j; }); });
  }
  function msg(t) { app.innerHTML = ''; app.appendChild(el('p', 'sg-msg', t)); }
  function fmt(iso) { try { return new Date(iso).toLocaleString('he-IL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }); } catch (e) { return iso; } }
  function docView(s) {
    var f = document.createDocumentFragment();
    f.appendChild(el('h1', '', s.title || 'הסכם שירות'));
    f.appendChild(el('p', 'sg-ver', 'גרסה ' + (s.version || '') + (s.created ? ' · הופק ' + s.created : '')));
    [['parties', 'הצדדים'], ['summary', 'פרטי העסקה']].forEach(function (g) {
      var rows = s[g[0]]; if (!rows || !rows.length) return;
      var b = el('section', 'sg-box'); b.appendChild(el('h2', '', g[1]));
      var dl = el('dl', 'sg-kv'); rows.forEach(function (r) { dl.appendChild(el('dt', '', r.k)); dl.appendChild(el('dd', '', r.v)); }); b.appendChild(dl); f.appendChild(b);
    });
    (s.sections || []).forEach(function (sec, i) {
      var b = el('section', 'sg-sec'); b.appendChild(el('h2', '', (i + 1) + '. ' + sec.h));
      (sec.p || []).forEach(function (t) { b.appendChild(el('p', '', t)); });
      if (sec.ul && sec.ul.length) { var u = el('ul'); sec.ul.forEach(function (t) { u.appendChild(el('li', '', t)); }); b.appendChild(u); }
      f.appendChild(b);
    });
    return f;
  }
  function signedView(a) {
    var b = el('section', 'sg-ok');
    b.appendChild(el('p', '', '')).innerHTML = '<b>ההסכם נחתם. תודה!</b>';
    b.appendChild(el('p', '', 'נחתם על ידי ' + (a.signer_name || '') + ' בתאריך ' + fmt(a.signed_at) + '. עותק של ההסכם נשמר אצלנו.'));
    var h = el('p', 'sg-mono', 'מזהה חתימה: ' + (a.signed_hash || '')); b.appendChild(h);
    var r = el('div', 'sg-row sg-noprint'), p = el('button', 'sg-btn', 'הדפסה / שמירה כ-PDF'); p.type = 'button'; p.onclick = function () { window.print(); }; r.appendChild(p); b.appendChild(r);
    return b;
  }
  function pad(canvas) {
    var ctx = canvas.getContext('2d'), drawing = false, dirty = false, last = null;
    function fit() { var r = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1; if (canvas.width !== Math.round(r.width * d)) { canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); ctx.scale(d, d); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1020'; } }
    function pt(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    canvas.addEventListener('pointerdown', function (e) { fit(); drawing = true; last = pt(e); canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + .1, last.y + .1); ctx.stroke(); dirty = true; e.preventDefault(); });
    canvas.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; if (pad.onchange) pad.onchange(); e.preventDefault(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; if (pad.onchange) pad.onchange(); }); });
    fit(); window.addEventListener('resize', function () { if (!dirty) fit(); });
    return { has: function () { return dirty; }, clear: function () { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.restore(); dirty = false; if (pad.onchange) pad.onchange(); }, png: function () { return canvas.toDataURL('image/png'); } };
  }
  function formView(a) {
    var f = el('form', 'sg-form'); f.noValidate = true;
    f.appendChild(el('h2', '', 'אישור וחתימה'));
    var checks = [
      ['terms', true, 'קראתי והבנתי את ההסכם, את התקנון ואת תנאי השירות, ואני מסכים/ה להם.'],
      ['marketing', false, 'לא חובה: אני מאשר/ת קבלת דיוור והצעות מ"ש.מ.ש משקאות" (וואטסאפ, SMS, אימייל). אפשר להסיר בכל עת.']
    ], cb = {};
    checks.forEach(function (c) { var l = el('label', 'sg-chk'), i = document.createElement('input'); i.type = 'checkbox'; i.name = c[0]; cb[c[0]] = i; l.appendChild(i); l.appendChild(el('span', '', c[2])); f.appendChild(l); });
    var nm = el('label', 'sg-f'); nm.appendChild(el('span', '', 'שם מלא של החותם/ת')); var ni = document.createElement('input'); ni.type = 'text'; ni.autocomplete = 'name'; ni.maxLength = 80; nm.appendChild(ni); f.appendChild(nm);
    f.appendChild(el('span', 'sg-f', '')).innerHTML = '<span>חתימה (בעזרת האצבע או העכבר)</span>';
    var pw = el('div', 'sg-pad'), cv = document.createElement('canvas'); cv.setAttribute('aria-label', 'אזור חתימה'); pw.appendChild(cv); var ph = el('div', 'sg-ph', 'חתמו כאן'); pw.appendChild(ph); f.appendChild(pw);
    var P = pad(cv); pad.onchange = function () { ph.style.display = P.has() ? 'none' : 'flex'; };
    var row = el('div', 'sg-row'), clr = el('button', 'sg-btn sg-ghost', 'ניקוי חתימה'); clr.type = 'button'; clr.onclick = function () { P.clear(); };
    var go = el('button', 'sg-btn', 'אני מאשר/ת וחותם/ת'); go.type = 'submit'; row.appendChild(go); row.appendChild(clr); f.appendChild(row);
    var er = el('p', 'sg-err'); er.setAttribute('role', 'alert'); f.appendChild(er);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); er.textContent = '';
      if (!cb.terms.checked) { er.textContent = 'יש לסמן את האישור כדי להמשיך.'; return; }
      if (ni.value.trim().length < 2) { er.textContent = 'נא להזין שם מלא.'; ni.focus(); return; }
      if (!P.has()) { er.textContent = 'נא לחתום באזור החתימה.'; return; }
      go.disabled = true; go.textContent = 'שולח…';
      var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (x) {}
      rpc('agreement_sign', { p_token: tok, p_name: ni.value.trim(), p_signature: P.png(), p_consents: { terms: true, cancel: true, privacy: true, marketing: !!cb.marketing.checked }, p_ua: navigator.userAgent, p_tz: tz })
        .then(function () { return rpc('agreement_get', { p_token: tok }); })
        .then(function (r) { render(r); window.scrollTo(0, 0); })
        .catch(function () { go.disabled = false; go.textContent = 'אני מאשר/ת וחותם/ת'; er.textContent = 'השליחה נכשלה. בדקו את החיבור ונסו שוב, או פנו אלינו.'; });
    });
    return f;
  }
  function render(a) {
    if (!a || !a.snapshot) { msg('הקישור אינו תקין או שההסכם בוטל. אפשר לפנות אלינו לקבלת קישור חדש.'); return; }
    app.innerHTML = '';
    if (a.status === 'signed') app.appendChild(signedView(a));
    app.appendChild(docView(a.snapshot));
    if (a.status === 'sent') app.appendChild(formView(a));
    else if (a.status !== 'signed') msg('ההסכם עדיין לא נשלח לחתימה.');
  }
  if (tok.length < 32) { msg('הקישור חסר או שגוי. אפשר לפנות אלינו לקבלת קישור חדש.'); return; }
  rpc('agreement_get', { p_token: tok }).then(render).catch(function () { msg('לא הצלחנו לטעון את ההסכם. נסו לרענן, או פנו אלינו.'); });
})();

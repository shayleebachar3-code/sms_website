/* S.M.S Drinks: lead form. Standalone on purpose, so a problem in any animation/calculator code can never stop the form from working. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SITE = window.SITE || {};
  var form = $('leadForm'), msg = $('formMsg'), btn = $('sendBtn'), ok = $('f-ok'), hint = $('okHint');
  if (!form || !btn || !ok) return;
  var set = function (id, t) { var e = $(id); if (e) e.textContent = t; };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var waUrl = function (t) { return 'https://wa.me/' + (SITE.WA_NUMBER || '') + '?text=' + encodeURIComponent(t); };
  var busy = false;
  function sync() {
    btn.style.opacity = ok.checked ? '' : '.55';
    if (hint) hint.hidden = ok.checked;
  }
  btn.disabled = false; /* never a dead button: an unticked box shows a clear message instead */
  ok.addEventListener('change', function () { sync(); if (ok.checked) set('e-ok', ''); });
  sync();
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    msg.className = 'fmsg'; msg.textContent = '';
    var name = $('f-name').value.trim(), rawPhone = $('f-phone').value.trim(), phone = rawPhone.replace(/[^\d+]/g, ''), mail = $('f-mail').value.trim();
    var eN = name.length < 2 ? 'כתבו את השם המלא.' : '';
    var eP = phone.replace(/\D/g, '').length < 9 ? 'הזינו מספר טלפון תקין.' : '';
    var eM = mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? 'כתובת האימייל אינה תקינה.' : '';
    var eK = ok.checked ? '' : 'יש לסמן את אישור הדיוור ויצירת הקשר כדי לשלוח את הפרטים.';
    set('e-name', eN); set('e-phone', eP); set('e-mail', eM); set('e-ok', eK);
    var bad = eN ? 'f-name' : eP ? 'f-phone' : eM ? 'f-mail' : eK ? 'f-ok' : '';
    if (bad) { $(bad).focus(); msg.className = 'fmsg bad'; msg.textContent = eK && !eN && !eP && !eM ? eK : 'יש לתקן את השדות המסומנים.'; return; }
    var trap = $('hpTrap');
    if (trap && trap.value) { /* bot trap: pretend success, send nothing (never a silent dead click for a person) */ msg.className = 'fmsg ok'; msg.textContent = 'תודה, קיבלנו. נחזור אליכם בהקדם עם הצעה.'; return; }
    busy = true; btn.disabled = true; var lab = btn.textContent; btn.textContent = 'שולחים…';
    var calc = $('calcField') ? $('calcField').value : '', message = $('f-msg') ? $('f-msg').value.trim() : '';
    var notes = [message, calc ? '— סימולציית חבילה מהאתר —\n' + calc : '', '[אישור דיוור ויצירת קשר: כן · ' + new Date().toISOString() + ' · תקנון 2026-11-09]'].filter(Boolean).join('\n\n').slice(0, 6000);
    var req;
    if (SITE.SUPABASE_URL && SITE.SUPABASE_KEY) {
      req = fetch(SITE.SUPABASE_URL + '/rest/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SITE.SUPABASE_KEY, Authorization: 'Bearer ' + SITE.SUPABASE_KEY, Prefer: 'return=minimal' },
        body: JSON.stringify({ name: name, phone: rawPhone, email: mail || null, notes: notes || null, source: 'אתר' })
      });
    } else req = Promise.reject(new Error('not configured'));
    req.then(function (res) {
      if (!res.ok) throw new Error('bad status ' + res.status);
      msg.className = 'fmsg ok'; msg.textContent = 'תודה, קיבלנו. נחזור אליכם בהקדם עם הצעה.';
      form.reset(); sync();
    }).catch(function (err) {
      try { console.error('lead form', err); } catch (x) {}
      msg.className = 'fmsg bad';
      msg.innerHTML = 'לא הצלחנו לשלוח כרגע. אפשר לכתוב לנו ישירות <a href="' + esc(waUrl('היי, השארתי פרטים באתר: ' + name + ', ' + phone)) + '" target="_blank" rel="noopener">בוואטסאפ</a>.';
    }).then(function () { busy = false; btn.disabled = false; btn.textContent = lab; sync(); });
  });
})();

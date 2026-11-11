/* S.M.S Drinks: lead-source tracking. Standalone and fail-safe on purpose: if anything here fails, the site and the lead form keep working. */
(function () {
  'use strict';
  var KEY = 'sms_attr_v1', TTL = 30 * 24 * 3600 * 1000, memory = null;
  var BY_SOURCE = {
    instagram: 'אינסטגרם', ig: 'אינסטגרם',
    facebook: 'פייסבוק', fb: 'פייסבוק', msg: 'פייסבוק', meta: 'פייסבוק',
    tiktok: 'טיקטוק', google: 'גוגל', whatsapp: 'וואטסאפ',
    mit4mit: 'אינדקס ספקים', engaged: 'אינדקס ספקים', directory: 'אינדקס ספקים',
    venue: 'שיתופי פעולה', partner: 'שיתופי פעולה', collab: 'שיתופי פעולה',
    friend: 'חבר מביא חבר', referral: 'חבר מביא חבר'
  };
  var PAID = /(^|[^a-z])(paid|cpc|ppc|cpm|ads?|boost|promo)([^a-z]|$)/i;
  function dec(s) { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); } }
  function qs(search) {
    var o = {}, s = String(search || '').replace(/^\?/, '');
    if (!s) return o;
    s.split('&').forEach(function (p) {
      var i = p.indexOf('='), k = dec(i < 0 ? p : p.slice(0, i)), v = i < 0 ? '' : dec(p.slice(i + 1));
      if (k && !(k in o)) o[k] = v;
    });
    return o;
  }
  function hostOf(ref) { var m = /^https?:\/\/([^\/?#]+)/i.exec(ref || ''); return m ? m[1].toLowerCase().replace(/^www\./, '') : ''; }
  function labelFromHost(h) {
    if (!h) return '';
    if (/(^|\.)instagram\.com$/.test(h)) return 'אינסטגרם';
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h)) return 'פייסבוק';
    if (/(^|\.)tiktok\.com$/.test(h)) return 'טיקטוק';
    if (/(^|\.)google\.[a-z.]+$/.test(h)) return 'גוגל';
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return 'וואטסאפ';
    return 'אחר: ' + h;
  }
  /* Pure function: reads the address parameters and the referrer, returns the touch or null for a direct visit. */
  function classify(search, referrer, ownHost) {
    var q = qs(search), src = (q.utm_source || '').toLowerCase().replace(/^\s+|\s+$/g, ''), med = (q.utm_medium || '').replace(/^\s+|\s+$/g, '');
    var rh = hostOf(referrer);
    if (rh && ownHost && (rh === ownHost || rh.slice(-ownHost.length) === ownHost)) rh = '';
    var label = '';
    if (src) label = BY_SOURCE[src] || ('אחר: ' + src);
    else if (rh) label = labelFromHost(rh);
    else if (q.fbclid) label = 'פייסבוק';
    else if (q.gclid) label = 'גוגל';
    if (!label) return null;
    var paid = PAID.test(med) && /^(אינסטגרם|פייסבוק|טיקטוק|גוגל)$/.test(label);
    return {
      label: label + (paid ? ' (ממומן)' : ''),
      utm_source: src || null, utm_medium: med || null, utm_campaign: q.utm_campaign || null,
      utm_content: q.utm_content || null, utm_term: q.utm_term || null,
      referrer_host: rh || null, click_id: q.fbclid ? 'fbclid' : (q.gclid ? 'gclid' : null),
      landing: (typeof location !== 'undefined' ? location.pathname : '/'), at: new Date().toISOString()
    };
  }
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && o.last && Date.now() - Date.parse(o.last.at) < TTL) return o; }
    } catch (e) {}
    return memory;
  }
  function write(o) { memory = o; try { window.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function init() {
    try {
      var a = classify(location.search, document.referrer, location.hostname);
      if (!a) return;
      var cur = read();
      write({ first: (cur && cur.first) || a, last: a });
    } catch (e) {}
  }
  /* The touch to save with a lead: the latest non-direct visit within 30 days, plus the first touch label if it differs. */
  function get() {
    try {
      var o = read();
      if (!o || !o.last) return null;
      var r = {}, k;
      for (k in o.last) if (Object.prototype.hasOwnProperty.call(o.last, k)) r[k] = o.last[k];
      if (o.first && o.first.label !== o.last.label) r.first_touch = o.first.label;
      return r;
    } catch (e) { return null; }
  }
  window.SMS_ATTR = { get: get, classify: classify };
  init();
})();

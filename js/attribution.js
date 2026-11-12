/* S.M.S Drinks: lead-source tracking (v2). Standalone and fail-safe on purpose: if anything here fails, the site and the lead form keep working.
   Reads UTM parameters, click ids (fbclid/gclid), the referrer HOST and the in-app browser (Instagram/Facebook) on arrival.
   Keeps the first and the latest non-direct touch for 30 days in localStorage (memory fallback). No personal data. */
(function () {
  'use strict';
  var KEY = 'sms_attr_v1', TTL = 30 * 24 * 3600 * 1000, memory = null;
  var IG = 'אינסטגרם', FB = 'פייסבוק', GG = 'גוגל', TT = 'טיקטוק', YT = 'יוטיוב', WA = 'וואטסאפ';
  var PAID_T = 'ממומן', ORG_T = 'אורגני';
  var BY_SOURCE = {
    instagram: IG, ig: IG, insta: IG,
    facebook: FB, fb: FB, msg: FB, messenger: FB, meta: FB, an: FB,
    tiktok: TT, tt: TT, google: GG, youtube: YT, whatsapp: WA, wa: WA,
    mit4mit: 'אינדקס ספקים', engaged: 'אינדקס ספקים', directory: 'אינדקס ספקים',
    venue: 'שיתופי פעולה', partner: 'שיתופי פעולה', collab: 'שיתופי פעולה',
    friend: 'חבר מביא חבר', referral: 'חבר מביא חבר'
  };
  var SUB = { an: 'רשת שותפים', msg: 'מסנג׳ר', messenger: 'מסנג׳ר' }; /* Meta {{site_source_name}} placements */
  var PAID = /(^|[^a-z])(paid|paidsocial|cpc|ppc|cpm|cpa|ads?|boost(ed)?|promo|sponsored)([^a-z]|$)/i;
  var ADS_NET = /^(אינסטגרם|פייסבוק|טיקטוק|גוגל|יוטיוב)$/;
  function cut(s, n) { return s == null || s === '' ? null : String(s).replace(/^\s+|\s+$/g, '').slice(0, n || 120) || null; }
  function low(s, n) { var v = cut(s, n); return v ? v.toLowerCase() : null; }
  function dec(s) { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); } }
  function qs(search) {
    var o = {}, s = String(search || '').replace(/^\?/, '');
    if (!s) return o;
    s.split('&').forEach(function (p) {
      var i = p.indexOf('='), k = dec(i < 0 ? p : p.slice(0, i)).toLowerCase(), v = i < 0 ? '' : dec(p.slice(i + 1));
      if (k && !(k in o)) o[k] = v;
    });
    return o;
  }
  function hostOf(ref) { var m = /^https?:\/\/([^\/?#:]+)/i.exec(ref || ''); return m ? m[1].toLowerCase().replace(/^www\./, '') : ''; }
  function netFromHost(h) {
    if (!h) return '';
    if (/(^|\.)instagram\.com$/.test(h)) return IG;
    if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h)) return FB;
    if (/(^|\.)tiktok\.com$/.test(h)) return TT;
    if (/(^|\.)google\.[a-z.]+$/.test(h) || /(^|\.)googleadservices\.com$/.test(h)) return GG;
    if (/(^|\.)youtube\.com$/.test(h)) return YT;
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return WA;
    return 'אחר: ' + h;
  }
  /* In-app browsers: Instagram puts "Instagram" in the user agent, Facebook/Messenger put FBAN/FBAV/FB_IAB. */
  function appOf(ua) {
    ua = String(ua || '');
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|\[FB/i.test(ua)) return 'facebook';
    return null;
  }
  /* Pure function: address parameters + referrer + user agent -> the touch, or null for a plain direct visit. */
  function classify(search, referrer, ownHost, ua) {
    var q = qs(search), src = low(q.utm_source, 60) || '', med = low(q.utm_medium, 60);
    var rh = hostOf(referrer), own = String(ownHost || '').toLowerCase().replace(/^www\./, '');
    if (rh && own && (rh === own || rh.slice(-(own.length + 1)) === '.' + own)) rh = '';
    var app = appOf(ua), appNet = app === 'instagram' ? IG : app === 'facebook' ? FB : '';
    var clickId = q.gclid || q.gbraid || q.wbraid ? 'gclid' : q.fbclid ? 'fbclid' : q.ttclid ? 'ttclid' : null;
    var net = '', sub = null, kind = null, how = '';
    if (src) {
      net = BY_SOURCE[src] || ('אחר: ' + src); sub = SUB[src] || null; how = 'utm';
      if (med) kind = PAID.test(med) ? PAID_T : ORG_T;
      else if (clickId === 'gclid' && net === GG) kind = PAID_T;
    } else if (clickId === 'gclid') { net = GG; kind = PAID_T; how = 'gclid'; }
    else if (clickId === 'ttclid') { net = TT; kind = PAID_T; how = 'ttclid'; }
    else if (clickId === 'fbclid') { net = appNet || (netFromHost(rh) === IG ? IG : FB); how = 'fbclid'; }
    else if (rh) { net = netFromHost(rh); how = 'referrer'; if (net === GG) kind = ORG_T; }
    else if (appNet) { net = appNet; how = 'app'; }
    if (!net) return null;
    if (!ADS_NET.test(net)) kind = null; /* partners, directories, friends: no paid/organic split */
    return {
      label: net + (sub ? ' — ' + sub : '') + (kind ? ' — ' + kind : ''), net: net, kind: kind, how: how,
      utm_source: src || null, utm_medium: med, utm_campaign: low(q.utm_campaign, 80),
      utm_content: low(q.utm_content, 80), utm_term: low(q.utm_term, 80),
      click_id: clickId, referrer_host: cut(rh, 80), app: app,
      landing: cut(typeof location !== 'undefined' ? location.pathname : '/', 80), at: new Date().toISOString()
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
  function touchName(t) { return t ? t.label + (t.utm_campaign ? ' — ' + t.utm_campaign : '') : ''; }
  function init() {
    try {
      var a = classify(location.search, document.referrer, location.hostname, navigator.userAgent);
      if (!a) return;
      var cur = read();
      write({ first: (cur && cur.first) || a, last: a });
    } catch (e) {}
  }
  /* The touch to save with a lead: the latest non-direct visit within 30 days, plus the first touch if it differs. */
  function get() {
    try {
      var o = read();
      if (!o || !o.last) return null;
      var r = {}, k;
      for (k in o.last) if (Object.prototype.hasOwnProperty.call(o.last, k)) r[k] = o.last[k];
      if (!r.net) { /* touch saved by v1 ("פייסבוק (ממומן)") */
        var paid = /\(ממומן\)$/.test(r.label || ''); r.net = String(r.label || '').replace(/\s*\(ממומן\)$/, '');
        r.kind = paid ? PAID_T : null; r.label = r.net + (paid ? ' — ' + PAID_T : '');
      }
      if (o.first && touchName(o.first) !== touchName(o.last)) { r.first_touch = touchName(o.first); r.first_at = o.first.at || null; }
      return r;
    } catch (e) { return null; }
  }
  /* Readable CRM source, e.g. "פייסבוק — ממומן — wedding_nov26". Direct visits: "אתר — כניסה ישירה". */
  function sourceText(a) {
    if (!a || !a.label) return 'אתר — כניסה ישירה';
    return String(touchName(a)).slice(0, 120);
  }
  window.SMS_ATTR = { get: get, classify: classify, sourceText: sourceText, appOf: appOf };
  init();
})();

/* ============================================================
   הגדרות האתר — זה הקובץ היחיד שצריך לערוך.
   ============================================================ */
window.SITE = {
  // מספר הוואטסאפ העסקי בפורמט בינלאומי, ספרות בלבד. לדוגמה: '972501234567'
  // כל עוד השדה ריק, הכפתור פותח וואטסאפ עם הודעה מוכנה ובחירה של איש קשר.
  WA_NUMBER: '972545435939',

  // חיבור טופס הלידים לשירות מיילים (לא חובה).
  // Formspree: הדביקו כאן את הכתובת, למשל 'https://formspree.io/f/xxxxxxxx'
  // כשהשדה ריק והאתר מאוחסן ב-Netlify, הטופס נשלח אוטומטית ל-Netlify Forms
  // (Site configuration → Forms) וניתן לקבל עליו התראה במייל.
  FORM_ENDPOINT: '',

  // חיבור הטופס ישירות ל-CRM (Supabase). הליד נכנס לכרטיסי הלקוחות עם מקור "אתר".
  // המפתח הציבורי (publishable) בטוח לחשיפה: הוא מאפשר רק הוספת ליד חדש ולא קריאה או שינוי.
  SUPABASE_URL: 'https://qrcdmcrhzhhqhfxxntjb.supabase.co',
  SUPABASE_KEY: 'sb_publishable_Cs-76ga4YG3GIBe2GVORbw_e4PdHk5o',

  DEFAULT_MSG: 'היי, אני מעוניין/ת בהצעה לבר באירוע.'
};

/* פרמטרים פנימיים של מחשבון הבר (מקודדים, אין צורך לגעת) */
window.SITE_CALC = 'eyJiIjp7InYiOjAuMzIsInciOjAuMTksImEiOjAuMjYsImciOjAuMDYsInQiOjAuMDQsImYiOjAuMTN9LCJyIjpbMS43LDEuMywxLDAuNzUsMC41NV0sInAiOls4LDEwXSwibCI6NywiZSI6NCwiYyI6NiwiayI6NDAwfQ==';

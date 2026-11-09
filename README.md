# אתר ש.מ.ש משקאות — הוראות העלאה

## העלאה ל-Netlify (חינם)
1. חלצו את קובץ ה-ZIP לתיקייה (חשוב: לא להעלות את ה-ZIP עצמו).
2. היכנסו ל-app.netlify.com ← Add new site ← Deploy manually.
3. גררו לשם את **התיקייה** שבה נמצא `index.html`.
4. תוך שניות מתקבלת כתובת `xxxx.netlify.app`. אפשר לשנות את השם ב-Site configuration ← Change site name.

## מה לערוך (קובץ אחד: `js/config.js`)
- `WA_NUMBER`: מספר וואטסאפ בפורמט בינלאומי, ספרות בלבד, למשל `972501234567`.
- `FORM_ENDPOINT`: כתובת Formspree (`https://formspree.io/f/xxxx`). אם משאירים ריק, הטופס נשלח ל-Netlify Forms.
- `DEFAULT_MSG`: ההודעה המוכנה בכפתורי הוואטסאפ.

## קבלת לידים במייל
- **Netlify Forms (ברירת מחדל):** Site configuration ← Forms ← Form notifications ← Add notification ← Email.
- **Formspree:** פתחו טופס בחשבון, הדביקו את הכתובת ב-`FORM_ENDPOINT`.

## דומיין פרטי
Domain management ← Add a domain. אחרי הרכישה Netlify מציג את רשומות ה-DNS לעדכון, ומוציא תעודת SSL אוטומטית.

## מבנה
`index.html` · `css/styles.css` · `js/app.js` · `js/config.js` · `assets/favicon.svg` · `_headers`

## החלפת הלוגו
הלוגו כרגע טיפוגרפי (קוד בלבד). כדי להחליף בלוגו מעוצב, החליפו את התוכן של `<a class="logo">` ב-`index.html` בתגית `<img>`.

## עריכת טקסט הבאנר התחתון
ב-`index.html`, חפשו `class="tk-it"` (הטקסטים מופיעים בשתי קבוצות זהות, יש לעדכן את שתיהן). מהירות התנועה: `animation: tk 320s` ב-`css/styles.css` (מספר גדול יותר = איטי יותר).

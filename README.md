# YOAVAVNI — קליניקת יואב אבני v2.0

מערכת ניהול קליניקה מלאה בעברית RTL

## שלבי פריסה ב-Vercel

### שלב 1 — העלה ל-GitHub
1. פתח GitHub.com → yoavavnipt/yoavavni-
2. לחץ על "Add file" → "Upload files"
3. גרור את כל הקבצים מה-ZIP הזה
4. לחץ "Commit changes"

### שלב 2 — הגדר Environment Variables ב-Vercel
1. פתח Vercel → פרויקט yoavavni
2. לחץ Settings → Environment Variables
3. הוסף:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://oawbtyhxenfynqinerck.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (מפתח anon מ-Supabase)

### שלב 3 — פרוס
Vercel יפרוס אוטומטית אחרי ה-commit

## מה בגרסה זו (v2.0)

- ✅ Next.js 14.2.29 (פתרון בעיית הפריסה)
- ✅ לוח בקרה עם KPIs
- ✅ ניהול מטופלים מלא (רשימה + פרופיל + עריכה)
- ✅ יומן תורים עם 8 סוגי שירות
- ✅ רשומות SOAP + VAS
- ✅ חיוב וקבלות + שליחת WhatsApp
- ✅ דוחות ואנליטיקס
- ✅ ניווט מובייל (PWA)

## מסד נתונים Supabase

טבלאות נדרשות (כבר קיימות):
- patients
- appointments
- treatment_records
- billing_records
- service_types
- exercise_videos

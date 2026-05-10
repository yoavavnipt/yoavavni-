'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState, useEffect } from 'react'

const FOOTER = `\n\nבברכה,\nקליניקת יואב אבני 🏥\n📍 רחוב התרשיש 8, גילון\n🌐 https://www.yoav-avni-clinic.com\n📸 https://www.instagram.com/yoavavni.pt`

const DEFAULT_TEMPLATES = [
  { id: 'physio_local', label: 'ברוך הבא — פיזיו גילון/צורית', icon: '👋',
    text: `בוקר טוב [שם] 😊\n\nקבענו טיפול פיזיותרפיה בתאריך [תאריך] בשעה [שעה]\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 330 ₪ לטיפול לתושבי גילון וצורית.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${FOOTER}` },
  { id: 'physio', label: 'ברוך הבא — פיזיו (רגיל)', icon: '🦴',
    text: `בוקר טוב [שם] 😊\n\nקבענו טיפול פיזיותרפיה בתאריך [תאריך] בשעה [שעה]\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 360 ₪ לטיפול.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${FOOTER}` },
  { id: 'hydro', label: 'ברוך הבא — פיזיותרפיה במים', icon: '💧',
    text: `בוקר טוב [שם] 😊\n\nקבענו טיפול פיזיותרפיה במים בתאריך [תאריך] בשעה [שעה]\nטיפול פיזיותרפיה במים אורך 60 דקות.\nעלות 340 ₪ לטיפול.\n\nנא להביא:\n🩱 בגד ים\n🏊 כובע ים (חובה)\n🧴 מגבת\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}` },
  { id: 'home', label: 'ברוך הבא — ביקור בית', icon: '🏠',
    text: `בוקר טוב [שם] 😊\n\nקבענו ביקור בית בתאריך [תאריך] בשעה [שעה]\nהטיפול אורך כ-60 דקות.\nעלות 400 ₪ לטיפול.\n\nאנא הכינו מקום נוח ומרווח לטיפול.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}` },
  { id: 'run_basic', label: 'קבוצת ריצה — חבילה היברידית (650₪)', icon: '🏃',
    text: `בוקר טוב [שם] 😊\n\nברוך הבא לחבילת ריצה היברידית! 🏃\n\nמה כלול:\n✅ מפגש פתיחה בקליניקה — אבחון + תכנון\n✅ תוכנית ריצה מותאמת אישית\n✅ מעקב שבועי וואטסאפ/אפליקציה\n✅ זמינות לשאלות\n✅ עדכון תוכנית לפי התקדמות\n\nעלות: 650 ₪ לחודש\n\nהמפגש הראשון בתאריך [תאריך] בשעה [שעה]${FOOTER}` },
  { id: 'run_plus', label: 'קבוצת ריצה — היברידית+ (1000₪)', icon: '🏃',
    text: `בוקר טוב [שם] 😊\n\nברוך הבא לחבילת ריצה היברידית+! 🏃\n\nמה כלול:\n✅ כל מה שבחבילה הבסיסית +\n✅ 2 אימוני ריצה קבוצתיים בשבוע\n✅ מעקב עומסים בתוך הקבוצה\n✅ תיקון טכניקה בזמן אמת\n\nעלות: 1,000 ₪ לחודש\n\nהמפגש הראשון בתאריך [תאריך] בשעה [שעה]${FOOTER}` },
  { id: 'run_premium', label: 'קבוצת ריצה — פרמיום (1500₪)', icon: '🏆',
    text: `בוקר טוב [שם] 😊\n\nברוך הבא לחבילת ריצה פרמיום! 🏆\n\nמה כלול:\n✅ כל מה שבחבילה 2 +\n✅ מפגש דו-חודשי בקליניקה\n✅ זמינות גבוהה יותר\n✅ מעקב עומסים מתקדם\n\nעלות: 1,500 ₪ לחודש\n\nהמפגש הראשון בתאריך [תאריך] בשעה [שעה]${FOOTER}` },
  { id: 'rehab_group', label: 'שיקום קבוצתי (140₪)', icon: '👥',
    text: `בוקר טוב [שם] 😊\n\nקבענו טיפול שיקום קבוצתי בתאריך [תאריך] בשעה [שעה]\nהטיפול אורך 60 דקות.\nעלות 140 ₪ למתאמן.\n\nנא להגיע עם בגדים נוחים.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}` },
  { id: 'ortho', label: 'מדרסים (1500₪)', icon: '🦿',
    text: `בוקר טוב [שם] 😊\n\nקבענו פגישה להתאמת מדרסים בתאריך [תאריך] בשעה [שעה]\nהפגישה אורכת כ-60 דקות.\nעלות: 1,500 ₪.\n\nנא להביא נעליים שאתה משתמש בהן בדרך כלל.${FOOTER}` },
  { id: 'assessment', label: 'אבחון ראשון חינם', icon: '🎯',
    text: `בוקר טוב [שם] 😊\n\nקבענו אבחון ראשון חינם בתאריך [תאריך] בשעה [שעה]\nהאבחון אורך כ-45 דקות (שווי 360 ₪ — ללא עלות!)\n\nנא להביא:\n📄 מכתב רופא אם יש\n📋 כל אינפורמציה רפואית רלוונטית\n\nמחכים לך! 😊${FOOTER}` },
  { id: 'reminder', label: 'תזכורת לתור', icon: '⏰',
    text: `שלום [שם] 😊\n\nתזכורת — יש לך תור מחר [תאריך] בשעה [שעה].\n\n📍 רחוב התרשיש 8, גילון\nלשינוי או ביטול — עד הערב ב-10:00.\n\nמחכים לך! 🙏\nקליניקת יואב אבני` },
  { id: 'payment', label: 'בקשת תשלום', icon: '💳',
    text: `שלום [שם],\n\nבקשת תשלום עבור טיפול.\nסכום לתשלום: ₪[סכום]\n\nניתן לשלם:\n💵 מזומן בקליניקה\n💳 אשראי בקליניקה\n📱 ביט / פייבוקס: 054-5953889\n\nתודה! 🙏\nקליניקת יואב אבני` },
  { id: 'exercises', label: 'תרגילי בית', icon: '🏋️',
    text: `שלום [שם] 😊\n\nמצורפים תרגילי הבית שלך לביצוע עד הטיפול הבא.\nחשוב לבצע אותם כפי שהסברתי — כל יום או יומיים! 💪\n\nלשאלות — אני כאן.\nקליניקת יואב אבני` },
  { id: 'book_again', label: 'תזכורת לתור נוסף', icon: '📅',
    text: `שלום [שם] 😊\n\nרציתי להזכיר — חשוב לשמור על רצף הטיפולים להחלמה מיטבית!\n\nלקביעת תור נוסף:\n📞 054-5953889\n🌐 https://www.yoav-avni-clinic.com\n\nנשמח לראותך בקרוב! 💪\nקליניקת יואב אבני` },
]

const STORAGE_KEY = 'yoavavni_templates'

function loadTemplates() {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_TEMPLATES
}

function saveTemplates(templates: typeof DEFAULT_TEMPLATES) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)) } catch {}
}

export function getTemplates() {
  return loadTemplates()
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [selected, setSelected] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [])

  function selectTemplate(id: string) {
    setSelected(id)
    const t = templates.find(x => x.id === id)
    setEditText(t?.text || '')
    setSaved(false)
  }

  function saveTemplate() {
    const updated = templates.map(t => t.id === selected ? { ...t, text: editText } : t)
    setTemplates(updated)
    saveTemplates(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function resetTemplate() {
    const def = DEFAULT_TEMPLATES.find(x => x.id === selected)
    if (def) { setEditText(def.text); setSaved(false) }
  }

  const selectedTemplate = templates.find(x => x.id === selected)

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>✏️ עריכת תבניות הודעה</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            לחץ על תבנית לעריכה. השתמש ב-[שם], [תאריך], [שעה], [סכום] — יוחלפו אוטומטית
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
          {/* Template list */}
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: 'fit-content' }}>
            {templates.map((t, i) => (
              <div
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  borderBottom: i < templates.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: selected === t.id ? '#f0f9ff' : '#fff',
                  borderRight: selected === t.id ? '3px solid #3eb8e5' : '3px solid transparent',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (selected !== t.id) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (selected !== t.id) e.currentTarget.style.background = '#fff' }}
              >
                <div style={{ fontSize: '13px', fontWeight: selected === t.id ? '700' : '500', color: '#1e293b' }}>
                  {t.icon} {t.label}
                </div>
              </div>
            ))}
          </div>

          {/* Editor */}
          {selected ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a3a5c' }}>
                    {selectedTemplate?.icon} {selectedTemplate?.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    השתמש ב: [שם] [תאריך] [שעה] [סכום]
                  </div>
                </div>
                <button onClick={resetTemplate} style={{
                  padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
                  background: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', color: '#64748b'
                }}>
                  🔄 איפוס לברירת מחדל
                </button>
              </div>

              <textarea
                value={editText}
                onChange={e => { setEditText(e.target.value); setSaved(false) }}
                style={{
                  width: '100%', minHeight: '300px', padding: '14px',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '13px', lineHeight: '1.7', resize: 'vertical',
                  fontFamily: 'Heebo, sans-serif', outline: 'none',
                  background: '#f8fffe', direction: 'rtl',
                }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={saveTemplate} style={{
                  flex: 1, padding: '11px',
                  background: saved ? '#0b8a5e' : '#1a3a5c',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                }}>
                  {saved ? '✅ נשמר!' : '💾 שמור תבנית'}
                </button>
              </div>

              <div style={{ marginTop: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>תצוגה מקדימה:</div>
                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', direction: 'rtl' }}>
                  {editText.replace('[שם]', 'ישראל כהן').replace('[תאריך]', '15.5.2026').replace('[שעה]', '09:00').replace('[סכום]', '360')}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✏️</div>
              <div>בחר תבנית לעריכה</div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

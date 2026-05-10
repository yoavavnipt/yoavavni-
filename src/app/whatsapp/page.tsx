'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

const CLINIC_FOOTER = `
בברכה,
קליניקת יואב אבני 🏥
📍 רחוב התרשיש 8, גילון
🌐 https://www.yoav-avni-clinic.com
📸 https://www.instagram.com/yoavavni.pt`

const TEMPLATES = [
  {
    id: 'welcome_physio_local',
    label: 'ברוך הבא — פיזיו (גילון/צורית)',
    icon: '👋',
    color: '#1e4a7a',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול פיזיותרפיה בתאריך ${d} בשעה ${t}\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 330 ₪ לטיפול לתושבי גילון וצורית.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${CLINIC_FOOTER}`
  },
  {
    id: 'welcome_physio',
    label: 'ברוך הבא — פיזיו (רגיל)',
    icon: '🦴',
    color: '#1e4a7a',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול פיזיותרפיה בתאריך ${d} בשעה ${t}\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 350 ₪ לטיפול.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${CLINIC_FOOTER}`
  },
  {
    id: 'welcome_hydro',
    label: 'ברוך הבא — הידרותרפיה',
    icon: '💧',
    color: '#0891b2',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול הידרותרפיה בתאריך ${d} בשעה ${t}\nטיפול הידרותרפיה אורך 60 דקות.\nעלות 420 ₪ לטיפול.\n\nנא להביא:\n🩱 בגד ים\n🏊 כובע ים (חובה)\n🧴 מגבת\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${CLINIC_FOOTER}`
  },
  {
    id: 'welcome_home',
    label: 'ברוך הבא — ביקור בית',
    icon: '🏠',
    color: '#0b8a5e',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו ביקור בית בתאריך ${d} בשעה ${t}\nהטיפול אורך כ-60 דקות.\nעלות 550 ₪ לטיפול.\n\nאנא הכינו מקום נוח ומרווח לטיפול.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${CLINIC_FOOTER}`
  },
  {
    id: 'welcome_sport',
    label: 'ברוך הבא — שיקום ספורטיבי',
    icon: '⚽',
    color: '#c2410c',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול שיקום ספורטיבי בתאריך ${d} בשעה ${t}\nהטיפול אורך 45 דקות.\nעלות 380 ₪ לטיפול.\n\nנא להגיע עם בגדים ספורטיביים נוחים.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${CLINIC_FOOTER}`
  },
  {
    id: 'welcome_online',
    label: 'ברוך הבא — ייעוץ אונליין',
    icon: '💻',
    color: '#065f46',
    getMsg: (p: any, d: string, t: string) =>
      `בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו ייעוץ אונליין בתאריך ${d} בשעה ${t}\nהייעוץ אורך כ-30 דקות.\nעלות 280 ₪.\n\nהפגישה תתקיים בוידאו — אשלח לך קישור לפני הפגישה.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${CLINIC_FOOTER}`
  },
  {
    id: 'reminder',
    label: 'תזכורת לתור',
    icon: '⏰',
    color: '#7c3aed',
    getMsg: (p: any, d: string, t: string) =>
      `שלום ${p.first_name} ${p.last_name} 😊\n\nתזכורת — יש לך תור מחר ${d} בשעה ${t}.\n\n📍 רחוב התרשיש 8, גילון\nלשינוי או ביטול — עד הערב ב-10:00.\n\nמחכים לך! 🙏\nקליניקת יואב אבני`
  },
  {
    id: 'payment',
    label: 'בקשת תשלום',
    icon: '💳',
    color: '#0b8a5e',
    getMsg: (p: any, _d: string, _t: string, amount?: string) =>
      `שלום ${p.first_name} ${p.last_name},\n\nבקשת תשלום עבור טיפול.\nסכום לתשלום: ₪${amount || '___'}\n\nניתן לשלם:\n💵 מזומן בקליניקה\n💳 אשראי בקליניקה\n📱 ביט / פייבוקס: 054-5953889\n\nתודה! 🙏\nקליניקת יואב אבני`
  },
  {
    id: 'exercises',
    label: 'תרגילי בית',
    icon: '🏋️',
    color: '#854d0e',
    getMsg: (p: any) =>
      `שלום ${p.first_name} ${p.last_name} 😊\n\nמצורפים תרגילי הבית שלך לביצוע עד הטיפול הבא.\nחשוב לבצע אותם כפי שהסברתי — כל יום או יומיים! 💪\n\nלשאלות — אני כאן.\nקליניקת יואב אבני`
  },
  {
    id: 'book_again',
    label: 'תזכורת לתור נוסף',
    icon: '📅',
    color: '#3eb8e5',
    getMsg: (p: any) =>
      `שלום ${p.first_name} ${p.last_name} 😊\n\nרציתי להזכיר — חשוב לשמור על רצף הטיפולים להחלמה מיטבית!\n\nלקביעת תור נוסף:\n📞 054-5953889\n🌐 https://www.yoav-avni-clinic.com\n\nנשמח לראותך בקרוב! 💪\nקליניקת יואב אבני`
  },
]

export default function WAPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>}>
      <WAPage />
    </Suspense>
  )
}

function WAPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const patientId = searchParams.get('patient')

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (patientId) {
      supabase.from('patients').select('*').eq('id', patientId).single().then(({ data }) => {
        setPatient(data)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [patientId])

  function selectTemplate(id: string) {
    setSelected(id)
    const tmpl = TEMPLATES.find(t => t.id === id)
    if (!tmpl || !patient) return
    const d = date || '___'
    const t = time || '___'
    setMessage(tmpl.getMsg(patient, d, t, amount))
  }

  function updateMessage(id: string) {
    const tmpl = TEMPLATES.find(t => t.id === id)
    if (!tmpl || !patient) return
    const d = date || '___'
    const t = time || '___'
    setMessage(tmpl.getMsg(patient, d, t, amount))
  }

  function send() {
    if (!patient?.phone || !message) return
    const phone = patient.phone.replace(/^0/, '').replace(/-/g, '')
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) return <AppLayout><div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div></AppLayout>

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '640px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>💬 שליחת WhatsApp</h1>
            {patient && (
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {patient.first_name} {patient.last_name} · {patient.phone}
              </div>
            )}
          </div>
        </div>

        {/* Template grid */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            בחר תבנית הודעה
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelected(t.id); selectTemplate(t.id) }}
                style={{
                  padding: '10px 12px',
                  border: `2px solid ${selected === t.id ? t.color : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: selected === t.id ? `${t.color}10` : '#fff',
                  cursor: 'pointer', textAlign: 'right',
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: '12px',
                  fontWeight: selected === t.id ? '700' : '400',
                  color: '#1e293b',
                  transition: 'all 0.15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date/Time/Amount */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תאריך</label>
                <input type="date" value={date}
                  onChange={e => { setDate(e.target.value); setTimeout(() => updateMessage(selected), 0) }}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>שעה</label>
                <input type="time" value={time}
                  onChange={e => { setTime(e.target.value); setTimeout(() => updateMessage(selected), 0) }}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
              </div>
              {selected === 'payment' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>סכום ₪</label>
                  <input type="number" value={amount} placeholder="350"
                    onChange={e => { setAmount(e.target.value); setTimeout(() => updateMessage(selected), 0) }}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message preview */}
        {message && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              תצוגה מקדימה — ניתן לערוך
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                width: '100%', minHeight: '220px', padding: '12px',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                fontSize: '13px', lineHeight: '1.7', resize: 'vertical',
                fontFamily: 'Heebo, sans-serif', outline: 'none',
                background: '#f8fffe', direction: 'rtl',
              }}
            />
          </div>
        )}

        {/* Send button */}
        <button
          onClick={send}
          disabled={!message}
          style={{
            width: '100%', padding: '14px',
            background: message ? '#25d366' : '#94a3b8',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '800', cursor: message ? 'pointer' : 'not-allowed',
            fontFamily: 'Heebo, sans-serif',
            boxShadow: message ? '0 4px 12px rgba(37,211,102,0.3)' : 'none',
          }}
        >
          📤 שלח ב-WhatsApp
        </button>
      </div>
    </AppLayout>
  )
}

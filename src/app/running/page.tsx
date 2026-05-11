'use client'
import { useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const PACKAGES = [
  {
    id: 'run_basic',
    name: 'היברידית',
    price: 650,
    paylink: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TL4Bx',
    color: '#1e4a7a',
    highlight: false,
    includes: [
      'מפגש פתיחה בקליניקה — אבחון + תכנון',
      'תוכנית ריצה מותאמת אישית',
      'מעקב שבועי WhatsApp / אפליקציה',
      'זמינות לשאלות',
      'עדכון תוכנית לפי התקדמות',
    ],
    ideal: 'מתאים לרצים שרוצים תוכנית מובנית עם ליווי מקצועי מרחוק',
  },
  {
    id: 'run_plus',
    name: 'היברידית+',
    price: 1000,
    paylink: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TMBia',
    color: '#3eb8e5',
    highlight: true,
    includes: [
      'כל מה שבחבילה הבסיסית +',
      '2 אימוני ריצה קבוצתיים בשבוע',
      'מעקב עומסים בתוך הקבוצה',
      'תיקון טכניקה בזמן אמת',
      'קהילת רצים תומכת',
    ],
    ideal: 'מתאים לרצים שרוצים גם אימון קבוצתי עם מרכיב חברתי',
  },
  {
    id: 'run_premium',
    name: 'פרמיום',
    price: 1500,
    paylink: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TMJ68',
    color: '#1a3a5c',
    highlight: false,
    includes: [
      'כל מה שבחבילה 2 +',
      'מפגש דו-חודשי בקליניקה',
      'זמינות גבוהה יותר',
      'מעקב עומסים מתקדם',
      'ניתוח ביצועים מפורט',
    ],
    ideal: 'מתאים לרצים רציניים שרוצים את רמת הליווי הגבוהה ביותר',
  },
]

export default function RunningPage() {
  const [form, setForm] = useState({ name: '', phone: '', goal: '', package: '' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activePackage, setActivePackage] = useState<string | null>(null)

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function submit() {
    if (!form.name || !form.phone) { alert('יש למלא שם וטלפון'); return }
    setSaving(true)

    // Save as lead
    await supabase.from('patients').insert([{
      first_name: form.name.split(' ')[0],
      last_name: form.name.split(' ').slice(1).join(' ') || '',
      phone: form.phone,
      status: 'lead',
      notes: `ליד קבוצת ריצה\nחבילה: ${form.package || 'לא נבחר'}\nמטרה: ${form.goal}`,
      diagnosis: 'קבוצת ריצה',
    }])

    // Open WhatsApp to clinic
    const msg = encodeURIComponent(
      `🏃 ליד חדש — קבוצת ריצה!\n\nשם: ${form.name}\nטלפון: ${form.phone}\nחבילה: ${form.package || 'לא נבחר'}\nמטרה: ${form.goal}`
    )
    setTimeout(() => window.open(`https://wa.me/972545953889?text=${msg}`, '_blank'), 500)

    setSaving(false)
    setSubmitted(true)
  }

  return (
    <div style={{ fontFamily: 'Heebo, sans-serif', direction: 'rtl', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2240 100%)',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Nav */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="https://www.yoav-avni-clinic.com" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
            </div>
          </a>
          <a href="https://www.yoav-avni-clinic.com" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>
            ← חזור לאתר
          </a>
        </div>

        {/* Hero */}
        <div style={{ padding: '60px 24px 80px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(62,184,229,0.15)', border: '1px solid rgba(62,184,229,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3eb8e5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>קבוצת ריצה — יואב אבני PT</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', lineHeight: '1.2', marginBottom: '20px', letterSpacing: '-1px' }}>
            תרוץ חכם יותר.<br />
            <span style={{ color: '#3eb8e5' }}>השתפר מהר יותר.</span><br />
            תישאר בריא.
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
            תוכנית ריצה מקצועית בליווי פיזיותרפיסט. לא עוד פציעות, לא עוד תקרות זכוכית — תוכנית מותאמת אישית שמביאה תוצאות אמיתיות.
          </p>
          <a href="#packages" style={{
            display: 'inline-block', padding: '16px 36px',
            background: '#3eb8e5', color: '#fff', borderRadius: '12px',
            fontSize: '16px', fontWeight: '800', textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(62,184,229,0.4)',
          }}>
            בחר חבילה ←
          </a>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 60" style={{ display: 'block', marginBottom: '-2px' }}>
          <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* Why section */}
      <div style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>למה קבוצת ריצה עם פיזיותרפיסט?</h2>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '40px', lineHeight: '1.7' }}>
          רוב הרצים מתאמנים בלי מעקב מקצועי — ומגיעים לפציעה. אנחנו משלבים תכנון מדעי, מעקב עומסים, ותיקון טכניקה כדי שתשיג את המטרות שלך בצורה בטוחה.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
          {[
            { icon: '🎯', title: 'תוכנית אישית', text: 'לא תוכנית גנרית מהאינטרנט — תוכנית שמותאמת לגוף שלך, לרמה שלך, למטרות שלך' },
            { icon: '📊', title: 'מעקב עומסים', text: 'ניטור שבועי של עומס האימון למניעת פציעות יתר' },
            { icon: '🏥', title: 'ליווי רפואי', text: 'גישה ישירה לפיזיותרפיסט — כל שאלה, כל כאב, תשובה מקצועית מיידית' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a3a5c', marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div id="packages" style={{ padding: '20px 24px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c', marginBottom: '8px' }}>בחר את החבילה המתאימה לך</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>כל החבילות כוללות ליווי אישי מיואב אבני PT</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '48px' }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.id} onClick={() => setActivePackage(pkg.id)} style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              border: `2px solid ${activePackage === pkg.id ? pkg.color : pkg.highlight ? pkg.color : '#e2e8f0'}`,
              boxShadow: pkg.highlight ? `0 8px 32px rgba(62,184,229,0.2)` : '0 2px 12px rgba(0,0,0,0.06)',
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              transform: pkg.highlight ? 'scale(1.02)' : 'scale(1)',
            }}>
              {pkg.highlight && (
                <div style={{ background: pkg.color, padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#fff' }}>
                  ⭐ הכי פופולרי
                </div>
              )}
              <div style={{ padding: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: pkg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>חבילה</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#1a3a5c', marginBottom: '4px' }}>{pkg.name}</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: pkg.color, marginBottom: '4px' }}>₪{pkg.price.toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '20px' }}>לחודש</div>
                <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', lineHeight: '1.5', fontStyle: 'italic' }}>
                  {pkg.ideal}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pkg.includes.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#374151' }}>
                      <span style={{ color: pkg.color, flexShrink: 0, fontWeight: '700' }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {activePackage === pkg.id && (
                <div style={{ padding: '12px 24px', background: `${pkg.color}10`, borderTop: `1px solid ${pkg.color}30`, textAlign: 'center', fontSize: '12px', fontWeight: '700', color: pkg.color }}>
                  ✅ נבחר — מלא פרטים למטה
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lead form */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '560px', margin: '0 auto' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c', marginBottom: '8px' }}>קיבלנו את הפרטים!</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.7' }}>
                יואב יחזור אליך בהקדם לשיחה קצרה כדי להכיר ולוודא שהתוכנית מתאימה לך.
              </p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a5c', marginBottom: '6px', textAlign: 'center' }}>
                השאר פרטים ונחזור אליך
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '24px' }}>
                לפני ההצטרפות נקיים שיחה קצרה כדי לוודא שהתוכנית נכונה לך
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}>שם מלא *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ישראל כהן"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}>טלפון *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'right' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}>חבילה מועדפת</label>
                  <select value={form.package} onChange={e => set('package', e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', background: '#fff' }}>
                    <option value="">לא בטוח עדיין</option>
                    <option value="היברידית — ₪650">היברידית — ₪650</option>
                    <option value="היברידית+ — ₪1,000">היברידית+ — ₪1,000</option>
                    <option value="פרמיום — ₪1,500">פרמיום — ₪1,500</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}>מה המטרה שלך?</label>
                  <textarea value={form.goal} onChange={e => set('goal', e.target.value)}
                    placeholder="לדוגמה: לרוץ 10 ק&quot;מ ללא עצירות, לחזור לריצה אחרי פציעה, לשפר זמן..."
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', minHeight: '80px', resize: 'vertical' }} />
                </div>
                <button onClick={submit} disabled={saving} style={{
                  width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#1a3a5c',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: '16px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'Heebo, sans-serif', marginTop: '4px',
                  boxShadow: '0 4px 14px rgba(26,58,92,0.3)',
                }}>
                  {saving ? '⏳ שולח...' : 'שלח פרטים ←'}
                </button>
                <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                  יואב יחזור אליך תוך 24 שעות לשיחת היכרות קצרה
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1a3a5c', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
          <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI — קליניקת יואב אבני
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          תרשיש 8, גילון · 054-5953889 · <a href="https://www.yoav-avni-clinic.com" style={{ color: '#3eb8e5' }}>yoav-avni-clinic.com</a>
        </div>
      </div>
    </div>
  )
}

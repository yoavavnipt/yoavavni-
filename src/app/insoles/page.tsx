'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const PACKAGES = [
  {
    id: 'insoles_basic',
    name: 'מדרס בסיסי',
    price: 1500,
    color: '#1e4a7a',
    highlight: false,
    includes: [
      'סריקת כף רגל עם Albert Pressure',
      'ניתוח לחצים וקשת',
      'מדרס מותאם אישית',
      'הדרכה להנעלה נכונה',
    ],
    ideal: 'מתאים לכאבי כרית / עקב / פלטפוס — מדרס בסיסי בהתאמה אישית',
  },
  {
    id: 'insoles_sport',
    name: 'מדרס ספורט',
    price: 1800,
    color: '#3eb8e5',
    highlight: true,
    includes: [
      'סריקה סטטית + דינמית (הליכה)',
      'ניתוח מרכז כובד בזמן אמת',
      'מדרס ספורט בהתאמה אישית',
      'הדרכה לביצועים מיטביים',
      'מעקב חודש אחרי קבלה',
    ],
    ideal: 'מתאים לרצים, ספורטאים, ואנשים עם פציעות ספורט חוזרות',
  },
  {
    id: 'insoles_premium',
    name: 'פרמיום + ייעוץ',
    price: 2200,
    color: '#1a3a5c',
    highlight: false,
    includes: [
      'כל מה שבחבילת הספורט +',
      'פגישת ייעוץ פיזיותרפיה מלאה',
      'בדיקת כל גוף — ברך, ירך, גב',
      'תוכנית טיפולית כוללת',
      'מעקב 3 חודשים',
    ],
    ideal: 'מתאים למי שסובל מכאבים מרובים ורוצה פתרון כולל ומקיף',
  },
]

export default function InsolesPage() {
  const [form, setForm] = useState({ name: '', phone: '', complaint: '', package: '' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activePackage, setActivePackage] = useState<string | null>(null)

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function submit() {
    if (!form.name || !form.phone) { alert('יש למלא שם וטלפון'); return }
    setSaving(true)

    await supabase.from('patients').insert([{
      first_name: form.name.split(' ')[0],
      last_name: form.name.split(' ').slice(1).join(' ') || '',
      phone: form.phone,
      status: 'lead',
      notes: `ליד מדרסים\nחבילה: ${form.package || 'לא נבחר'}\nתלונה: ${form.complaint}`,
      diagnosis: 'מדרסים אורטופדיים',
    }])

    const msg = encodeURIComponent(
      `👟 ליד חדש — מדרסים!\n\nשם: ${form.name}\nטלפון: ${form.phone}\nחבילה: ${form.package || 'לא נבחר'}\nתלונה: ${form.complaint}`
    )
    setTimeout(() => window.open(`https://wa.me/972545953889?text=${msg}`, '_blank'), 500)

    setSaving(false)
    setSubmitted(true)
  }

  return (
    <div style={{ fontFamily: 'Heebo, sans-serif', direction: 'rtl', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2240 100%)', padding: '0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="https://www.yoav-avni-clinic.com" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
            </div>
          </a>
          <a href="https://www.yoav-avni-clinic.com" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none' }}>← חזור לאתר</a>
        </div>

        <div style={{ padding: '60px 24px 80px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(62,184,229,0.15)', border: '1px solid rgba(62,184,229,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3eb8e5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>מדרסים אורטופדיים — סריקה דיגיטלית</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', lineHeight: '1.2', marginBottom: '20px', letterSpacing: '-1px' }}>
            מדרס שבנוי<br />
            <span style={{ color: '#3eb8e5' }}>בדיוק בשבילך.</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
            בעזרת סורק Albert Pressure של אאטרקס — 5,184 חיישנים שמנתחים את כפות הרגליים שלך בדיוק של מילימטר. לא מדרס מהמדף. מדרס שמותאם לגוף שלך.
          </p>
          <a href="#packages" style={{ display: 'inline-block', padding: '16px 36px', background: '#3eb8e5', color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: '800', textDecoration: 'none', boxShadow: '0 8px 24px rgba(62,184,229,0.4)' }}>
            לסריקה ומדרס ←
          </a>
        </div>

        <svg viewBox="0 0 1440 60" style={{ display: 'block', marginBottom: '-2px' }}>
          <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" fill="#f8fafc" />
        </svg>
      </div>

      {/* Albert Pressure section */}
      <div style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>סורק Albert Pressure — הטכנולוגיה שמאחורי המדרס</h2>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '40px', lineHeight: '1.7' }}>
          הסורק של אאטרקס כולל למעלה מ-5,000 חיישנים מצופי זהב שמנתחים את פיזור הלחצים בכפות הרגליים — גם בעמידה וגם בהליכה. הנתונים מעובדים בזמן אמת ומייצרים מדרס שמותאם בדיוק לבעיה שלך.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '20px' }}>
          {[
            { icon: '📡', title: '5,184 חיישנים', text: 'חיישנים ברומטריים מצופי זהב למדידה מדויקת של כל נקודת לחץ' },
            { icon: '🏃', title: 'סריקה דינמית', text: 'ניתוח הליכה ב-30 פריימים לשנייה — רואים את הרגל בתנועה אמיתית' },
            { icon: '☁️', title: 'ניתוח AI', text: 'הנתונים מעובדים בענן ומייצרים המלצה מדויקת לסוג המדרס הנכון' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a3a5c', marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{f.text}</div>
            </div>
          ))}
        </div>

        {/* בעיות שמדרס פותר */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'right', marginTop: '20px' }}>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#1a3a5c', marginBottom: '16px', textAlign: 'center' }}>👟 לאיזה בעיות מדרסים מתאים?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              'כאבי עקב ודורבן', 'פלטפוס (קשת שטוחה)', 'הולפוס (קשת גבוהה)',
              'כאבי ברך וירך', 'כאבי גב תחתון', 'הלוקס ולגוס (בוניון)',
              'כאבי כרית כף הרגל', 'פציעות ריצה חוזרות',
            ].map(p => (
              <div key={p} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#374151' }}>
                <span style={{ color: '#3eb8e5', fontWeight: '700', flexShrink: 0 }}>✓</span> {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages */}
      <div id="packages" style={{ padding: '20px 24px 60px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1a3a5c', marginBottom: '8px' }}>בחר חבילת מדרסים</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>כולל סריקה דיגיטלית עם Albert Pressure</p>
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
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '20px' }}>תשלום חד פעמי</div>
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
                יואב יחזור אליך בהקדם לתיאום מועד לסריקה.
              </p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a5c', marginBottom: '6px', textAlign: 'center' }}>
                השאר פרטים לתיאום סריקה
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginBottom: '24px' }}>
                נחזור אליך תוך 24 שעות לתיאום מועד
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
                    <option value="מדרס בסיסי — ₪1,500">מדרס בסיסי — ₪1,500</option>
                    <option value="מדרס ספורט — ₪1,800">מדרס ספורט — ₪1,800</option>
                    <option value="פרמיום + ייעוץ — ₪2,200">פרמיום + ייעוץ — ₪2,200</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase' }}>מה מטריד אותך?</label>
                  <textarea value={form.complaint} onChange={e => set('complaint', e.target.value)}
                    placeholder="לדוגמה: כאב עקב, פלטפוס, כאבי ברך בריצה..."
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
                  יואב יחזור אליך תוך 24 שעות לתיאום מועד לסריקה
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

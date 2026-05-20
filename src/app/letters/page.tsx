'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

// ── סוגי מכתבים ──────────────────────────────────────────────
const LETTER_TYPES = [
  { id: 'session_summary',  icon: '📋', label: 'אישור קיום טיפול' },
  { id: 'rehab_summary',    icon: '🏥', label: 'סיכום שיקומי' },
  { id: 'profile_upgrade',  icon: '⭐', label: 'המלצה להעלאת פרופיל' },
  { id: 'injury_report',    icon: '🚨', label: 'דיווח פציעה' },
]

// ── לוגו (ייובא מהמשתנה הקיים בפרויקט) ──────────────────────
// הלוגו מגיע מ-LOGO_B64 שמוגדר בקובץ המקורי שלך — החלף את השורה הבאה בלוגו שלך
const LOGO_B64 = '' // ← הדבק כאן את ה-base64 מהקובץ המקורי

// ── סגנונות ──────────────────────────────────────────────────
const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', background: '#fafbfc', direction: 'rtl' }
const ta:  React.CSSProperties = { ...inp, minHeight: '80px', resize: 'vertical' as const }

// ── קומפוננטה ראשית ──────────────────────────────────────────
export default function LettersPage() {
  const [patients,         setPatients]         = useState<any[]>([])
  const [selectedPatient,  setSelectedPatient]  = useState<any>(null)
  const [letterType,       setLetterType]       = useState('session_summary')
  const [patientSearch,    setPatientSearch]    = useState('')
  const [generating,       setGenerating]       = useState(false)
  const [aiLoading,        setAiLoading]        = useState(false)
  const [aiStatus,         setAiStatus]         = useState('')

  const [form, setForm] = useState({
    date: new Date().toLocaleDateString('he-IL'),
    diagnosis: '',
    treatment_summary: '',
    current_status: '',
    recommendations: '',
    injury_date: '', injury_day: '', injury_time: '', injury_location: '',
    activity_type: '', opponent: '', injury_description: '', first_aid: '',
    referral: '', next_steps: '',
    treatment_start: '', rehab_details: '', current_capabilities: '',
    recommendation_text: '', recipient: '',
  })

  useEffect(() => { loadPatients() }, [])

  async function loadPatients() {
    const { data } = await supabase
      .from('patients')
      .select('id,first_name,last_name,id_number,phone,diagnosis,date_of_birth,intake_notes')
      .eq('status', 'active')
      .order('first_name')
    setPatients(data || [])
  }

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.includes(patientSearch) || p.phone?.includes(patientSearch)
  )

  // ── שליפת SOAP מ-Supabase ────────────────────────────────
  async function fetchSOAPNotes(patientId: string) {
    const { data } = await supabase
      .from('treatment_records')
      .select('date,subjective,objective,assessment,plan,vas_score,treatment_given,home_exercises,flexion_degrees,extension_degrees,notes')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .limit(20)
    return data || []
  }

  // ── מילוי אוטומטי עם AI ──────────────────────────────────
  async function fillWithAI() {
    if (!selectedPatient) { alert('יש לבחור מטופל'); return }

    setAiLoading(true)
    setAiStatus('שולף רשומות טיפול...')

    try {
      // 1. שליפת SOAP
      const soapNotes = await fetchSOAPNotes(selectedPatient.id)

      if (soapNotes.length === 0) {
        alert('לא נמצאו רשומות טיפול עבור מטופל זה')
        setAiLoading(false)
        setAiStatus('')
        return
      }

      setAiStatus('ה-AI קורא את הרשומות ומייצר טיוטה...')

      // 2. בניית הפרומפט
      const p = selectedPatient
      const soapText = soapNotes.map((s: any, i: number) => `
טיפול ${i + 1} (${s.date}):
- VAS: ${s.vas_score ?? 'לא דווח'}
- S (סובייקטיבי): ${s.subjective || 'לא מולא'}
- O (אובייקטיבי): ${s.objective || 'לא מולא'}
- A (הערכה): ${s.assessment || 'לא מולא'}
- P (תוכנית): ${s.plan || 'לא מולא'}
- טיפול שניתן: ${s.treatment_given || 'לא מולא'}
- תרגילי בית: ${s.home_exercises || 'לא מולא'}
${s.flexion_degrees ? `- כפיפה: ${s.flexion_degrees}°` : ''}
${s.extension_degrees ? `- פשיטה: ${s.extension_degrees}°` : ''}
${s.notes ? `- הערות: ${s.notes}` : ''}
      `.trim()).join('\n\n---\n\n')

      const letterTypeLabel = LETTER_TYPES.find(t => t.id === letterType)?.label || letterType

      const systemPrompt = `אתה פיזיותרפיסט מנוסה ועוזר ליואב אבני, פיזיותרפיסט בקליניקה פרטית בגילון.
תפקידך לקרוא רשומות SOAP ולמלא שדות מכתב רפואי מקצועי בעברית.
החזר JSON בלבד, ללא קוד markdown, ללא הקדמה.`

      const userPrompt = `מטופל: ${p.first_name} ${p.last_name}
אבחנה קיימת: ${p.diagnosis || 'לא מוגדר'}
סוג מכתב: ${letterTypeLabel}
מספר טיפולים: ${soapNotes.length}
תאריך ראשון: ${soapNotes[soapNotes.length - 1]?.date}
תאריך אחרון: ${soapNotes[0]?.date}

רשומות SOAP:
${soapText}

בהתבסס על המידע לעיל, מלא את השדות הבאים ב-JSON:
{
  "diagnosis": "אבחנה/בעיה ראשית (משפט קצר)",
  "treatment_start": "חודש ושנה של תחילת הטיפול",
  "rehab_details": "שורה אחת לכל פעולת שיקול שבוצעה (מופרדת בירידת שורה \\n)",
  "current_status": "שורה אחת לכל פריט במצב הנוכחי (מופרדת בירידת שורה \\n)",
  "treatment_summary": "תיאור קצר של הטיפול שניתן (2-3 משפטים)",
  "recommendations": "המלצות להמשך (1-2 משפטים)",
  "recommendation_text": "נוסח המלצה להעלאת פרופיל אם רלוונטי"
}`

      // 3. קריאה ל-API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.map((c: any) => c.text || '').join('') || ''

      // 4. פירסוג JSON
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      // 5. עדכון הטופס
      setForm(f => ({
        ...f,
        diagnosis:          parsed.diagnosis          || f.diagnosis,
        treatment_start:    parsed.treatment_start    || f.treatment_start,
        rehab_details:      parsed.rehab_details      || f.rehab_details,
        current_status:     parsed.current_status     || f.current_status,
        treatment_summary:  parsed.treatment_summary  || f.treatment_summary,
        recommendations:    parsed.recommendations    || f.recommendations,
        recommendation_text: parsed.recommendation_text || f.recommendation_text,
      }))

      setAiStatus('✅ הטיוטה מוכנה — אפשר לערוך לפני ההפקה')
      setTimeout(() => setAiStatus(''), 4000)

    } catch (err) {
      console.error(err)
      setAiStatus('❌ שגיאה — נסה שוב')
      setTimeout(() => setAiStatus(''), 3000)
    }

    setAiLoading(false)
  }

  // ── הפקת מכתב ────────────────────────────────────────────
  function generateLetter() {
    if (!selectedPatient) { alert('יש לבחור מטופל'); return }
    setGenerating(true)

    const p = selectedPatient
    const fullName = `${p.first_name} ${p.last_name}`
    const today = new Date().toLocaleDateString('he-IL')

    let letterHTML = ''

    if (letterType === 'session_summary') {
      letterHTML = `
        <h2 style="text-align:center;text-decoration:underline;font-size:15px;margin-bottom:30px">
          קיום מפגש פיזיותרפיה למר ${fullName}
        </h2>
        <p>המטופל ${fullName}${p.id_number ? `, ת"ז ${p.id_number}` : ''}, הגיע לטיפול פיזיותרפיה בקליניקה${form.date ? ` בתאריך ${form.date}` : ''}${form.diagnosis ? ` בשל ${form.diagnosis}` : ''}.</p>
        <br>
        ${form.treatment_summary ? `<p>${form.treatment_summary}</p><br>` : ''}
        <p>על המטופל לבצע מדי יום תרגילים לחיזוק לצורך הורדת העומס והפחתת הסימפטומים.</p>
        <br>
        ${form.recommendations ? `<p>${form.recommendations}</p><br>` : ''}
        <p>לכל שאלה או התייעצות מוזמנים ליצור קשר.</p>
      `
    } else if (letterType === 'rehab_summary') {
      const bullets = form.rehab_details.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('')
      const currentBullets = form.current_status.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('')
      letterHTML = `
        ${form.recipient ? `<p style="margin-bottom:16px">לכבוד<br>${form.recipient}</p>` : ''}
        <p><strong>הנדון: סיכום תהליך שיקומי${form.diagnosis ? ` – ${form.diagnosis}` : ''}</strong></p>
        <br>
        <p>המטופל ${fullName}${p.id_number ? ` ת.ז ${p.id_number}` : ''} ${form.treatment_start ? `נמצא בטיפול ומעקב שיקומי מאז ${form.treatment_start}` : 'מטופל בקליניקה'}${form.diagnosis ? ` בעקבות ${form.diagnosis}` : ''}.</p>
        <br>
        ${bullets ? `<p>לאורך תקופת השיקום בוצעה עבודה משמעותית אשר כללה:</p><ul style="margin-right:20px;line-height:2">${bullets}</ul><br>` : ''}
        ${currentBullets ? `<p>נכון להיום, המטופל מציג:</p><ul style="margin-right:20px;line-height:2">${currentBullets}</ul><br>` : ''}
        ${form.recommendations ? `<p>${form.recommendations}</p><br>` : ''}
        <p>לכל שאלה או התייעצות מוזמנים ליצור קשר.</p>
      `
    } else if (letterType === 'profile_upgrade') {
      const rehabBullets = form.rehab_details.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('')
      const capBullets = form.current_capabilities.split('\n').filter(l => l.trim()).map(l => `<li>${l}</li>`).join('')
      letterHTML = `
        <p style="margin-bottom:8px">לכבוד<br>${form.recipient || 'הגורמים הרפואיים'}</p>
        <br>
        <p><strong>הנדון: המלצה להעלאת פרופיל רפואי – סיכום תהליך שיקומי – ${fullName}</strong></p>
        <br>
        <p>שמי יואב אבני, פיזיותרפיסט מוסמך, ואני מלווה את המטופל לאורך תהליך שיקומי${form.treatment_start ? ` מאז ${form.treatment_start}` : ''}.</p>
        <br>
        <p>${form.diagnosis ? `המטופל הגיע עם ${form.diagnosis}.` : ''}</p>
        <br>
        ${rehabBullets ? `<p>לאורך החודשים האחרונים עבר המטופל תהליך שיקומי הדרגתי, שכלל:</p><ul style="margin-right:20px;line-height:2">${rehabBullets}</ul><br>` : ''}
        ${capBullets ? `<p>נכון למועד זה:</p><ul style="margin-right:20px;line-height:2">${capBullets}</ul><br>` : ''}
        <p><strong>סיכום והמלצה:</strong></p>
        <p>${form.recommendation_text || 'לאור ההתקדמות המשמעותית וביכולת התפקודית הגבוהה תחת עומסים – אני סבור כי המטופל כשיר להעלאת פרופיל רפואי.'}</p>
        <br>
        <p>אשמח להרחיב במידת הצורך.</p>
      `
    } else if (letterType === 'injury_report') {
      letterHTML = `
        <h2 style="text-align:center;font-size:18px;margin-bottom:20px">אישור טיפול ראשוני</h2>
        <p style="text-align:center;text-decoration:underline;margin-bottom:24px"><strong>הנדון: דיווח פציעת שחקן בפעילות הקבוצה</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
          <tr><td style="padding:6px;border:1px solid #e2e8f0;width:30%">שם השחקן</td><td style="padding:6px;border:1px solid #e2e8f0">${fullName}</td><td style="padding:6px;border:1px solid #e2e8f0;width:20%">ת.ז</td><td style="padding:6px;border:1px solid #e2e8f0">${p.id_number || ''}</td></tr>
          <tr><td style="padding:6px;border:1px solid #e2e8f0">תאריך</td><td style="padding:6px;border:1px solid #e2e8f0">${form.injury_date}</td><td style="padding:6px;border:1px solid #e2e8f0">יום</td><td style="padding:6px;border:1px solid #e2e8f0">${form.injury_day}</td></tr>
          <tr><td style="padding:6px;border:1px solid #e2e8f0">שעת הפגיעה</td><td style="padding:6px;border:1px solid #e2e8f0">${form.injury_time}</td><td style="padding:6px;border:1px solid #e2e8f0">מקום הפעילות</td><td style="padding:6px;border:1px solid #e2e8f0">${form.injury_location}</td></tr>
          <tr><td style="padding:6px;border:1px solid #e2e8f0">סוג הפעילות</td><td style="padding:6px;border:1px solid #e2e8f0" colspan="3">${form.activity_type}</td></tr>
          <tr><td style="padding:6px;border:1px solid #e2e8f0">נגד הקבוצה</td><td style="padding:6px;border:1px solid #e2e8f0" colspan="3">${form.opponent}</td></tr>
        </table>
        <p style="margin-bottom:8px"><strong>תיאור הפציעה:</strong> ${form.injury_description}</p>
        <p style="margin-bottom:8px"><strong>טיפול ראשוני:</strong> ${form.first_aid}</p>
        <p style="margin-bottom:8px"><strong>הפניה לגורם חיצוני:</strong> ${form.referral}</p>
        <p style="margin-bottom:16px"><strong>המשך טיפול:</strong> ${form.next_steps}</p>
      `
    }

    const html = buildLetterHTML(letterHTML, today)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
    }
    setGenerating(false)
  }

  function buildLetterHTML(body: string, date: string) {
    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;direction:rtl;background:#fff;color:#1e293b;font-size:12px;line-height:1.8}
.page{padding:20px 28px;max-width:750px;margin:0 auto}
.logo-header{margin-bottom:30px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
.logo-header img{height:80px;object-fit:contain}
.date{text-align:left;font-size:11px;color:#64748b;margin-bottom:24px}
.body{font-size:12px;line-height:2;color:#1e293b}
.body p{margin-bottom:8px}
.body ul{margin-right:24px;margin-bottom:8px}
.signature{margin-top:40px;text-align:right}
.signature p{margin-bottom:3px}
.footer{border-top:1px solid #e2e8f0;margin-top:40px;padding-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#64748b}
.footer-left{text-align:left}
.footer-right{text-align:right}
.footer-right span{display:block}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
  <div class="logo-header">
    ${LOGO_B64 ? `<img src="${LOGO_B64}">` : '<strong style="font-size:18px">קליניקת יואב אבני</strong>'}
  </div>
  <div class="date">${date}</div>
  <div class="body">${body}</div>
  <div class="signature">
    <p>בברכה,</p>
    <br>
    <p><u>יואב אבני</u></p>
    <p><u>0545953889</u></p>
    <br>
    <p>יואב אבני, פיזיותרפיסט</p>
    <p>מספר רישיון ${CLINIC.ptLicense}</p>
  </div>
  <div class="footer">
    <div class="footer-left">פיזיותרפיה • שיקום • אורתופדיה • פציעות ספורט</div>
    <div class="footer-right">
      <span>054-5953889 | 04-8336605</span>
      <span>תרשיש 8, גילון, משגב</span>
      <span>yoavavni.pt@gmail.com | www.yoav-avni-clinic.com</span>
    </div>
  </div>
</div>
</body>
</html>`
  }

  // ── UI ───────────────────────────────────────────────────
  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📝 מכתבים רפואיים</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>הפקת מכתבים מקצועיים בלחיצה אחת</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* עמודה שמאל — סוג מכתב + בחירת מטופל */}
          <div>
            {/* סוג מכתב */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <label style={lbl}>סוג מכתב</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {LETTER_TYPES.map(t => (
                  <button key={t.id} onClick={() => setLetterType(t.id)} style={{
                    padding: '10px 14px',
                    border: `2px solid ${letterType === t.id ? '#1a3a5c' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    background: letterType === t.id ? '#1a3a5c' : '#fff',
                    color: letterType === t.id ? '#fff' : '#374151',
                    fontSize: '13px', fontWeight: letterType === t.id ? '700' : '400',
                    cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                    textAlign: 'right' as const,
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* בחירת מטופל */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <label style={lbl}>מטופל</label>
              <input
                style={{ ...inp, marginBottom: '8px' }}
                placeholder="חפש שם או טלפון..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filteredPatients.slice(0, 10).map(p => (
                  <div key={p.id}
                    onClick={() => {
                      setSelectedPatient(p)
                      setPatientSearch(`${p.first_name} ${p.last_name}`)
                      setForm(f => ({ ...f, diagnosis: p.diagnosis || '' }))
                      setAiStatus('')
                    }}
                    style={{
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      background: selectedPatient?.id === p.id ? '#f0f9ff' : '#fff',
                      fontSize: '13px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedPatient?.id === p.id ? '#f0f9ff' : '#fff')}
                  >
                    <div style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone}{p.diagnosis ? ` · ${p.diagnosis}` : ''}</div>
                  </div>
                ))}
              </div>

              {/* כפתור AI */}
              {selectedPatient && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={fillWithAI}
                    disabled={aiLoading}
                    style={{
                      width: '100%', padding: '11px',
                      background: aiLoading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff', border: 'none', borderRadius: '8px',
                      fontSize: '13px', fontWeight: '700', cursor: aiLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Heebo, sans-serif',
                      boxShadow: aiLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {aiLoading ? '⏳ AI קורא את הרשומות...' : '✨ מלא אוטומטית עם AI'}
                  </button>
                  {aiStatus && (
                    <p style={{
                      marginTop: '8px', fontSize: '12px', textAlign: 'center',
                      color: aiStatus.startsWith('✅') ? '#16a34a' : aiStatus.startsWith('❌') ? '#dc2626' : '#6366f1',
                      fontWeight: '600',
                    }}>
                      {aiStatus}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* עמודה ימין — שדות המכתב */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <label style={lbl}>פרטי המכתב</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>

              {(letterType === 'session_summary' || letterType === 'rehab_summary' || letterType === 'profile_upgrade') && (
                <>
                  <div>
                    <label style={lbl}>תאריך טיפול</label>
                    <input style={inp} value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>אבחנה / בעיה</label>
                    <input style={inp} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="כאב ברך, TENDINOPATHY QUAD..." />
                  </div>
                </>
              )}

              {letterType === 'session_summary' && (
                <>
                  <div>
                    <label style={lbl}>תיאור הטיפול</label>
                    <textarea style={ta} value={form.treatment_summary} onChange={e => set('treatment_summary', e.target.value)} placeholder="בוצע טיפול ידני, חשמל..." />
                  </div>
                  <div>
                    <label style={lbl}>המלצות</label>
                    <textarea style={ta} value={form.recommendations} onChange={e => set('recommendations', e.target.value)} placeholder="המלצות להמשך..." />
                  </div>
                </>
              )}

              {(letterType === 'rehab_summary' || letterType === 'profile_upgrade') && (
                <>
                  <div>
                    <label style={lbl}>מוען (לכבוד)</label>
                    <input style={inp} value={form.recipient} onChange={e => set('recipient', e.target.value)} placeholder="הגורמים הרפואיים – צה״ל..." />
                  </div>
                  <div>
                    <label style={lbl}>תחילת טיפול</label>
                    <input style={inp} value={form.treatment_start} onChange={e => set('treatment_start', e.target.value)} placeholder="מרץ 2025" />
                  </div>
                  <div>
                    <label style={lbl}>מה בוצע בשיקום (כל שורה = נקודה)</label>
                    <textarea style={{ ...ta, minHeight: '100px' }} value={form.rehab_details} onChange={e => set('rehab_details', e.target.value)} placeholder="חזרה מלאה להליכה תקינה&#10;שיפור משמעותי בכוח" />
                  </div>
                  <div>
                    <label style={lbl}>מצב נוכחי (כל שורה = נקודה)</label>
                    <textarea style={{ ...ta, minHeight: '80px' }} value={form.current_status} onChange={e => set('current_status', e.target.value)} placeholder="טווחי תנועה מלאים&#10;ברך יציבה" />
                  </div>
                  <div>
                    <label style={lbl}>המלצות</label>
                    <textarea style={ta} value={form.recommendations} onChange={e => set('recommendations', e.target.value)} placeholder="המלצות להמשך..." />
                  </div>
                  {letterType === 'profile_upgrade' && (
                    <div>
                      <label style={lbl}>נוסח ההמלצה</label>
                      <textarea style={ta} value={form.recommendation_text} onChange={e => set('recommendation_text', e.target.value)} placeholder="לאור ההתקדמות המשמעותית..." />
                    </div>
                  )}
                </>
              )}

              {letterType === 'injury_report' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><label style={lbl}>תאריך פציעה</label><input style={inp} value={form.injury_date} onChange={e => set('injury_date', e.target.value)} placeholder="3.2.26" /></div>
                    <div><label style={lbl}>יום</label><input style={inp} value={form.injury_day} onChange={e => set('injury_day', e.target.value)} placeholder="שלישי" /></div>
                    <div><label style={lbl}>שעה</label><input style={inp} value={form.injury_time} onChange={e => set('injury_time', e.target.value)} placeholder="20:00" /></div>
                    <div><label style={lbl}>מקום</label><input style={inp} value={form.injury_location} onChange={e => set('injury_location', e.target.value)} placeholder="אולם כדורסל" /></div>
                  </div>
                  <div><label style={lbl}>סוג פעילות</label><input style={inp} value={form.activity_type} onChange={e => set('activity_type', e.target.value)} /></div>
                  <div><label style={lbl}>נגד קבוצה</label><input style={inp} value={form.opponent} onChange={e => set('opponent', e.target.value)} /></div>
                  <div><label style={lbl}>תיאור הפציעה</label><textarea style={ta} value={form.injury_description} onChange={e => set('injury_description', e.target.value)} /></div>
                  <div><label style={lbl}>טיפול ראשוני</label><textarea style={ta} value={form.first_aid} onChange={e => set('first_aid', e.target.value)} /></div>
                  <div><label style={lbl}>הפניה לגורם חיצוני</label><input style={inp} value={form.referral} onChange={e => set('referral', e.target.value)} /></div>
                  <div><label style={lbl}>המשך טיפול</label><input style={inp} value={form.next_steps} onChange={e => set('next_steps', e.target.value)} /></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* כפתור הפקה */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={generateLetter}
            disabled={generating || !selectedPatient}
            style={{
              padding: '14px 32px',
              background: (!selectedPatient || generating) ? '#94a3b8' : '#1a3a5c',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '800',
              cursor: (!selectedPatient || generating) ? 'not-allowed' : 'pointer',
              fontFamily: 'Heebo, sans-serif',
              boxShadow: '0 4px 14px rgba(26,58,92,0.25)',
            }}
          >
            {generating ? '⏳ מפיק...' : '📄 הפק מכתב PDF'}
          </button>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            הדף ייפתח בחלון חדש ← Ctrl+P לשמירה כ-PDF
          </span>
        </div>
      </div>
    </AppLayout>
  )
}

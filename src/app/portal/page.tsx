'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const PAYMENT_LINKS: Record<string, { label: string; url: string }> = {
  'clalit':     { label: 'טיפול גילון צורית', url: 'https://www.yoav-avni-clinic.com/_paylink/AZtZIkT9' },
  'private':    { label: 'טיפול פרטי',        url: 'https://www.yoav-avni-clinic.com/_paylink/AZvCL5XV' },
  'hydro':      { label: 'פיזיותרפיה במים',   url: 'https://www.yoav-avni-clinic.com/_paylink/AZa0Pm4K' },
  'home':       { label: 'ביקור בית',          url: 'https://www.yoav-avni-clinic.com/_paylink/AZZsK6kw' },
  'orthotic':   { label: 'מדרס מותאם אישית',  url: 'https://www.yoav-avni-clinic.com/_paylink/AZx5lGoD' },
}

function getPaymentLink(patient: any): { label: string; url: string } {
  if (!patient) return PAYMENT_LINKS['private']
  const funding = patient.funding_type || 'private'
  if (funding === 'clalit' || funding === 'maccabi' || funding === 'meuhedet' || funding === 'leumit') 
    return PAYMENT_LINKS['clalit']
  return PAYMENT_LINKS['private']
}

type UserType = 'patient' | 'therapist'

export default function PortalPage() {
  const [patient, setPatient] = useState<any>(null)
  const [therapist, setTherapist] = useState<any>(null)
  const [userType, setUserType] = useState<UserType>('patient')
  const [appointments, setAppointments] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [vasData, setVasData] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'login' | 'home'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'billing' | 'videos' | 'progress' | 'book'>('home')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingSlot, setBookingSlot] = useState<any>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)

  useEffect(() => {
    const savedPatient = sessionStorage.getItem('portal_patient')
    const savedTherapist = sessionStorage.getItem('portal_therapist')
    if (savedPatient) {
      const p = JSON.parse(savedPatient)
      setPatient(p); setUserType('patient'); setStep('home')
      loadPatientData(p.id, p.funding_type)
    } else if (savedTherapist) {
      const t = JSON.parse(savedTherapist)
      setTherapist(t); setUserType('therapist'); setStep('home')
    }
  }, [])

  async function loadPatientData(patientId: string, fundingType: string) {
    const today = new Date().toISOString().split('T')[0]
    // תורים עתידיים
    const { data: appts } = await supabase.from('appointments').select('*, service:service_types(name_he,icon,color)').eq('patient_id', patientId).gte('date', today).order('date').limit(10)
    setAppointments(appts || [])
    // חיובים וחוב
    const { data: bills } = await supabase.from('billing_records').select('*').eq('patient_id', patientId).order('date', { ascending: false }).limit(20)
    setBilling(bills || [])
    const debt = (bills || []).filter(b => b.payment_status === 'unpaid').reduce((s: number, b: any) => s + (b.amount || 0), 0)
    setTotalDebt(debt)
    // סרטוני תרגילים
    const { data: vids } = await supabase.from('exercise_videos').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })
    setVideos(vids || [])
    // נתוני VAS
    const { data: vas } = await supabase.from('treatment_records').select('vas_score,created_at').eq('patient_id', patientId).order('created_at').limit(20)
    setVasData((vas || []).filter((v: any) => v.vas_score !== null))
  }

  async function loadAvailableSlots(date: string) {
    if (!date) return
    const { data } = await supabase.from('availability').select('*').eq('date', date).eq('is_available', true).order('start_time')
    // סנן תורים תפוסים
    const { data: booked } = await supabase.from('appointments').select('time').eq('date', date)
    const bookedTimes = (booked || []).map((b: any) => b.time)
    setAvailableSlots((data || []).filter((s: any) => !bookedTimes.includes(s.start_time)))
  }

  async function bookAppointment() {
    if (!bookingSlot || !patient) return
    setLoading(true)
    await supabase.from('appointments').insert({
      patient_id: patient.id, date: bookingDate,
      time: bookingSlot.start_time, status: 'scheduled',
      notes: 'נקבע דרך פורטל מטופל'
    })
    setBookingSuccess(true)
    setLoading(false)
    setBookingSlot(null)
    loadPatientData(patient.id, patient.funding_type)
    setTimeout(() => { setBookingSuccess(false); setActiveTab('appointments') }, 2000)
  }

  async function loginPatient() {
    if (!phone) { setError('יש להזין מספר טלפון'); return }
    setLoading(true); setError('')
    const clean = phone.replace(/-/g, '').replace(/\s/g, '')
    const { data } = await supabase.from('patients').select('*').or(`phone.eq.${clean},phone.eq.0${clean.slice(-9)}`).single()
    if (!data) { setError('מספר טלפון לא נמצא במערכת. פנה לקליניקה.'); setLoading(false); return }
    setPatient(data); setUserType('patient')
    sessionStorage.setItem('portal_patient', JSON.stringify(data))
    setStep('home'); loadPatientData(data.id, data.funding_type)
    setLoading(false)
  }

  async function loginTherapist() {
    if (!phone || !password) { setError('יש להזין פרטי כניסה'); return }
    setLoading(true); setError('')
    // בדיקה פשוטה — מספר טלפון + סיסמה
    if (phone === '0545953889' && password === 'yoavavni2024') {
      const t = { name: 'יואב אבני', role: 'therapist' }
      setTherapist(t); setUserType('therapist')
      sessionStorage.setItem('portal_therapist', JSON.stringify(t))
      setStep('home')
    } else {
      setError('פרטי כניסה שגויים')
    }
    setLoading(false)
  }

  function logout() {
    sessionStorage.removeItem('portal_patient')
    sessionStorage.removeItem('portal_therapist')
    setPatient(null); setTherapist(null)
    setStep('login'); setPhone(''); setPassword('')
    setActiveTab('home')
  }

  // הצג מחיר לפי סוג מימון
  function getPatientPrice(service: any) {
    if (!patient || !service) return null
    const funding = patient.funding_type || 'private'
    if (funding === 'private') return service.price_private
    if (funding === 'clalit') return service.price_clalit
    if (funding === 'maccabi') return service.price_maccabi
    if (funding === 'meuhedet') return service.price_meuhedet
    if (funding === 'leumit') return service.price_leumit
    return service.price_private
  }

  // VAS גרף פשוט
  function VasChart() {
    if (vasData.length < 2) return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>אין מספיק נתוני כאב עדיין</div>
    )
    const max = 10
    const w = 300, h = 120, pad = 20
    const xStep = (w - pad * 2) / (vasData.length - 1)
    const points = vasData.map((v: any, i: number) => ({
      x: pad + i * xStep,
      y: h - pad - ((v.vas_score / max) * (h - pad * 2))
    }))
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const first = vasData[0].vas_score
    const last = vasData[vasData.length - 1].vas_score
    const improved = last < first
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>כאב ראשוני: {first}/10</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: improved ? '#0b8a5e' : '#dc2626' }}>
            {improved ? '📉 שיפור!' : '📈'} כיום: {last}/10
          </span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100px' }}>
          <defs>
            <linearGradient id="vasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={improved ? '#0b8a5e' : '#dc2626'} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={improved ? '#0b8a5e' : '#dc2626'} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={`${path} L ${points[points.length-1].x} ${h-pad} L ${points[0].x} ${h-pad} Z`} fill="url(#vasGrad)"/>
          <path d={path} fill="none" stroke={improved ? '#0b8a5e' : '#dc2626'} strokeWidth="2.5" strokeLinecap="round"/>
          {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={improved ? '#0b8a5e' : '#dc2626'}/>)}
        </svg>
      </div>
    )
  }

  // ===== LOGIN =====
  if (step === 'login') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1a3a5c 0%, #0d2240 60%, #1a3a5c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}><span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>פורטל קליניקה</div>
      </div>

      {/* toggle מטופל/מטפל */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px', marginBottom: '20px', width: '100%', maxWidth: '360px' }}>
        <button onClick={() => { setUserType('patient'); setError('') }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', background: userType === 'patient' ? '#fff' : 'transparent', color: userType === 'patient' ? '#1a3a5c' : 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🧑‍⚕️ מטופל</button>
        <button onClick={() => { setUserType('therapist'); setError('') }} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', background: userType === 'therapist' ? '#fff' : 'transparent', color: userType === 'therapist' ? '#1a3a5c' : 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>👨‍💼 מטפל</button>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {userType === 'patient' ? (
          <>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#1a3a5c', marginBottom: '4px', textAlign: 'center' }}>כניסה למטופלים</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>הזן את מספר הטלפון שלך</p>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && loginPatient()} placeholder="050-0000000" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'center', marginBottom: '12px', boxSizing: 'border-box' }}/>
            <button onClick={loginPatient} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>{loading ? '⏳ מחפש...' : 'כניסה →'}</button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#1a3a5c', marginBottom: '4px', textAlign: 'center' }}>כניסה למטפלים</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '20px' }}>הזן פרטי כניסה</p>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="טלפון" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', marginBottom: '10px', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center' }}/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && loginTherapist()} placeholder="סיסמה" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', marginBottom: '12px', boxSizing: 'border-box', direction: 'ltr', textAlign: 'center' }}/>
            <button onClick={loginTherapist} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>{loading ? '⏳...' : 'כניסה →'}</button>
          </>
        )}
      </div>

      <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[{ icon: '✅', text: 'קביעת תור עצמאית — 24/7' },{ icon: '🏃', text: 'חזרה לפעילות מהירה' },{ icon: '💪', text: 'מטפל שמלווה אותך' }].map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ===== THERAPIST HOME =====
  if (step === 'home' && userType === 'therapist') return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}><span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>פורטל מטפלים</div></div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>שלום, {therapist?.name}!</span>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>יציאה</button>
        </div>
      </div>
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏥</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '16px' }}>כניסת מטפל — מעבר למערכת</div>
          <Link href="/dashboard" style={{ display: 'block', padding: '13px', background: '#1a3a5c', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>📊 לוח בקרה</Link>
          <Link href="/patients" style={{ display: 'block', padding: '13px', background: '#f0f4f8', color: '#1a3a5c', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>👥 מטופלים</Link>
          <Link href="/calendar" style={{ display: 'block', padding: '13px', background: '#f0f4f8', color: '#1a3a5c', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>📅 יומן</Link>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>יציאה</button>
      </div>
    </div>
  )

  // ===== PATIENT HOME =====
  const tabs = [
    { key: 'home', icon: '🏠', label: 'ראשי' },
    { key: 'appointments', icon: '📅', label: 'תורים' },
    { key: 'book', icon: '➕', label: 'קבע תור' },
    { key: 'billing', icon: '💳', label: 'תשלום' },
    { key: 'videos', icon: '🎬', label: 'תרגילים' },
    { key: 'progress', icon: '📈', label: 'התקדמות' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div><div style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}><span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>פורטל מטופלים</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>שלום, {patient?.first_name}!</div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>יציאה</button>
        </div>
      </div>

      {/* חוב אזהרה */}
      {totalDebt > 0 && (
        <div style={{ background: '#fee2e2', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '700' }}>⚠️ יתרת חוב: ₪{totalDebt}</span>
          <button onClick={() => setActiveTab('billing')} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>לתשלום</button>
        </div>
      )}

      <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>

        {/* ===== HOME TAB ===== */}
        {activeTab === 'home' && (
          <>
            {/* תור קרוב */}
            {appointments.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', borderRadius: '16px', padding: '18px', marginBottom: '14px', color: '#fff' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>⏰ התור הקרוב שלך</div>
                <div style={{ fontSize: '17px', fontWeight: '800' }}>{appointments[0].service?.name_he || 'טיפול פיזיותרפיה'}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                  {new Date(appointments[0].date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointments[0].time?.slice(0,5)}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <a href={`https://wa.me/972${CLINIC.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '8px 14px', background: '#25d366', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>💬 WhatsApp</a>
                  <a href={`tel:${CLINIC.phone}`} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>📞 ביטול</a>
                </div>
              </div>
            )}

            {/* כרטיסי פעולה מהירה */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {[
                { tab: 'book', icon: '📅', label: 'קבע תור', sub: 'הזמן עכשיו', bg: '#3eb8e5', color: '#fff' },
                { tab: 'appointments', icon: '📋', label: 'התורים שלי', sub: `${appointments.length} קרובים`, bg: '#fff', color: '#1a3a5c' },
                { tab: 'billing', icon: '💳', label: 'תשלומים', sub: totalDebt > 0 ? `חוב: ₪${totalDebt}` : 'מעודכן', bg: totalDebt > 0 ? '#fee2e2' : '#fff', color: totalDebt > 0 ? '#dc2626' : '#1a3a5c' },
                { tab: 'videos', icon: '🎬', label: 'תרגילים', sub: `${videos.length} סרטונים`, bg: '#fff', color: '#1a3a5c' },
              ].map(card => (
                <button key={card.tab} onClick={() => setActiveTab(card.tab as any)} style={{ background: card.bg, borderRadius: '14px', padding: '18px 14px', textAlign: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '26px', marginBottom: '5px' }}>{card.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: card.color }}>{card.label}</div>
                  <div style={{ fontSize: '10px', color: card.color, opacity: 0.7, marginTop: '2px' }}>{card.sub}</div>
                </button>
              ))}
            </div>

            {/* פתולוגיה */}
            {patient?.diagnosis && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>🩺 הפתולוגיה שלך</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '4px' }}>{patient.diagnosis}</div>
                {patient.notes && <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{patient.notes}</div>}
              </div>
            )}

            {/* WhatsApp עם מטפל */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px' }}>💬 צור קשר עם המטפל</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`https://wa.me/972${CLINIC.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '11px', background: '#25d366', color: '#fff', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>💬 WhatsApp</a>
                <a href={`tel:${CLINIC.phone}`} style={{ flex: 1, padding: '11px', background: '#1a3a5c', color: '#fff', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>📞 התקשר</a>
              </div>
            </div>
          </>
        )}

        {/* ===== APPOINTMENTS TAB ===== */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '14px' }}>📅 התורים הקרובים שלך</div>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>אין תורים קרובים</div>
                <button onClick={() => setActiveTab('book')} style={{ padding: '10px 20px', background: '#3eb8e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>קבע תור עכשיו</button>
              </div>
            ) : appointments.map((apt: any) => (
              <div key={apt.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #3eb8e5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a3a5c' }}>{apt.service?.name_he || 'טיפול פיזיותרפיה'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                      {new Date(apt.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · {apt.time?.slice(0,5)}
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>מאושר</span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <a href={`https://wa.me/972${CLINIC.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: '#25d366', color: '#fff', borderRadius: '7px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>💬 WhatsApp לביטול</a>
                  <a href={`tel:${CLINIC.phone}`} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#1a3a5c', borderRadius: '7px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>📞 התקשר</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== BOOK TAB ===== */}
        {activeTab === 'book' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '14px' }}>➕ קביעת תור</div>
            {bookingSuccess && (
              <div style={{ background: '#d1fae5', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '30px', marginBottom: '6px' }}>✅</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#065f46' }}>התור נקבע בהצלחה!</div>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>בחר תאריך</label>
              <input type="date" value={bookingDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => { setBookingDate(e.target.value); loadAvailableSlots(e.target.value); setBookingSlot(null) }}
                style={{ width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}/>
            </div>
            {bookingDate && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>שעות פנויות</div>
                {availableSlots.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px' }}>אין שעות פנויות בתאריך זה</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {availableSlots.map((slot: any) => (
                      <button key={slot.id} onClick={() => setBookingSlot(slot)}
                        style={{ padding: '10px', border: `2px solid ${bookingSlot?.id === slot.id ? '#3eb8e5' : '#e2e8f0'}`, borderRadius: '8px', background: bookingSlot?.id === slot.id ? '#f0f9ff' : '#fff', fontSize: '13px', fontWeight: '700', color: bookingSlot?.id === slot.id ? '#3eb8e5' : '#1a3a5c', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                        {slot.start_time?.slice(0,5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {bookingSlot && (
              <button onClick={bookAppointment} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#94a3b8' : '#3eb8e5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {loading ? '⏳ קובע...' : `✅ אשר תור — ${bookingDate} בשעה ${bookingSlot.start_time?.slice(0,5)}`}
              </button>
            )}
          </div>
        )}

        {/* ===== BILLING TAB ===== */}
        {activeTab === 'billing' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '14px' }}>💳 תשלומים וחשבוניות</div>
            {totalDebt > 0 && (
              <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626' }}>יתרת חוב</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#991b1b' }}>₪{totalDebt}</div>
                </div>
                <a href={getPaymentLink(patient).url} target="_blank" rel="noreferrer" style={{ padding: '10px 16px', background: '#dc2626', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>💳 שלם עכשיו</a>
              </div>
            )}
            {billing.map((bill: any) => (
              <div key={bill.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a5c' }}>{bill.service_name || 'טיפול'}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(bill.date).toLocaleDateString('he-IL')}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a3a5c' }}>₪{bill.amount}</div>
                  <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', background: bill.payment_status === 'paid' ? '#d1fae5' : '#fee2e2', color: bill.payment_status === 'paid' ? '#065f46' : '#dc2626' }}>{bill.payment_status === 'paid' ? 'שולם' : 'לתשלום'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== PAYMENT LINKS ===== */}
        {activeTab === 'billing' && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginTop: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>💳 לינקי תשלום</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(PAYMENT_LINKS).map(([key, link]) => (
                <a key={key} href={link.url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a5c' }}>{link.label}</span>
                  <span style={{ fontSize: '12px', color: '#3eb8e5', fontWeight: '700' }}>שלם →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ===== VIDEOS TAB ===== */}
        {activeTab === 'videos' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '14px' }}>🎬 תרגילי הבית שלך</div>
            {videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '14px' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎬</div>
                <div>המטפל שלך יוסיף כאן סרטוני תרגילים</div>
              </div>
            ) : videos.map((vid: any) => (
              <div key={vid.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '4px' }}>{vid.title}</div>
                {vid.description && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{vid.description}</div>}
                {vid.url && <a href={vid.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: '#1a3a5c', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>▶️ צפה בסרטון</a>}
              </div>
            ))}
          </div>
        )}

        {/* ===== PROGRESS TAB ===== */}
        {activeTab === 'progress' && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '14px' }}>📈 התקדמות הטיפול שלך</div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>📊 עוצמת כאב לאורך הזמן (0-10)</div>
              <VasChart />
            </div>
            {patient?.diagnosis && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🩺 האבחנה שלך</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a5c', marginBottom: '6px' }}>{patient.diagnosis}</div>
                {patient.notes && <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>{patient.notes}</div>}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 100 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{ flex: 1, padding: '10px 4px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontFamily: 'Heebo, sans-serif' }}>
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span style={{ fontSize: '9px', fontWeight: activeTab === tab.key ? '800' : '500', color: activeTab === tab.key ? '#3eb8e5' : '#94a3b8' }}>{tab.label}</span>
            {activeTab === tab.key && <div style={{ width: '20px', height: '2px', background: '#3eb8e5', borderRadius: '2px' }}/>}
          </button>
        ))}
      </div>
    </div>
  )
}

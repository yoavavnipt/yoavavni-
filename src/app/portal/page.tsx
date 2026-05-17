'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase, CLINIC, SERVICES } from '@/lib/supabase'

export default function PortalPage() {
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'home'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('portal_patient')
    if (saved) {
      const p = JSON.parse(saved)
      setPatient(p)
      setStep('home')
      loadAppointments(p.id)
    }
  }, [])

  async function findPatient() {
    if (!phone) { setError('יש להזין מספר טלפון'); return }
    setLoading(true)
    setError('')
    const clean = phone.replace(/-/g, '').replace(/\s/g, '')
    const { data } = await supabase.from('patients').select('*').or(`phone.eq.${clean},phone.eq.0${clean.slice(-9)}`).single()
    if (!data) {
      setError('מספר טלפון לא נמצא במערכת. פנה לקליניקה.')
      setLoading(false)
      return
    }
    setPatient(data)
    sessionStorage.setItem('portal_patient', JSON.stringify(data))
    setStep('home')
    loadAppointments(data.id)
    setLoading(false)
  }

  async function loadAppointments(patientId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('*, service:service_types(name_he,icon,color)')
      .eq('patient_id', patientId)
      .gte('date', today)
      .order('date')
      .limit(5)
    setAppointments(data || [])
  }

  function logout() {
    sessionStorage.removeItem('portal_patient')
    setPatient(null)
    setStep('phone')
    setPhone('')
  }

  // LOGIN SCREEN
  if (step === 'phone') return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a3a5c 0%, #0d2240 60%, #1a3a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Heebo, sans-serif', direction: 'rtl',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>
          <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
          פורטל מטופלים
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', marginBottom: '6px', textAlign: 'center' }}>כניסה למטופלים</h2>
        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginBottom: '24px' }}>הזן את מספר הטלפון שלך</p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && findPatient()}
          placeholder="050-0000000"
          style={{
            width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
            borderRadius: '10px', fontSize: '16px', outline: 'none',
            fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'center',
            marginBottom: '12px', letterSpacing: '1px',
          }}
        />
        <button onClick={findPatient} disabled={loading} style={{
          width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#1a3a5c',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Heebo, sans-serif',
        }}>
          {loading ? '⏳ מחפש...' : 'כניסה →'}
        </button>

        <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          מטופל חדש? <a href="/portal/chat" style={{ color: '#3eb8e5', fontWeight: '700' }}>צור איתנו קשר →</a>
        </div>
      </div>

      {/* Services preview */}
      <div style={{ marginTop: '32px', width: '100%', maxWidth: '400px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>השירותים שלנו</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
          {SERVICES.filter(s => s.price > 0 && !s.id.includes('run') && !s.id.includes('physio_local') && !s.id.includes('rehab') && !s.id.includes('ortho')).map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', lineHeight: '1.3' }}>{s.name_he}</div>
              <div style={{ fontSize: '10px', color: '#3eb8e5', fontWeight: '800', marginTop: '3px' }}>₪{s.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // HOME SCREEN
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>
            <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>פורטל מטופלים</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>שלום, {patient?.first_name}!</div>
          </div>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            יציאה
          </button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <Link href="/portal/book" style={{
            background: '#3eb8e5', borderRadius: '14px', padding: '20px 16px',
            textAlign: 'center', textDecoration: 'none', display: 'block',
            boxShadow: '0 4px 14px rgba(62,184,229,0.35)',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>📅</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>קבע תור</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '3px' }}>הזמן עכשיו</div>
          </Link>
          <Link href="/portal/appointments" style={{
            background: '#fff', borderRadius: '14px', padding: '20px 16px',
            textAlign: 'center', textDecoration: 'none', display: 'block',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a3a5c' }}>התורים שלי</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{appointments.length} קרובים</div>
          </Link>
        </div>

        {/* Next appointment */}
        {appointments.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRight: '4px solid #3eb8e5' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>התור הקרוב שלך</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px' }}>{appointments[0].service?.icon || '🏥'}</div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a3a5c' }}>{appointments[0].service?.name_he}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  {new Date(appointments[0].date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointments[0].time?.slice(0,5)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
              📍 {CLINIC.address} · לביטול: <a href={`tel:${CLINIC.phone}`} style={{ color: '#3eb8e5', fontWeight: '600' }}>{CLINIC.phone}</a>
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a5c', marginBottom: '12px' }}>📞 צור קשר</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href={`tel:${CLINIC.phone}`} style={{
              flex: 1, padding: '11px', background: '#1a3a5c', color: '#fff',
              borderRadius: '10px', textAlign: 'center', textDecoration: 'none',
              fontSize: '13px', fontWeight: '700'
            }}>
              📞 התקשר
            </a>
            <a href={`https://wa.me/972${CLINIC.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{
              flex: 1, padding: '11px', background: '#25d366', color: '#fff',
              borderRadius: '10px', textAlign: 'center', textDecoration: 'none',
              fontSize: '13px', fontWeight: '700'
            }}>
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

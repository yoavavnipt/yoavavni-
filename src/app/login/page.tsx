'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'staff' | 'patient'>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loginStaff() {
    if (!email || !password) { setError('יש למלא אימייל וסיסמה'); return }
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('אימייל או סיסמה שגויים'); setLoading(false); return }
    const { data: user } = await supabase.from('clinic_users').select('*').eq('email', email).eq('active', true).single()
    if (!user) { setError('אין לך גישה למערכת'); await supabase.auth.signOut(); setLoading(false); return }
    localStorage.setItem('clinic_user', JSON.stringify(user))
    document.cookie = `clinic_user=${encodeURIComponent(JSON.stringify({ id: user.id, role: user.role, name: user.name }))}; path=/; max-age=86400`
    router.push('/dashboard')
  }

  async function loginPatient() {
    if (!phone) { setError('יש להזין מספר טלפון'); return }
    setLoading(true); setError('')
    const clean = phone.replace(/-/g, '').replace(/\s/g, '')
    const { data } = await supabase.from('patients').select('*').or(`phone.eq.${clean},phone.eq.0${clean.slice(-9)}`).single()
    if (!data) { setError('מספר טלפון לא נמצא במערכת'); setLoading(false); return }
    sessionStorage.setItem('portal_patient', JSON.stringify(data))
    router.push('/portal')
  }

  const inp = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif' } as const

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2240 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a3a5c', letterSpacing: '-1px' }}><span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>קליניקת יואב אבני</div>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>{error}</div>}

        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '4px' }}>בחר סוג כניסה:</p>
            <button onClick={() => setMode('staff')} style={{ padding: '16px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>👨‍⚕️</span>
              <div style={{ textAlign: 'right' }}>
                <div>כניסת צוות</div>
                <div style={{ fontSize: '11px', fontWeight: '400', opacity: 0.7 }}>מטפלים, מנהלים, מזכירות</div>
              </div>
            </button>
            <button onClick={() => setMode('patient')} style={{ padding: '16px', background: '#3eb8e5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🧑‍🦽</span>
              <div style={{ textAlign: 'right' }}>
                <div>כניסת מטופל</div>
                <div style={{ fontSize: '11px', fontWeight: '400', opacity: 0.7 }}>פורטל מטופלים</div>
              </div>
            </button>
          </div>
        )}

        {mode === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }}>אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && loginStaff()} placeholder="your@email.com" style={{ ...inp, direction: 'ltr', textAlign: 'left' as const }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }}>סיסמה</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && loginStaff()} placeholder="••••••••" style={{ ...inp, direction: 'ltr', textAlign: 'left' as const }} />
            </div>
            <button onClick={loginStaff} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {loading ? '⏳ מתחבר...' : 'כניסה'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <a href="/reset-password" style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'none' }}>שכחתי סיסמה</a>
            </div>
          </div>
        )}

        {mode === 'patient' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>הזן את מספר הטלפון שלך</p>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && loginPatient()} placeholder="050-0000000" style={{ ...inp, direction: 'ltr', textAlign: 'center', fontSize: '18px', letterSpacing: '1px' }} />
            <button onClick={loginPatient} disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#3eb8e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {loading ? '⏳ מחפש...' : 'כניסה לפורטל →'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              מטופל חדש? <a href="/portal/chat" style={{ color: '#3eb8e5', fontWeight: '700' }}>צור קשר</a>
            </div>
          </div>
        )}

        {mode !== 'choose' && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button onClick={() => { setMode('choose'); setError('') }} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>← חזור</button>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          קליניקת יואב אבני · תרשיש 8, גילון · 054-5953889
        </div>
      </div>
    </div>
  )
}

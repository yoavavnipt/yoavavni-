'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    if (!email || !password) { setError('יש למלא אימייל וסיסמה'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (authError) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
      return
    }

    const { data: user } = await supabase.from('clinic_users').select('*').eq('email', email).eq('active', true).single()
    
    if (!user) {
      setError('אין לך גישה למערכת')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    localStorage.setItem('clinic_user', JSON.stringify(user))
    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2240 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'Heebo, sans-serif', direction: 'rtl',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a3a5c', letterSpacing: '-1px' }}>
            <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            קליניקת יואב אבני — כניסה למערכת
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }}>אימייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'left' as const }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }}>סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'left' as const }} />
          </div>
          <button onClick={login} disabled={loading} style={{
            width: '100%', padding: '13px', marginTop: '4px',
            background: loading ? '#94a3b8' : '#1a3a5c',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Heebo, sans-serif',
          }}>
            {loading ? '⏳ מתחבר...' : 'כניסה למערכת'}
          </button>
        </div>

        <div style={{ marginTop: '24px', padding: '14px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          קליניקת יואב אבני · תרשיש 8, גילון · 054-5953889
        </div>
      </div>
    </div>
  )
}

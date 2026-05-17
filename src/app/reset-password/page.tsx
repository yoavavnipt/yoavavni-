'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'email' | 'password' | 'done'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendReset() {
    if (!email) { setError('יש להזין אימייל'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://yoavavni-9dy3.vercel.app/reset-password',
    })
    setLoading(false)
    if (error) { setError('שגיאה — בדוק את האימייל'); return }
    setStep('done')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2240 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Heebo, sans-serif', direction: 'rtl',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a3a5c', letterSpacing: '-1px' }}>
            <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {step === 'done' ? 'מייל נשלח!' : 'איפוס סיסמה'}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {step === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
              הכנס את האימייל שלך ואשלח לך לינק לאיפוס סיסמה
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }}>אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReset()}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'ltr', textAlign: 'left' as const }} />
            </div>
            <button onClick={sendReset} disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? '#94a3b8' : '#1a3a5c',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Heebo, sans-serif',
            }}>
              {loading ? '⏳ שולח...' : 'שלח לינק לאיפוס'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.7' }}>
              שלחנו לינק לאיפוס סיסמה ל-<strong>{email}</strong><br />
              בדוק את תיבת הדואר שלך.
            </p>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#3eb8e5', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', fontWeight: '600' }}>
            ← חזור לכניסה
          </button>
        </div>
      </div>
    </div>
  )
}

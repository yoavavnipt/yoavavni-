'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  admin:     { label: 'מנהל',    color: '#1e4a7a', bg: '#dbeafe' },
  therapist: { label: 'מטפל',    color: '#065f46', bg: '#d1fae5' },
  secretary: { label: 'מזכירה',  color: '#6b21a8', bg: '#f3e8ff' },
}

const inp = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Heebo, sans-serif', background:'#fff' } as const

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', role: 'therapist', password: '' })
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const u = localStorage.getItem('clinic_user')
    if (u) setCurrentUser(JSON.parse(u))
    loadUsers()
  }, [])

  async function loadUsers() {
    const { data } = await supabase.from('clinic_users').select('*').order('name')
    setUsers(data || [])
    setLoading(false)
  }

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function createUser() {
    if (!form.email || !form.name || !form.password) { alert('יש למלא את כל השדות'); return }
    setSaving(true)
    
    // Create auth user
    const { error: authErr } = await supabase.auth.admin?.createUser?.({
      email: form.email,
      password: form.password,
      email_confirm: true,
    }) || {}

    // Add to clinic_users
    const { error } = await supabase.from('clinic_users').insert([{
      email: form.email, name: form.name, role: form.role
    }])

    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    setShowForm(false)
    setForm({ email: '', name: '', role: 'therapist', password: '' })
    loadUsers()
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('clinic_users').update({ active: !active }).eq('id', id)
    loadUsers()
  }

  async function changeRole(id: string, role: string) {
    await supabase.from('clinic_users').update({ role }).eq('id', id)
    loadUsers()
  }

  if (currentUser?.role !== 'admin') {
    return <AppLayout><div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>אין לך גישה לדף זה</div></AppLayout>
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>👥 ניהול משתמשים</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>ניהול הרשאות גישה למערכת</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '9px 18px', background: '#1a3a5c', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
          }}>
            + משתמש חדש
          </button>
        </div>

        {/* Users table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : users.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 18px', borderBottom: i < users.length - 1 ? '1px solid #f8fafc' : 'none',
              opacity: u.active ? 1 : 0.5,
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: u.role === 'admin' ? '#1e4a7a' : u.role === 'therapist' ? '#065f46' : '#6b21a8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: '800', color: '#fff', flexShrink: 0
              }}>
                {u.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{u.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</div>
              </div>
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value)}
                disabled={u.email === currentUser?.email}
                style={{
                  padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px',
                  fontSize: '12px', fontFamily: 'Heebo, sans-serif', cursor: 'pointer',
                  background: ROLES[u.role]?.bg, color: ROLES[u.role]?.color, fontWeight: '700'
                }}
              >
                <option value="admin">מנהל</option>
                <option value="therapist">מטפל</option>
                <option value="secretary">מזכירה</option>
              </select>
              {u.email !== currentUser?.email && (
                <button onClick={() => toggleActive(u.id, u.active)} style={{
                  padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
                  background: u.active ? '#fee2e2' : '#d1fae5',
                  color: u.active ? '#991b1b' : '#065f46',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
                }}>
                  {u.active ? 'השבת' : 'הפעל'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* New user modal */}
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '16px 20px', background: '#1a3a5c', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>+ משתמש חדש</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontFamily: 'Heebo, sans-serif' }}>×</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const }}>שם מלא</label>
                  <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="ישראל כהן" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const }}>אימייל</label>
                  <input type="email" style={{ ...inp, direction: 'ltr' }} value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@email.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const }}>סיסמה זמנית</label>
                  <input type="password" style={{ ...inp, direction: 'ltr' }} value={form.password} onChange={e => set('password', e.target.value)} placeholder="לפחות 6 תווים" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const }}>תפקיד</label>
                  <select style={inp} value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="admin">מנהל — גישה מלאה</option>
                    <option value="therapist">מטפל — יומן + SOAP</option>
                    <option value="secretary">מזכירה — יומן + מטופלים</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                  <button onClick={createUser} disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    {saving ? '⏳ יוצר...' : '✅ צור משתמש'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

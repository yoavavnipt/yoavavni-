'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'admin', label: 'מנהל' },
  { value: 'therapist', label: 'פיזיותרפיסט' },
  { value: 'trainer', label: 'מאמן' },
  { value: 'student', label: 'סטודנט' },
]

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'therapist', active: true })

  useEffect(() => { loadTherapists() }, [])

  async function loadTherapists() {
    setLoading(true)
    const { data } = await supabase.from('clinic_users').select('*').order('name')
    setTherapists(data || [])
    setLoading(false)
  }

  async function addTherapist() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('clinic_users').insert({
      name: form.name, email: form.email, phone: form.phone,
      role: form.role, active: form.active, permissions: '[]'
    })
    setForm({ name: '', email: '', phone: '', role: 'therapist', active: true })
    setShowForm(false)
    await loadTherapists()
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('clinic_users').update({ active: !current }).eq('id', id)
    setTherapists(prev => prev.map(t => t.id === id ? { ...t, active: !current } : t))
  }

  async function deleteTherapist(id: string) {
    if (!confirm('למחוק את המטפל?')) return
    await supabase.from('clinic_users').delete().eq('id', id)
    setTherapists(prev => prev.filter(t => t.id !== id))
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', direction: 'rtl' as const, boxSizing: 'border-box' as const }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>👥 ניהול מטפלים</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>הוסף ונהל מטפלים בקליניקה</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 18px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {showForm ? '✕ ביטול' : '+ הוסף מטפל'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a5c', marginBottom: '16px' }}>מטפל חדש</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>שם מלא *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="שם המטפל" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תפקיד</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>טלפון</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" style={{ ...inp, direction: 'ltr' as const }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מייל</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" style={{ ...inp, direction: 'ltr' as const }} />
              </div>
            </div>
            <button onClick={addTherapist} disabled={saving || !form.name.trim()}
              style={{ width: '100%', padding: '12px', background: saving || !form.name.trim() ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הוסף מטפל'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {therapists.map(t => (
              <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px', border: `1px solid ${t.active ? '#e2e8f0' : '#fee2e2'}` }}>
                <div style={{ width: '44px', height: '44px', background: t.active ? '#1a3a5c' : '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {t.role === 'admin' ? '👑' : t.role === 'therapist' ? '🏥' : t.role === 'trainer' ? '🏃' : '📚'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a3a5c' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {ROLES.find(r => r.value === t.role)?.label}
                    {t.phone && ` · ${t.phone}`}
                    {t.email && ` · ${t.email}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: t.active ? '#d1fae5' : '#fee2e2', color: t.active ? '#065f46' : '#dc2626' }}>
                    {t.active ? 'פעיל' : 'לא פעיל'}
                  </span>
                  <button onClick={() => toggleActive(t.id, t.active)}
                    style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    {t.active ? 'השבת' : 'הפעל'}
                  </button>
                  {t.role !== 'admin' && (
                    <button onClick={() => deleteTherapist(t.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '16px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

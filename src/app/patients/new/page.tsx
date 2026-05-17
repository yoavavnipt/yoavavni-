'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState } from 'react'
import { supabase, HMO_OPTIONS } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const inp = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '13px', outline: 'none',
  fontFamily: 'Heebo, sans-serif', background: '#fff',
} as const

const lbl = {
  display: 'block' as const, fontSize: '11px', fontWeight: '700' as const,
  color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const,
  letterSpacing: '0.04em'
}

const card = {
  background: '#fff', borderRadius: '12px', padding: '20px',
  marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
}

export default function NewPatientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', id_number: '', date_of_birth: '',
    phone: '', email: '', address: '', city: '',
    hmo: '', insurance: '', diagnosis: '', medical_history: '',
    medications: '', allergies: '', notes: '', status: 'active',
    emergency_contact_name: '', emergency_contact_phone: '',
  })

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function save() {
    if (!form.first_name || !form.last_name || !form.phone) {
      alert('שם פרטי, שם משפחה וטלפון הם שדות חובה')
      return
    }
    if (!form.email) {
      alert('אימייל הוא שדה חובה')
      return
    }
      return
    }
    setSaving(true)
    const { data, error } = await supabase.from('patients').insert([{
      ...form,
      date_of_birth: form.date_of_birth || null,
    }]).select().single()
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    router.push(`/patients/${data.id}`)
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '740px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>מטופל חדש</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>מילוי פרטים</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.back()} style={{
              padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '8px',
              background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
            }}>
              ביטול
            </button>
            <button onClick={save} disabled={saving} style={{
              padding: '9px 20px', background: saving ? '#94a3b8' : '#1a3a5c',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Heebo, sans-serif',
            }}>
              {saving ? '⏳ שומר...' : '💾 שמור מטופל'}
            </button>
          </div>
        </div>

        {/* Personal */}
        <div style={card}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            👤 פרטים אישיים
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>שם פרטי *</label><input style={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="ישראל" /></div>
            <div><label style={lbl}>שם משפחה *</label><input style={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="כהן" /></div>
            <div><label style={lbl}>מספר ת.ז.</label><input style={{ ...inp, direction: 'ltr' }} value={form.id_number} onChange={e => set('id_number', e.target.value)} placeholder="0000000000" /></div>
            <div><label style={lbl}>תאריך לידה</label><input type="date" style={inp} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
            <div><label style={lbl}>טלפון *</label><input style={{ ...inp, direction: 'ltr' }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050-0000000" /></div>
            <div><label style={lbl}>אימייל *</label><input type="email" style={{ ...inp, direction: 'ltr' }} value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@email.com" /></div>
            <div><label style={lbl}>כתובת</label><input style={inp} value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div><label style={lbl}>עיר</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} /></div>
          </div>
        </div>

        {/* Medical */}
        <div style={card}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            🏥 מידע רפואי
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lbl}>קופת חולים</label>
              <select style={inp} value={form.hmo} onChange={e => set('hmo', e.target.value)}>
                <option value="">בחר...</option>
                {HMO_OPTIONS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div><label style={lbl}>ביטוח</label><input style={inp} value={form.insurance} onChange={e => set('insurance', e.target.value)} placeholder="מגדל, הראל..." /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>אבחנה / תלונה עיקרית</label>
              <input style={inp} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="כאב גב תחתון, כתף קפואה..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>רקע רפואי</label>
              <textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={form.medical_history} onChange={e => set('medical_history', e.target.value)} placeholder="מחלות רקע, ניתוחים קודמים..." />
            </div>
            <div><label style={lbl}>תרופות</label><input style={inp} value={form.medications} onChange={e => set('medications', e.target.value)} /></div>
            <div><label style={lbl}>אלרגיות</label><input style={inp} value={form.allergies} onChange={e => set('allergies', e.target.value)} /></div>
          </div>
        </div>

        {/* Emergency */}
        <div style={card}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            🚨 איש קשר לשעת חירום
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>שם</label><input style={inp} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} /></div>
            <div><label style={lbl}>טלפון</label><input style={{ ...inp, direction: 'ltr' }} value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} /></div>
          </div>
        </div>

        {/* Notes + Status */}
        <div style={card}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
            📝 הערות וסטטוס
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>הערות כלליות</label>
              <textarea style={{ ...inp, minHeight: '70px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>סטטוס</label>
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">פעיל</option>
                <option value="lead">ליד</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
          <button onClick={() => router.back()} style={{
            padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '8px',
            background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
          }}>
            ביטול
          </button>
          <button onClick={save} disabled={saving} style={{
            padding: '10px 24px', background: saving ? '#94a3b8' : '#1a3a5c',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Heebo, sans-serif',
          }}>
            {saving ? '⏳ שומר...' : '💾 שמור מטופל'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

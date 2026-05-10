'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, Suspense } from 'react'
import { supabase, SERVICES } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const inp = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '13px', outline: 'none',
  fontFamily: 'Heebo, sans-serif', background: '#fff',
} as const

const lbl = {
  display: 'block' as const, fontSize: '11px', fontWeight: '700' as const,
  color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const,
}

export default function NewAppointmentPageWrapper() {
  return <Suspense fallback={<div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>טוען...</div>}><NewAppointmentPage /></Suspense>
}

function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatient = searchParams.get('patient')

  const [patients, setPatients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_id: preselectedPatient || '',
    service_type_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 45,
    price: 0,
    notes: '',
    status: 'confirmed',
  })
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')

  useEffect(() => { loadPatients() }, [])
  useEffect(() => {
    if (preselectedPatient && patients.length > 0) {
      const p = patients.find(p => p.id === preselectedPatient)
      if (p) setSelectedPatientName(`${p.first_name} ${p.last_name}`)
    }
  }, [patients, preselectedPatient])

  async function loadPatients() {
    const { data } = await supabase.from('patients').select('id,first_name,last_name,phone').eq('status', 'active').order('first_name')
    setPatients(data || [])
  }

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  function selectService(s: typeof SERVICES[0]) {
    set('price', s.price)
    set('duration', s.duration)
    // we'll store the service name as service_type_id reference later
    set('service_type_id', s.id)
  }

  async function save() {
    if (!form.patient_id || !form.date || !form.time) {
      alert('מטופל, תאריך ושעה הם שדות חובה')
      return
    }
    setSaving(true)
    // Try to find or create service_type
    let serviceTypeId = null
    if (form.service_type_id) {
      const { data: st } = await supabase.from('service_types').select('id').eq('id', form.service_type_id).single()
      serviceTypeId = st?.id || null
    }
    const { error } = await supabase.from('appointments').insert([{
      patient_id: form.patient_id,
      service_type_id: serviceTypeId,
      date: form.date,
      time: form.time,
      duration: form.duration,
      price: form.price,
      notes: form.notes,
      status: form.status,
    }])
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    if (form.patient_id) {
      router.push(`/patients/${form.patient_id}`)
    } else {
      router.push('/calendar')
    }
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.phone}`.includes(patientSearch)
  )

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '640px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>תור חדש</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.back()} style={{ padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: saving ? '#94a3b8' : '#3eb8e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳...' : '💾 שמור תור'}
            </button>
          </div>
        </div>

        {/* Patient select */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>👤 מטופל</h2>
          {form.patient_id && selectedPatientName ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <span style={{ fontWeight: '600' }}>{selectedPatientName}</span>
              <button onClick={() => { set('patient_id', ''); setSelectedPatientName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
            </div>
          ) : (
            <div>
              <input
                placeholder="🔍 חפש שם מטופל..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                style={{ ...inp, marginBottom: '8px' }}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filteredPatients.slice(0, 10).map(p => (
                  <div key={p.id}
                    onClick={() => { set('patient_id', p.id); setSelectedPatientName(`${p.first_name} ${p.last_name}`); setPatientSearch('') }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <span style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</span>
                    <span style={{ color: '#94a3b8', marginRight: '8px', fontSize: '11px' }}>{p.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service select */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>🏥 סוג שירות</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
            {SERVICES.map(s => (
              <div
                key={s.id}
                onClick={() => selectService(s)}
                style={{
                  padding: '12px', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${form.service_type_id === s.id ? s.color : '#e2e8f0'}`,
                  background: form.service_type_id === s.id ? `${s.color}10` : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '700' }}>{s.name_he}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>₪{s.price} · {s.duration} דק'</div>
              </div>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>📅 תאריך ושעה</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1/3' }}><label style={lbl}>תאריך</label><input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label style={lbl}>שעה</label><input type="time" style={inp} value={form.time} onChange={e => set('time', e.target.value)} /></div>
            <div><label style={lbl}>מחיר ₪</label><input type="number" style={inp} value={form.price} onChange={e => set('price', Number(e.target.value))} /></div>
            <div><label style={lbl}>משך (דק')</label><input type="number" style={inp} value={form.duration} onChange={e => set('duration', Number(e.target.value))} /></div>
            <div>
              <label style={lbl}>סטטוס</label>
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="confirmed">אושר</option>
                <option value="pending">ממתין</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={lbl}>הערות</label>
            <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות לתור..." />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

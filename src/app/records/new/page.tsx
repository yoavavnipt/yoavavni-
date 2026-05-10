'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
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

const SOAP_FIELDS = [
  { key: 'subjective',  label: 'S — Subjective',  color: '#3b82f6', placeholder: 'תלונות המטופל, כאב, תפקוד, שינויים מהטיפול הקודם...' },
  { key: 'objective',   label: 'O — Objective',   color: '#8b5cf6', placeholder: 'ממצאי בדיקה: ROM, כוח שריר, פאלפציה, תפקוד...' },
  { key: 'assessment',  label: 'A — Assessment',  color: '#f59e0b', placeholder: 'הערכת המטפל: שינוי לטובה/לרעה, מגמות...' },
  { key: 'plan',        label: 'P — Plan',         color: '#10b981', placeholder: 'תוכנית טיפול: טכניקות, תרגילים, מעקב...' },
]

export default function NewRecordPageWrapper() {
  return <Suspense fallback={<div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>טוען...</div>}><NewRecordPage /></Suspense>
}

function NewRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatient = searchParams.get('patient')

  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [form, setForm] = useState({
    patient_id: preselectedPatient || '',
    subjective: '', objective: '', assessment: '', plan: '',
    vas_score: null as number | null,
    notes: '',
    therapist_name: '',
  })

  useEffect(() => { loadPatients(); loadTherapists() }, [])
  useEffect(() => {
    if (preselectedPatient && patients.length > 0) {
      const p = patients.find(p => p.id === preselectedPatient)
      if (p) setSelectedPatientName(`${p.first_name} ${p.last_name}`)
    }
  }, [patients, preselectedPatient])

  async function loadPatients() {
    const { data } = await supabase.from('patients').select('id,first_name,last_name').eq('status', 'active').order('first_name')
    setPatients(data || [])
  }

  async function loadTherapists() {
    const { data } = await supabase.from('clinic_users').select('id,name,role').eq('active', true).in('role', ['admin','therapist']).order('name')
    setTherapists(data || [])
    // Set default from localStorage
    const saved = localStorage.getItem('clinic_user')
    if (saved) {
      const u = JSON.parse(saved)
      setForm(p => ({ ...p, therapist_name: u.name }))
    }
  }

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  async function save() {
    if (!form.patient_id) { alert('יש לבחור מטופל'); return }
    if (!form.therapist_name) { alert('יש לבחור מטפל'); return }
    if (!form.subjective && !form.objective && !form.assessment && !form.plan) { alert('יש למלא לפחות שדה אחד'); return }
    setSaving(true)
    const { error } = await supabase.from('treatment_records').insert([form])
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    router.push(form.patient_id ? `/patients/${form.patient_id}` : '/records')
  }

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const vasColor = form.vas_score != null
    ? form.vas_score > 6 ? '#ef4444' : form.vas_score > 3 ? '#f59e0b' : '#10b981'
    : '#94a3b8'

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '720px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>רשומת SOAP חדשה</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.back()} style={{ padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: saving ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '💾 שמור'}
            </button>
          </div>
        </div>

        {/* Patient */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px', color: '#1a3a5c' }}>👤 מטופל</h2>
          {form.patient_id && selectedPatientName ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <span style={{ fontWeight: '600' }}>{selectedPatientName}</span>
              <button onClick={() => { set('patient_id', ''); setSelectedPatientName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>
            </div>
          ) : (
            <div>
              <input placeholder="🔍 חפש מטופל..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ ...inp, marginBottom: '8px' }} />
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filteredPatients.slice(0, 8).map(p => (
                  <div key={p.id} onClick={() => { set('patient_id', p.id); setSelectedPatientName(`${p.first_name} ${p.last_name}`); setPatientSearch('') }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px', fontWeight: '500' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    {p.first_name} {p.last_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* VAS */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>🎯 VAS — עוצמת כאב</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => set('vas_score', form.vas_score === n ? null : n)} style={{
                width: '36px', height: '36px', borderRadius: '8px', border: '2px solid',
                borderColor: form.vas_score === n ? vasColor : '#e2e8f0',
                background: form.vas_score === n ? vasColor : '#fff',
                color: form.vas_score === n ? '#fff' : '#64748b',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                fontFamily: 'Heebo, sans-serif', transition: 'all 0.1s',
              }}>
                {n}
              </button>
            ))}
            {form.vas_score != null && (
              <span style={{ fontSize: '13px', fontWeight: '700', color: vasColor, marginRight: '8px' }}>
                {form.vas_score === 0 ? 'ללא כאב' : form.vas_score <= 3 ? 'קל' : form.vas_score <= 6 ? 'בינוני' : 'חזק'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
            <span>0 — ללא כאב</span><span>10 — כאב קיצוני</span>
          </div>
        </div>

        {/* SOAP Fields */}
        {SOAP_FIELDS.map(f => (
          <div key={f.key} style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRight: `3px solid ${f.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '24px', height: '24px', background: f.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: '#fff' }}>
                {f.key[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c' }}>{f.label}</span>
            </div>
            <textarea
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChange={e => set(f.key, e.target.value)}
              style={{ ...inp, minHeight: '90px', resize: 'vertical' }}
            />
          </div>
        ))}

        {/* Therapist + Notes */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={lbl}>מטפל *</label>
              <select style={inp} value={form.therapist_name} onChange={e => set('therapist_name', e.target.value)}>
                <option value="">בחר מטפל...</option>
                {therapists.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>הערות נוספות</label>
              <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '20px' }}>
          <button onClick={save} disabled={saving} style={{ padding: '10px 28px', background: saving ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {saving ? '⏳ שומר...' : '💾 שמור רשומה'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

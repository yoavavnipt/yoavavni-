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

export default function NewBillingPageWrapper() {
  return <Suspense fallback={<div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>טוען...</div>}><NewBillingPage /></Suspense>
}

function NewBillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prePatient = searchParams.get('patient')
  const [patients, setPatients] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [savedBilling, setSavedBilling] = useState<any>(null)
  const [form, setForm] = useState({
    patient_id: prePatient || '',
    amount: 0, description: '', status: 'paid', payment_method: 'מזומן', notes: '',
  })

  useEffect(() => { supabase.from('patients').select('id,first_name,last_name,phone,email').eq('status','active').order('first_name').then(({data}) => setPatients(data||[])) }, [])
  useEffect(() => {
    if (prePatient && patients.length > 0) {
      const p = patients.find(p => p.id === prePatient)
      if (p) { setSelectedPatientName(`${p.first_name} ${p.last_name}`); setSelectedPatient(p) }
    }
  }, [patients, prePatient])

  const set = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  async function save() {
    if (!form.patient_id || !form.amount) { alert('מטופל וסכום הם שדות חובה'); return }
    setSaving(true)
    const payload: any = { ...form, paid_at: form.status === 'paid' ? new Date().toISOString() : null }
    const { data, error } = await supabase.from('billing_records').insert([payload]).select().single()
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    setSavedBilling(data)
  }

  async function sendInvoice(type: 'receipt' | 'invoice') {
    if (!selectedPatient?.email) {
      alert('אין כתובת מייל למטופל זה. הוסף מייל בפרופיל המטופל.')
      return
    }
    if (!savedBilling) {
      alert('שמור את החיוב קודם')
      return
    }
    setSending(true)
    setSendMsg('')
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: selectedPatient, billing: savedBilling, type }),
      })
      const data = await res.json()
      if (data.error) { setSendMsg(`❌ שגיאה: ${data.error}`); }
      else { setSendMsg(`✅ ${type === 'receipt' ? 'חשבונית קבלה' : 'חשבונית עסקה'} נשלחה בהצלחה!`) }
    } catch { setSendMsg('❌ שגיאה בשליחה') }
    setSending(false)
  }

  const filtered = patients.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()))

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '560px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>חיוב חדש</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.back()} style={{ padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
            {!savedBilling ? (
              <button onClick={save} disabled={saving} style={{ padding: '9px 20px', background: saving ? '#94a3b8' : '#0b8a5e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {saving ? '⏳...' : '💾 שמור'}
              </button>
            ) : (
              <button onClick={() => router.push('/billing')} style={{ padding: '9px 20px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                סיום ←
              </button>
            )}
          </div>
        </div>

        {/* Patient */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px', color: '#1a3a5c' }}>👤 מטופל</h2>
          {form.patient_id && selectedPatientName ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div>
                <span style={{ fontWeight: '600' }}>{selectedPatientName}</span>
                {selectedPatient?.email && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📧 {selectedPatient.email}</div>}
                {!selectedPatient?.email && <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>⚠️ אין מייל — לא ניתן לשלוח חשבונית</div>}
              </div>
              {!savedBilling && <button onClick={() => { set('patient_id', ''); setSelectedPatientName(''); setSelectedPatient(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>×</button>}
            </div>
          ) : (
            <div>
              <input placeholder="🔍 חפש מטופל..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ ...inp, marginBottom: '8px' }} />
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filtered.slice(0, 8).map(p => (
                  <div key={p.id} onClick={() => { set('patient_id', p.id); setSelectedPatientName(`${p.first_name} ${p.last_name}`); setSelectedPatient(p); setPatientSearch('') }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px', fontWeight: '500' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    {p.first_name} {p.last_name}
                    {p.email && <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '8px' }}>📧</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick service prices */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '12px', fontSize: '14px', color: '#1a3a5c' }}>🏥 בחר סוג שירות</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
            {SERVICES.map(s => (
              <button key={s.id} onClick={() => { set('amount', s.price); set('description', s.name_he) }} disabled={!!savedBilling} style={{
                padding: '8px 4px', borderRadius: '8px', border: `2px solid ${form.description === s.name_he ? s.color : '#e2e8f0'}`,
                background: form.description === s.name_he ? `${s.color}10` : '#fff', cursor: savedBilling ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif',
                textAlign: 'center', transition: 'all 0.1s',
              }}>
                <div style={{ fontSize: '16px' }}>{s.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: '600', marginTop: '2px' }}>{s.name_he}</div>
                <div style={{ fontSize: '11px', color: s.color, fontWeight: '700' }}>₪{s.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>💰 פרטי תשלום</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>סכום ₪ *</label>
              <input type="number" style={inp} value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} placeholder="350" disabled={!!savedBilling} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>אמצעי תשלום</label>
              <select style={inp} value={form.payment_method} onChange={e => set('payment_method', e.target.value)} disabled={!!savedBilling}>
                {['מזומן', 'כרטיס אשראי', 'העברה בנקאית', 'ביט', 'פייבוקס'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תיאור</label>
              <input style={inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="פיזיותרפיה, הידרותרפיה..." disabled={!!savedBilling} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>סטטוס</label>
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)} disabled={!!savedBilling}>
                <option value="paid">שולם</option>
                <option value="pending">ממתין</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>הערות</label>
              <input style={inp} value={form.notes} onChange={e => set('notes', e.target.value)} disabled={!!savedBilling} />
            </div>
          </div>
        </div>

        {/* שליחת חשבונית במייל */}
        {savedBilling && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '2px solid #3eb8e5' }}>
            <h2 style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px', color: '#1a3a5c' }}>📧 שלח חשבונית במייל</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>החיוב נשמר! בחר סוג חשבונית לשליחה</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => sendInvoice('receipt')} disabled={sending || !selectedPatient?.email} style={{ padding: '12px', background: sending ? '#94a3b8' : '#0b8a5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: sending || !selectedPatient?.email ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {sending ? '⏳ שולח...' : '✅ חשבונית קבלה'}
              </button>
              <button onClick={() => sendInvoice('invoice')} disabled={sending || !selectedPatient?.email} style={{ padding: '12px', background: sending ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: sending || !selectedPatient?.email ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {sending ? '⏳ שולח...' : '📄 חשבונית עסקה'}
              </button>
            </div>
            {sendMsg && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: sendMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: sendMsg.startsWith('✅') ? '#065f46' : '#991b1b' }}>
                {sendMsg}
              </div>
            )}
            {!selectedPatient?.email && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>⚠️ הוסף כתובת מייל בפרופיל המטופל כדי לשלוח חשבונית</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

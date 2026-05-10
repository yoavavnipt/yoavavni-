'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, HMO_OPTIONS, APPOINTMENT_STATUS } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import WhatsAppPanel from '@/components/WhatsAppPanel'

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

export default function PatientProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [tab, setTab] = useState<'overview' | 'appointments' | 'records' | 'billing'>('overview')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    const [{ data: p }, { data: a }, { data: r }, { data: b }] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*, service:service_types(name_he,icon,color)').eq('patient_id', id).order('date', { ascending: false }).limit(20),
      supabase.from('treatment_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('billing_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
    ])
    setPatient(p)
    setForm(p || {})
    setAppointments(a || [])
    setRecords(r || [])
    setBilling(b || [])
    setLoading(false)
  }

  const set = (f: string, v: string) => setForm((p: any) => ({ ...p, [f]: v }))

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('patients').update(form).eq('id', id)
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    setPatient(form)
    setEditing(false)
  }

  const waLink = (phone: string) => `https://wa.me/972${phone?.replace(/^0/, '').replace(/-/g, '')}`
  const totalPaid = billing.filter(b => b.status === 'paid').reduce((s, b) => s + (b.amount || 0), 0)

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>טוען...</div>
    </AppLayout>
  )
  if (!patient) return (
    <AppLayout>
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>מטופל לא נמצא</div>
    </AppLayout>
  )

  const tabs = [
    { key: 'overview',     label: 'סקירה כללית' },
    { key: 'appointments', label: `תורים (${appointments.length})` },
    { key: 'records',      label: `SOAP (${records.length})` },
    { key: 'billing',      label: `חיוב (${billing.length})` },
  ]

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>←</button>
            <div style={{
              width: '52px', height: '52px', background: '#1a3a5c', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '800', color: '#fff', flexShrink: 0
            }}>
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>
                {patient.first_name} {patient.last_name}
              </h1>
              <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                {patient.phone && <a href={`tel:${patient.phone}`} style={{ color: '#1a3a5c', fontWeight: '600' }}>{patient.phone}</a>}
                {patient.hmo && <span>{patient.hmo}</span>}
                {patient.diagnosis && <span style={{ color: '#7c3aed' }}>• {patient.diagnosis}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {patient.phone && (
              <WhatsAppPanel patient={patient} appointments={appointments} />
            )}
            <Link href={`/records/new?patient=${id}`} style={{
              padding: '8px 14px', background: '#7c3aed', color: '#fff',
              borderRadius: '8px', fontSize: '12px', fontWeight: '700'
            }}>
              + SOAP
            </Link>
            <Link href={`/calendar/new?patient=${id}`} style={{
              padding: '8px 14px', background: '#3eb8e5', color: '#fff',
              borderRadius: '8px', fontSize: '12px', fontWeight: '700'
            }}>
              + תור
            </Link>
            <button onClick={() => setEditing(!editing)} style={{
              padding: '8px 14px', background: editing ? '#e2e8f0' : '#1a3a5c', color: editing ? '#475569' : '#fff',
              border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
            }}>
              {editing ? 'ביטול' : '✏️ עריכה'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'סה"כ תורים', value: appointments.length, icon: '📅', color: '#3eb8e5' },
            { label: 'טיפולים SOAP', value: records.length, icon: '📋', color: '#7c3aed' },
            { label: 'שולם סה"כ', value: `₪${totalPaid.toLocaleString()}`, icon: '💰', color: '#0b8a5e' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: '10px', padding: '14px',
              borderRight: `3px solid ${s.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '16px', gap: '0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === t.key ? '700' : '400',
              color: tab === t.key ? '#1a3a5c' : '#94a3b8',
              borderBottom: tab === t.key ? '2px solid #1a3a5c' : '2px solid transparent',
              marginBottom: '-2px', fontFamily: 'Heebo, sans-serif',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Section title="📋 פרטים אישיים">
              {editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={lbl}>שם פרטי</label><input style={inp} value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} /></div>
                  <div><label style={lbl}>שם משפחה</label><input style={inp} value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} /></div>
                  <div><label style={lbl}>טלפון</label><input style={{ ...inp, direction: 'ltr' }} value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
                  <div><label style={lbl}>אימייל</label><input style={{ ...inp, direction: 'ltr' }} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
                  <div><label style={lbl}>ת.ז.</label><input style={{ ...inp, direction: 'ltr' }} value={form.id_number || ''} onChange={e => set('id_number', e.target.value)} /></div>
                  <div><label style={lbl}>תאריך לידה</label><input type="date" style={inp} value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>כתובת</label><input style={inp} value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
                </div>
              ) : (
                <Fields fields={[
                  ['שם', `${patient.first_name} ${patient.last_name}`],
                  ['ת.ז.', patient.id_number],
                  ['תאריך לידה', patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('he-IL') : null],
                  ['טלפון', patient.phone],
                  ['אימייל', patient.email],
                  ['כתובת', [patient.address, patient.city].filter(Boolean).join(', ')],
                ]} />
              )}
            </Section>

            <Section title="🏥 מידע רפואי">
              {editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>קופ"ח</label>
                    <select style={inp} value={form.hmo || ''} onChange={e => set('hmo', e.target.value)}>
                      <option value="">בחר...</option>
                      {HMO_OPTIONS.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>ביטוח</label><input style={inp} value={form.insurance || ''} onChange={e => set('insurance', e.target.value)} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>אבחנה</label><input style={inp} value={form.diagnosis || ''} onChange={e => set('diagnosis', e.target.value)} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>רקע רפואי</label><textarea style={{ ...inp, minHeight: '80px', resize: 'vertical' }} value={form.medical_history || ''} onChange={e => set('medical_history', e.target.value)} /></div>
                  <div><label style={lbl}>תרופות</label><input style={inp} value={form.medications || ''} onChange={e => set('medications', e.target.value)} /></div>
                  <div><label style={lbl}>אלרגיות</label><input style={inp} value={form.allergies || ''} onChange={e => set('allergies', e.target.value)} /></div>
                </div>
              ) : (
                <Fields fields={[
                  ['קופ"ח', patient.hmo],
                  ['ביטוח', patient.insurance],
                  ['אבחנה', patient.diagnosis],
                  ['רקע רפואי', patient.medical_history],
                  ['תרופות', patient.medications],
                  ['אלרגיות', patient.allergies],
                ]} />
              )}
            </Section>

            {editing && (
              <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button onClick={() => setEditing(false)} style={{
                  padding: '9px 16px', border: '1px solid #e2e8f0', borderRadius: '8px',
                  background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
                }}>
                  ביטול
                </button>
                <button onClick={save} disabled={saving} style={{
                  padding: '9px 20px', background: '#1a3a5c', color: '#fff', border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
                }}>
                  {saving ? '⏳ שומר...' : '💾 שמור שינויים'}
                </button>
              </div>
            )}

            {patient.notes && (
              <div style={{ gridColumn: '1/-1', background: '#fffbeb', borderRadius: '10px', padding: '14px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>📝 הערות</div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>{patient.notes}</div>
              </div>
            )}
          </div>
        )}

        {/* Appointments tab */}
        {tab === 'appointments' && (
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>היסטוריית תורים</div>
              <Link href={`/calendar/new?patient=${id}`} style={{ padding: '6px 12px', background: '#3eb8e5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>+ תור חדש</Link>
            </div>
            {appointments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>אין תורים</div>
            ) : appointments.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < appointments.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', minWidth: '90px', color: '#1a3a5c' }}>
                  {new Date(a.date).toLocaleDateString('he-IL')}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', minWidth: '50px' }}>{a.time?.slice(0, 5)}</div>
                <div style={{ flex: 1, fontSize: '13px' }}>{a.service?.icon} {a.service?.name_he}</div>
                {a.price && <div style={{ fontSize: '13px', fontWeight: '600', color: '#0b8a5e' }}>₪{a.price}</div>}
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}

        {/* SOAP tab */}
        {tab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={`/records/new?patient=${id}`} style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>+ רשומת SOAP חדשה</Link>
            </div>
            {records.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>אין רשומות SOAP</div>
            ) : records.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{new Date(r.created_at).toLocaleDateString('he-IL')}</div>
                  {r.vas_score != null && (
                    <span style={{ padding: '2px 10px', background: r.vas_score > 6 ? '#fee2e2' : r.vas_score > 3 ? '#fef3c7' : '#d1fae5', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: r.vas_score > 6 ? '#991b1b' : r.vas_score > 3 ? '#92400e' : '#065f46' }}>
                      VAS {r.vas_score}/10
                    </span>
                  )}
                </div>
                {r.subjective && <SoapField label="S" text={r.subjective} />}
                {r.objective && <SoapField label="O" text={r.objective} />}
                {r.assessment && <SoapField label="A" text={r.assessment} />}
                {r.plan && <SoapField label="P" text={r.plan} />}
              </div>
            ))}
          </div>
        )}

        {/* Billing tab */}
        {tab === 'billing' && (
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>חיובים</div>
                <div style={{ fontSize: '11px', color: '#0b8a5e', marginTop: '2px' }}>סה"כ שולם: ₪{totalPaid.toLocaleString()}</div>
              </div>
              <Link href={`/billing/new?patient=${id}`} style={{ padding: '6px 12px', background: '#0b8a5e', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>+ חיוב חדש</Link>
            </div>
            {billing.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>אין חיובים</div>
            ) : billing.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < billing.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', minWidth: '90px' }}>{new Date(b.created_at).toLocaleDateString('he-IL')}</div>
                <div style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>{b.description || 'טיפול'}</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c' }}>₪{(b.amount || 0).toLocaleString()}</div>
                <BillingBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h3 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '13px', color: '#64748b' }}>{title}</h3>
      {children}
    </div>
  )
}

function Fields({ fields }: { fields: [string, string | null | undefined][] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {fields.filter(([, v]) => v).map(([label, value]) => (
        <div key={label} style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8', minWidth: '80px', flexShrink: 0 }}>{label}</span>
          <span style={{ fontWeight: '500', color: '#1e293b' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function SoapField({ label, text }: { label: string; text: string }) {
  const colors: Record<string, string> = { S: '#3b82f6', O: '#8b5cf6', A: '#f59e0b', P: '#10b981' }
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px' }}>
      <span style={{
        width: '22px', height: '22px', background: colors[label] || '#94a3b8',
        borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '800', color: '#fff', flexShrink: 0
      }}>
        {label}
      </span>
      <span style={{ color: '#374151', lineHeight: '1.5' }}>{text}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = APPOINTMENT_STATUS[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color }}>{s.label}</span>
}

function BillingBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    paid:    { label: 'שולם',   bg: '#d1fae5', color: '#065f46' },
    pending: { label: 'ממתין',  bg: '#fef3c7', color: '#92400e' },
    cancelled: { label: 'בוטל', bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color }}>{s.label}</span>
}

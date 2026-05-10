'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SERVICES } from '@/lib/supabase'

export default function BookPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm' | 'done'>('service')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')

  const TIMES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

  useEffect(() => {
    const saved = sessionStorage.getItem('portal_patient')
    if (!saved) { router.push('/portal'); return }
    setPatient(JSON.parse(saved))
    // Default to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
  }, [])

  async function book() {
    if (!patient || !selectedService || !selectedDate || !selectedTime) return
    setSaving(true)
    await supabase.from('appointments').insert([{
      patient_id: patient.id,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
      price: selectedService.price,
      notes: notes || `הזמנה עצמית — ${selectedService.name_he}`,
    }])
    setSaving(false)
    setStep('done')
  }

  if (!patient) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => step === 'service' ? router.push('/portal') : setStep('service')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontFamily: 'Heebo, sans-serif' }}>
          ←
        </button>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>קביעת תור</div>
      </div>

      {/* Progress */}
      <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', gap: '6px' }}>
        {['בחר שירות', 'תאריך ושעה', 'אישור'].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: '4px', borderRadius: '2px', marginBottom: '4px',
              background: ['service','datetime','confirm','done'].indexOf(step) >= i ? '#3eb8e5' : '#e2e8f0'
            }} />
            <div style={{ fontSize: '10px', color: ['service','datetime','confirm','done'].indexOf(step) >= i ? '#1a3a5c' : '#94a3b8', fontWeight: '600' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>

        {/* STEP 1 — Service */}
        {step === 'service' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', marginBottom: '16px' }}>איזה טיפול תרצה לקבוע?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SERVICES.filter(s => s.price > 0).map(s => (
                <div key={s.id} onClick={() => { setSelectedService(s); setStep('datetime') }} style={{
                  background: '#fff', borderRadius: '12px', padding: '16px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '2px solid transparent', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = s.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <div style={{ width: '48px', height: '48px', background: `${s.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>{s.name_he}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.duration} דקות</div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: s.color }}>₪{s.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Date & Time */}
        {step === 'datetime' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '24px' }}>{selectedService?.icon}</span>
              <div>
                <div style={{ fontWeight: '700', color: '#1a3a5c' }}>{selectedService?.name_he}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>₪{selectedService?.price} · {selectedService?.duration} דקות</div>
              </div>
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>בחר תאריך</h2>
            <input type="date" value={selectedDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'Heebo, sans-serif', marginBottom: '18px' }} />

            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>בחר שעה</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '18px' }}>
              {TIMES.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)} style={{
                  padding: '10px 6px', border: `2px solid ${selectedTime === t ? '#3eb8e5' : '#e2e8f0'}`,
                  borderRadius: '8px', background: selectedTime === t ? '#3eb8e5' : '#fff',
                  color: selectedTime === t ? '#fff' : '#374151',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>הערות (אופציונלי)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="מידע נוסף שחשוב לדעת..."
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', minHeight: '70px', resize: 'vertical' }} />
            </div>

            <button onClick={() => selectedDate && selectedTime && setStep('confirm')}
              disabled={!selectedDate || !selectedTime}
              style={{
                width: '100%', padding: '13px', background: (!selectedDate || !selectedTime) ? '#94a3b8' : '#1a3a5c',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '800', cursor: (!selectedDate || !selectedTime) ? 'not-allowed' : 'pointer',
                fontFamily: 'Heebo, sans-serif',
              }}>
              המשך לאישור →
            </button>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 'confirm' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', marginBottom: '16px' }}>אישור קביעת תור</h2>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {[
                { label: 'שירות', value: `${selectedService?.icon} ${selectedService?.name_he}` },
                { label: 'תאריך', value: new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'שעה', value: selectedTime },
                { label: 'מחיר', value: `₪${selectedService?.price}` },
                { label: 'מיקום', value: 'תרשיש 8, גילון' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>{r.label}</span>
                  <span style={{ fontWeight: '700', color: '#1a3a5c' }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
              ⚠️ ביטול או שינוי יש לבצע עד יום לפני ב-10:00. מעבר לכך ייגבה חיוב מלא.
            </div>

            <button onClick={book} disabled={saving} style={{
              width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#3eb8e5',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Heebo, sans-serif', boxShadow: '0 4px 14px rgba(62,184,229,0.35)',
            }}>
              {saving ? '⏳ שולח...' : '✅ אשר קביעת תור'}
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c', marginBottom: '8px' }}>התור נקבע!</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              {selectedService?.name_he} · {new Date(selectedDate).toLocaleDateString('he-IL')} · {selectedTime}
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              נשלח אליך אישור בקרוב. נתראה בקליניקה!
            </p>
            <button onClick={() => router.push('/portal')} style={{
              padding: '12px 28px', background: '#1a3a5c', color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
            }}>
              חזור לפורטל
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

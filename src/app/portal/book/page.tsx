'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SERVICES, CLINIC } from '@/lib/supabase'

export default function BookPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm' | 'done'>('service')
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [slotDates, setSlotDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('portal_patient')
    if (!saved) { router.push('/portal'); return }
    setPatient(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (step === 'datetime') loadSlots()
  }, [step])

  async function loadSlots() {
    setLoadingSlots(true)
    const today = new Date().toISOString().split('T')[0]
    const future = new Date()
    future.setDate(future.getDate() + 30)
    const futureStr = future.toISOString().split('T')[0]

    const { data } = await supabase
      .from('available_slots')
      .select('*')
      .eq('status', 'open')
      .gte('date', today)
      .lte('date', futureStr)
      .order('date').order('time')

    setAvailableSlots(data || [])
    const dates = [...new Set((data || []).map((s: any) => s.date))]
    setSlotDates(dates)
    if (dates.length > 0) setSelectedDate(dates[0])
    setLoadingSlots(false)
  }

  async function book() {
    if (!patient || !selectedService || !selectedSlot) return
    setSaving(true)

    // Check 24hr rule
    const slotDateTime = new Date(`${selectedSlot.date}T${selectedSlot.time}`)
    const now = new Date()
    const diffHours = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (diffHours < 24) {
      alert('לא ניתן לקבוע תור בפחות מ-24 שעות מראש. אנא צור קשר עם הקליניקה.')
      setSaving(false)
      return
    }

    // Book the slot
    await supabase.from('available_slots').update({ status: 'booked', patient_id: patient.id }).eq('id', selectedSlot.id)

    // Create appointment
    await supabase.from('appointments').insert([{
      patient_id: patient.id,
      date: selectedSlot.date,
      time: selectedSlot.time,
      status: 'confirmed',
      price: selectedService.price,
      notes: notes || `הזמנה עצמית — ${selectedService.name_he}`,
    }])

    // Send WhatsApp to clinic
    const clinicMsg = encodeURIComponent(`📅 תור חדש!\n\n${patient.first_name} ${patient.last_name}\n${selectedService.name_he}\n${new Date(selectedSlot.date).toLocaleDateString('he-IL')} · ${selectedSlot.time}\nטלפון: ${patient.phone}`)
    window.open(`https://wa.me/972545953889?text=${clinicMsg}`, '_blank')

    // Send WhatsApp to patient
    if (patient.phone) {
      const patientMsg = encodeURIComponent(`שלום ${patient.first_name} 😊\n\nהתור שלך אושר!\n\n📅 ${new Date(selectedSlot.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ ${selectedSlot.time}\n🏥 ${selectedService.name_he}\n📍 ${CLINIC.address}\n\nלביטול — לפחות 24 שעות מראש.\nקליניקת יואב אבני · ${CLINIC.phone}`)
      setTimeout(() => window.open(`https://wa.me/972${patient.phone.replace(/^0/,'').replace(/-/g,'')}?text=${patientMsg}`, '_blank'), 1500)
    }

    setSaving(false)
    setStep('done')
  }

  if (!patient) return null

  const slotsForDate = availableSlots.filter(s => s.date === selectedDate)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => step === 'service' ? router.push('/portal') : setStep('service')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontFamily: 'Heebo, sans-serif' }}>←</button>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>קביעת תור</div>
      </div>

      {/* Progress */}
      <div style={{ background: '#fff', padding: '10px 20px', display: 'flex', gap: '6px' }}>
        {['בחר שירות', 'בחר שעה', 'אישור'].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '4px', borderRadius: '2px', marginBottom: '4px', background: ['service','datetime','confirm','done'].indexOf(step) >= i ? '#3eb8e5' : '#e2e8f0' }} />
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
              {SERVICES.filter(s => s.price > 0 && !s.id.includes('run')).map(s => (
                <div key={s.id} onClick={() => { setSelectedService(s); setStep('datetime') }} style={{
                  background: '#fff', borderRadius: '12px', padding: '16px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '2px solid transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = s.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <div style={{ width: '48px', height: '48px', background: `${s.color}15`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
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

        {/* STEP 2 — DateTime from slots */}
        {step === 'datetime' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '24px' }}>{selectedService?.icon}</span>
              <div>
                <div style={{ fontWeight: '700', color: '#1a3a5c' }}>{selectedService?.name_he}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>₪{selectedService?.price} · {selectedService?.duration} דקות</div>
              </div>
            </div>

            {loadingSlots ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען שעות זמינות...</div>
            ) : slotDates.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>😔</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a5c', marginBottom: '8px' }}>אין שעות פנויות כרגע</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>נסה שוב מאוחר יותר או צור קשר</div>
                <a href={`https://wa.me/972545953889`} target="_blank" rel="noreferrer"
                  style={{ padding: '11px 22px', background: '#25d366', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                  💬 צור קשר
                </a>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>בחר תאריך</h2>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '4px' }}>
                  {slotDates.map(date => (
                    <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(null) }} style={{
                      padding: '10px 14px', border: `2px solid ${selectedDate === date ? '#3eb8e5' : '#e2e8f0'}`,
                      borderRadius: '10px', background: selectedDate === date ? '#3eb8e5' : '#fff',
                      color: selectedDate === date ? '#fff' : '#374151',
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {new Date(date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                    </button>
                  ))}
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '12px' }}>בחר שעה</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '18px' }}>
                  {slotsForDate.map(slot => (
                    <button key={slot.id} onClick={() => setSelectedSlot(slot)} style={{
                      padding: '12px 6px', border: `2px solid ${selectedSlot?.id === slot.id ? '#3eb8e5' : '#e2e8f0'}`,
                      borderRadius: '8px', background: selectedSlot?.id === slot.id ? '#3eb8e5' : '#fff',
                      color: selectedSlot?.id === slot.id ? '#fff' : '#374151',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                    }}>
                      {slot.time?.slice(0,5)}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>הערות (אופציונלי)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="מידע נוסף..."
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', minHeight: '60px', resize: 'vertical' }} />
                </div>

                <button onClick={() => selectedSlot && setStep('confirm')} disabled={!selectedSlot}
                  style={{ width: '100%', padding: '13px', background: !selectedSlot ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: !selectedSlot ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                  המשך לאישור →
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 'confirm' && selectedSlot && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', marginBottom: '16px' }}>אישור קביעת תור</h2>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {[
                { label: 'שירות', value: `${selectedService?.icon} ${selectedService?.name_he}` },
                { label: 'תאריך', value: new Date(selectedSlot.date).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'שעה', value: selectedSlot.time?.slice(0,5) },
                { label: 'מחיר', value: `₪${selectedService?.price}` },
                { label: 'מיקום', value: CLINIC.address },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>{r.label}</span>
                  <span style={{ fontWeight: '700', color: '#1a3a5c' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
              ⚠️ ביטול או שינוי יש לבצע לפחות 24 שעות מראש. מעבר לכך ייגבה חיוב מלא.
            </div>
            <button onClick={book} disabled={saving} style={{ width: '100%', padding: '14px', background: saving ? '#94a3b8' : '#3eb8e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif', boxShadow: '0 4px 14px rgba(62,184,229,0.35)' }}>
              {saving ? '⏳ מאשר...' : '✅ אשר קביעת תור'}
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c', marginBottom: '8px' }}>התור נקבע!</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              {selectedService?.name_he} · {selectedSlot && new Date(selectedSlot.date).toLocaleDateString('he-IL')} · {selectedSlot?.time?.slice(0,5)}
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              נשלח אישור ב-WhatsApp. נתראה בקליניקה! 😊
            </p>
            <button onClick={() => router.push('/portal')} style={{ padding: '12px 28px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              חזור לפורטל
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

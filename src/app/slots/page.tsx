'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const TIMES = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי']

function getWeekDates(offset = 0) {
  const today = new Date()
  const day = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - day + offset * 7)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<any[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [bulk, setBulk] = useState({ startTime: '09:00', endTime: '17:00', interval: '45', days: [0,1,2,3,4], duration: '45' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('clinic_user')
    if (u) setCurrentUser(JSON.parse(u))
  }, [])

  useEffect(() => {
    const dates = getWeekDates(weekOffset)
    setWeekDates(dates)
    loadSlots(dates)
  }, [weekOffset])

  async function loadSlots(dates: Date[]) {
    setLoading(true)
    const start = dates[0].toISOString().split('T')[0]
    const end = dates[dates.length - 1].toISOString().split('T')[0]
    const { data } = await supabase
      .from('available_slots')
      .select('*, patient:patients(first_name,last_name,phone)')
      .gte('date', start)
      .lte('date', end)
      .order('date').order('time')
    setSlots(data || [])
    setLoading(false)
  }

  async function addSlot(date: string, time: string) {
    if (!currentUser) return
    const exists = slots.find(s => s.date === date && s.time === time)
    if (exists) return
    await supabase.from('available_slots').insert([{
      date, time, therapist_name: currentUser.name,
      therapist_id: currentUser.id, duration: 45, status: 'open'
    }])
    loadSlots(weekDates)
  }

  async function removeSlot(id: string, status: string) {
    if (status === 'booked') { alert('לא ניתן למחוק שעה שכבר תפוסה'); return }
    await supabase.from('available_slots').delete().eq('id', id)
    loadSlots(weekDates)
  }

  async function addBulkSlots() {
    if (!currentUser) return
    setSaving(true)
    const toInsert: any[] = []
    const start = parseInt(bulk.startTime.split(':')[0]) * 60 + parseInt(bulk.startTime.split(':')[1])
    const end = parseInt(bulk.endTime.split(':')[0]) * 60 + parseInt(bulk.endTime.split(':')[1])
    const interval = parseInt(bulk.interval)

    bulk.days.forEach(dayIdx => {
      const date = weekDates[dayIdx]
      if (!date) return
      const dateStr = date.toISOString().split('T')[0]
      for (let t = start; t < end; t += interval) {
        const h = Math.floor(t / 60).toString().padStart(2, '0')
        const m = (t % 60).toString().padStart(2, '0')
        const time = `${h}:${m}`
        const exists = slots.find(s => s.date === dateStr && s.time === time)
        if (!exists) {
          toInsert.push({ date: dateStr, time, therapist_name: currentUser.name, therapist_id: currentUser.id, duration: parseInt(bulk.duration), status: 'open' })
        }
      }
    })

    if (toInsert.length > 0) {
      await supabase.from('available_slots').insert(toInsert)
    }
    setSaving(false)
    setShowBulk(false)
    loadSlots(weekDates)
  }

  async function approveCancel(slot: any) {
    await supabase.from('available_slots').update({ status: 'open', patient_id: null }).eq('id', slot.id)
    // Send WhatsApp to patient
    if (slot.patient?.phone) {
      const phone = slot.patient.phone.replace(/^0/, '').replace(/-/g, '')
      const msg = encodeURIComponent(`שלום ${slot.patient.first_name},\n\nהתור שלך לתאריך ${new Date(slot.date).toLocaleDateString('he-IL')} בשעה ${slot.time} בוטל על ידי הקליניקה.\n\nנשמח לתאם תור חלופי.\nקליניקת יואב אבני · ${CLINIC.phone}`)
      window.open(`https://wa.me/972${phone}?text=${msg}`, '_blank')
    }
    loadSlots(weekDates)
  }

  const inp = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none', background: '#fff' } as const

  const weekLabel = weekOffset === 0 ? 'השבוע' : weekOffset === 1 ? 'שבוע הבא' : `+${weekOffset} שבועות`

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📅 שעות פתוחות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>הגדר שעות שמטופלים יכולים לקבוע תורים</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ ...inp, cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a5c', minWidth: '80px', textAlign: 'center' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ ...inp, cursor: 'pointer' }}>→</button>
            <button onClick={() => setShowBulk(true)} style={{ padding: '8px 14px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              + פתח שעות בבulk
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { color: '#d1fae5', text: '#065f46', label: '✓ פתוח' },
            { color: '#dbeafe', text: '#1e40af', label: '👤 תפוס' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <div style={{ width: '16px', height: '16px', background: l.color, borderRadius: '3px' }} />
              <span style={{ color: '#64748b' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Week grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '8px' }}>
            {weekDates.map((date, dayIdx) => {
              const dateStr = date.toISOString().split('T')[0]
              const daySlots = slots.filter(s => s.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
              const isPast = date < new Date(new Date().setHours(0,0,0,0))

              return (
                <div key={dayIdx} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: isPast ? 0.6 : 1 }}>
                  {/* Day header */}
                  <div style={{ padding: '8px', background: '#1a3a5c', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{DAYS[dayIdx]}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</div>
                  </div>

                  {/* Slots */}
                  <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '100px' }}>
                    {daySlots.map(slot => (
                      <div key={slot.id} style={{
                        padding: '4px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: '600',
                        background: slot.status === 'booked' ? '#dbeafe' : '#d1fae5',
                        color: slot.status === 'booked' ? '#1e40af' : '#065f46',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer',
                      }}>
                        <span>{slot.time?.slice(0,5)}</span>
                        {slot.status === 'booked' ? (
                          <span style={{ fontSize: '9px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50px' }}>
                            {slot.patient?.first_name}
                          </span>
                        ) : (
                          !isPast && (
                            <button onClick={() => removeSlot(slot.id, slot.status)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', padding: '0', lineHeight: '1' }}>×</button>
                          )
                        )}
                      </div>
                    ))}

                    {!isPast && (
                      <select onChange={e => { if (e.target.value) { addSlot(dateStr, e.target.value); e.target.value = '' } }}
                        style={{ fontSize: '10px', border: '1px dashed #e2e8f0', borderRadius: '5px', padding: '3px', fontFamily: 'Heebo, sans-serif', marginTop: '2px', cursor: 'pointer', background: '#f8fafc' }}>
                        <option value="">+ הוסף</option>
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Booked slots management */}
        {slots.filter(s => s.status === 'booked').length > 0 && (
          <div style={{ marginTop: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '13px', color: '#1a3a5c' }}>
              👤 תורים קבועים השבוע
            </div>
            {slots.filter(s => s.status === 'booked').map(slot => (
              <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{slot.patient?.first_name} {slot.patient?.last_name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(slot.date).toLocaleDateString('he-IL')} · {slot.time?.slice(0,5)}</div>
                </div>
                {slot.patient?.phone && (
                  <a href={`https://wa.me/972${slot.patient.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ padding: '5px 10px', background: '#25d366', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>
                    WA
                  </a>
                )}
                <button onClick={() => approveCancel(slot)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                  בטל תור
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bulk modal */}
        {showBulk && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '16px 20px', background: '#1a3a5c', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>פתיחת שעות בבulk</div>
                <button onClick={() => setShowBulk(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontFamily: 'Heebo, sans-serif' }}>×</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>מ-שעה</label>
                    <select style={inp} value={bulk.startTime} onChange={e => setBulk(p => ({ ...p, startTime: e.target.value }))}>
                      {TIMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>עד-שעה</label>
                    <select style={inp} value={bulk.endTime} onChange={e => setBulk(p => ({ ...p, endTime: e.target.value }))}>
                      {TIMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>כל כמה דק'</label>
                    <select style={inp} value={bulk.interval} onChange={e => setBulk(p => ({ ...p, interval: e.target.value }))}>
                      <option value="30">30 דק'</option>
                      <option value="45">45 דק'</option>
                      <option value="60">60 דק'</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>ימים</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {DAYS.map((day, i) => (
                      <button key={i} onClick={() => setBulk(p => ({ ...p, days: p.days.includes(i) ? p.days.filter(d => d !== i) : [...p.days, i] }))}
                        style={{ padding: '6px 12px', border: `2px solid ${bulk.days.includes(i) ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '8px', background: bulk.days.includes(i) ? '#1a3a5c' : '#fff', color: bulk.days.includes(i) ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => setShowBulk(false)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                  <button onClick={addBulkSlots} disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    {saving ? '⏳ פותח שעות...' : '✅ פתח שעות'}
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

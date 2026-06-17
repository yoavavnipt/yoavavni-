'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const TIMES = ['07:00','07:45','08:30','09:15','10:00','10:45','11:30','12:15','14:15','15:00','15:45','16:30','17:15','18:00','21:00','21:45','22:30']
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי']

const SLOT_TYPES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  clinic:     { label: 'פיזיותרפיה בקליניקה', color: '#1e40af', bg: '#dbeafe', icon: '🏥' },
  hydro:      { label: 'פיזיותרפיה במים',     color: '#0369a1', bg: '#e0f2fe', icon: '🏊' },
  home_visit: { label: 'ביקור בית',            color: '#92400e', bg: '#fef3c7', icon: '🏠' },
}

// מטפלים נטענים מ-Supabase דינמית

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
  const [therapists, setTherapists] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState<{date: string, time: string} | null>(null)
  const [slotCapacity, setSlotCapacity] = useState(1)
  const [customTime, setCustomTime] = useState('')
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [selectedTherapist, setSelectedTherapist] = useState('yoav')
  const [selectedType, setSelectedType] = useState('clinic')
  const [filterTherapist, setFilterTherapist] = useState('all')
  const [bulk, setBulk] = useState({ 
    startTime: '06:15', endTime: '23:00', interval: '45', 
    days: [0,1,2,3,4], duration: '45',
    therapist: 'yoav', slotType: 'clinic'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('clinic_user')
    if (u) setCurrentUser(JSON.parse(u))
    loadTherapists()
  }, [])

  async function loadTherapists() {
    const { data } = await supabase.from('clinic_users').select('id,name,role').eq('active', true).order('name')
    setTherapists(data || [])
    if (data && data.length > 0) setSelectedTherapist(data[0].id)
  }

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
    const exists = slots.find(s => s.date === date && s.time === time && s.therapist_id === selectedTherapist)
    if (exists) return
    await supabase.from('available_slots').insert([{
      date, time,
      therapist_name: therapists.find((t: any) => t.id === selectedTherapist)?.name || currentUser.name,
      therapist_id: selectedTherapist,
      slot_type: selectedType,
      duration: 45, status: 'open',
      capacity: slotCapacity
    }])
    setShowAddSlot(null)
    loadSlots(weekDates)
  }

  async function removeSlot(id: string, status: string) {
    if (status === 'booked') { alert('לא ניתן למחוק שעה תפוסה'); return }
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
    const therapistName = therapists.find((t: any) => t.id === bulk.therapist)?.name || currentUser.name

    bulk.days.forEach(dayIdx => {
      const date = weekDates[dayIdx]
      if (!date) return
      const dateStr = date.toISOString().split('T')[0]
      for (let t = start; t < end; t += interval) {
        const h = Math.floor(t / 60).toString().padStart(2, '0')
        const m = (t % 60).toString().padStart(2, '0')
        const time = `${h}:${m}`
        const exists = slots.find(s => s.date === dateStr && s.time === time && s.therapist_id === bulk.therapist)
        if (!exists) {
          toInsert.push({ 
            date: dateStr, time, 
            therapist_name: therapistName,
            therapist_id: bulk.therapist,
            slot_type: bulk.slotType,
            duration: parseInt(bulk.duration), 
            status: 'open' 
          })
        }
      }
    })

    if (toInsert.length > 0) await supabase.from('available_slots').insert(toInsert)
    setSaving(false)
    setShowBulk(false)
    loadSlots(weekDates)
  }

  async function approveCancel(slot: any) {
    await supabase.from('available_slots').update({ status: 'open', patient_id: null }).eq('id', slot.id)
    if (slot.patient?.phone) {
      const phone = slot.patient.phone.replace(/^0/, '').replace(/-/g, '')
      const msg = encodeURIComponent(`שלום ${slot.patient.first_name},\n\nהתור שלך לתאריך ${new Date(slot.date).toLocaleDateString('he-IL')} בשעה ${slot.time} בוטל.\n\nנשמח לתאם תור חלופי.\nקליניקת יואב אבני · ${CLINIC.phone}`)
      window.open(`https://wa.me/972${phone}?text=${msg}`, '_blank')
    }
    loadSlots(weekDates)
  }

  const inp = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none', background: '#fff' } as const
  const weekLabel = weekOffset === 0 ? 'השבוע' : weekOffset === 1 ? 'שבוע הבא' : `+${weekOffset} שבועות`

  const filteredSlots = filterTherapist === 'all' ? slots : slots.filter(s => s.therapist_id === filterTherapist)

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📅 שעות פתוחות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>ניהול שעות לפי מטפל וסוג טיפול</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ ...inp, cursor: 'pointer' }}>←</button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a5c', minWidth: '80px', textAlign: 'center' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ ...inp, cursor: 'pointer' }}>→</button>
            <button onClick={() => setShowBulk(true)} style={{ padding: '8px 14px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              + פתח שעות Bulk
            </button>
          </div>
        </div>

        {/* Filter by therapist */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>סנן מטפל:</span>
          {[{ id: 'all', name: 'הכל' }, ...therapists].map(t => (
            <button key={t.id} onClick={() => setFilterTherapist(t.id)}
              style={{ padding: '4px 12px', border: `2px solid ${filterTherapist === t.id ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '20px', background: filterTherapist === t.id ? '#1a3a5c' : '#fff', color: filterTherapist === t.id ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {Object.entries(SLOT_TYPES).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: val.bg, borderRadius: '6px', fontSize: '10px', fontWeight: '600', color: val.color }}>
              {val.icon} {val.label}
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
              const daySlots = filteredSlots.filter(s => s.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
              const isPast = date < new Date(new Date().setHours(0,0,0,0))

              return (
                <div key={dayIdx} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: isPast ? 0.6 : 1 }}>
                  <div style={{ padding: '8px', background: '#1a3a5c', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>{DAYS[dayIdx]}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</div>
                  </div>

                  <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '100px' }}>
                    {daySlots.map(slot => {
                      const typeConfig = SLOT_TYPES[slot.slot_type] || SLOT_TYPES.clinic
                      return (
                        <div key={slot.id} style={{
                          padding: '3px 5px', borderRadius: '5px', fontSize: '9px', fontWeight: '600',
                          background: slot.status === 'booked' ? '#dbeafe' : typeConfig.bg,
                          color: slot.status === 'booked' ? '#1e40af' : typeConfig.color,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderRight: `3px solid ${typeConfig.color}`,
                        }}>
                          <div>
                            <div>{slot.time?.slice(0,5)}</div>
                            <div style={{ fontSize: '8px', opacity: 0.7 }}>{typeConfig.icon}</div>
                          </div>
                          {slot.status === 'booked' ? (
                            <span style={{ fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40px' }}>
                              {slot.patient?.first_name}
                            </span>
                          ) : (
                            !isPast && (
                              <button onClick={() => removeSlot(slot.id, slot.status)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '11px', padding: '0', lineHeight: '1' }}>×</button>
                            )
                          )}
                        </div>
                      )
                    })}

                    {!isPast && (
                      <button onClick={() => setShowAddSlot({ date: dateStr, time: '' })}
                        style={{ fontSize: '10px', border: '1px dashed #e2e8f0', borderRadius: '5px', padding: '3px', fontFamily: 'Heebo, sans-serif', marginTop: '2px', cursor: 'pointer', background: '#f8fafc', color: '#94a3b8', width: '100%' }}>
                        + הוסף
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Booked slots */}
        {slots.filter(s => s.status === 'booked').length > 0 && (
          <div style={{ marginTop: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '13px', color: '#1a3a5c' }}>
              👤 תורים קבועים השבוע
            </div>
            {slots.filter(s => s.status === 'booked').map(slot => {
              const typeConfig = SLOT_TYPES[slot.slot_type] || SLOT_TYPES.clinic
              return (
                <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: '4px', height: '36px', background: typeConfig.color, borderRadius: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{slot.patient?.first_name} {slot.patient?.last_name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(slot.date).toLocaleDateString('he-IL')} · {slot.time?.slice(0,5)} · {typeConfig.icon} {typeConfig.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{slot.therapist_name}</div>
                  </div>
                  {slot.patient?.phone && (
                    <a href={`https://wa.me/972${slot.patient.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ padding: '5px 10px', background: '#25d366', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}>WA</a>
                  )}
                  <button onClick={() => approveCancel(slot)} style={{ padding: '5px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>בטל</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add slot modal */}
        {showAddSlot && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: '#1a3a5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>הוסף שעה פתוחה</div>
                <button onClick={() => setShowAddSlot(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>×</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>שעה</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <button onClick={() => setUseCustomTime(false)} style={{ flex: 1, padding: '6px', border: `2px solid ${!useCustomTime ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '6px', background: !useCustomTime ? '#1a3a5c' : '#fff', color: !useCustomTime ? '#fff' : '#64748b', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>שעות קבועות</button>
                    <button onClick={() => setUseCustomTime(true)} style={{ flex: 1, padding: '6px', border: `2px solid ${useCustomTime ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '6px', background: useCustomTime ? '#1a3a5c' : '#fff', color: useCustomTime ? '#fff' : '#64748b', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>שעה חופשית</button>
                  </div>
                  {!useCustomTime ? (
                    <select style={{ ...inp, width: '100%' }} value={showAddSlot.time} onChange={e => setShowAddSlot({ ...showAddSlot, time: e.target.value })}>
                      <option value="">בחר שעה</option>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מספר מטופלים במקביל</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1,2,3,4].map(n => (
                      <button key={n} onClick={() => setSlotCapacity(n)} style={{ flex: 1, padding: '8px', border: `2px solid ${slotCapacity === n ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '6px', background: slotCapacity === n ? '#1a3a5c' : '#fff', color: slotCapacity === n ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>{n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מטפל</label>
                  <select style={{ ...inp, width: '100%' }} value={selectedTherapist} onChange={e => setSelectedTherapist(e.target.value)}>
                    {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>סוג טיפול</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {Object.entries(SLOT_TYPES).map(([key, val]) => (
                      <button key={key} onClick={() => setSelectedType(key)}
                        style={{ padding: '8px', border: `2px solid ${selectedType === key ? val.color : '#e2e8f0'}`, borderRadius: '8px', background: selectedType === key ? val.bg : '#fff', color: val.color, fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', textAlign: 'center' }}>
                        {val.icon} {val.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { const t = useCustomTime ? customTime : showAddSlot.time; if (t) addSlot(showAddSlot.date, t) }}
                  disabled={!(useCustomTime ? customTime : showAddSlot.time)}
                  style={{ width: '100%', padding: '12px', background: !(useCustomTime ? customTime : showAddSlot.time) ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: !showAddSlot.time ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                  ✅ הוסף שעה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk modal */}
        {showBulk && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ padding: '16px 20px', background: '#1a3a5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>פתיחת שעות Bulk</div>
                <button onClick={() => setShowBulk(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>×</button>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מטפל</label>
                  <select style={{ ...inp, width: '100%' }} value={bulk.therapist} onChange={e => setBulk(p => ({ ...p, therapist: e.target.value }))}>
                    {therapists.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>סוג טיפול</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {Object.entries(SLOT_TYPES).map(([key, val]) => (
                      <button key={key} onClick={() => setBulk(p => ({ ...p, slotType: key }))}
                        style={{ padding: '7px', border: `2px solid ${bulk.slotType === key ? val.color : '#e2e8f0'}`, borderRadius: '8px', background: bulk.slotType === key ? val.bg : '#fff', color: val.color, fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                        {val.icon} {val.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                <div style={{ display: 'flex', gap: '8px' }}>
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

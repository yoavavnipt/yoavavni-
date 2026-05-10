'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, APPOINTMENT_STATUS, SERVICES } from '@/lib/supabase'
import Link from 'next/link'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [selectedDate])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select(`*, patient:patients(first_name,last_name,phone), service:service_types(name_he,icon,color)`)
      .eq('date', selectedDate)
      .order('time')
    setAppointments(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    load()
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 1))
    return d.toISOString().split('T')[0]
  })

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>יומן תורים</h1>
          <Link href="/calendar/new" style={{
            padding: '9px 18px', background: '#3eb8e5', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: '700'
          }}>
            + תור חדש
          </Link>
        </div>

        {/* Date Navigation */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {weekDays.map(date => {
            const d = new Date(date)
            const isToday = date === new Date().toISOString().split('T')[0]
            const isSelected = date === selectedDate
            const dayIdx = d.getDay()
            return (
              <button key={date} onClick={() => setSelectedDate(date)} style={{
                flexShrink: 0, minWidth: '56px', padding: '10px 8px',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: isSelected ? '#1a3a5c' : isToday ? '#e0f0ff' : '#fff',
                color: isSelected ? '#fff' : isToday ? '#1a3a5c' : '#475569',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                textAlign: 'center', fontFamily: 'Heebo, sans-serif',
                outline: isToday && !isSelected ? '2px solid #3eb8e5' : 'none',
              }}>
                <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '2px' }}>{dayNames[dayIdx]}</div>
                <div style={{ fontSize: '17px', fontWeight: '800' }}>{d.getDate()}</div>
              </button>
            )
          })}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              flexShrink: 0, padding: '8px 10px', border: '1px solid #e2e8f0',
              borderRadius: '10px', fontSize: '12px', background: '#fff',
              fontFamily: 'Heebo, sans-serif', cursor: 'pointer', outline: 'none'
            }}
          />
        </div>

        {/* Appointments */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>
                {new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{appointments.length} תורים</div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
              <div>אין תורים ליום זה</div>
              <Link href="/calendar/new" style={{ display: 'inline-block', marginTop: '12px', padding: '8px 16px', background: '#3eb8e5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                + הוסף תור
              </Link>
            </div>
          ) : (
            appointments.map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px',
                borderBottom: i < appointments.length - 1 ? '1px solid #f8fafc' : 'none',
                background: a.status === 'cancelled' ? '#fafafa' : '#fff',
                opacity: a.status === 'cancelled' ? 0.7 : 1,
              }}>
                <div style={{
                  fontWeight: '700', color: '#1a3a5c', fontSize: '15px',
                  minWidth: '52px', fontVariantNumeric: 'tabular-nums'
                }}>
                  {a.time?.slice(0, 5)}
                </div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: a.service?.color ? `${a.service.color}15` : '#f1f5f9',
                  border: `2px solid ${a.service?.color || '#e2e8f0'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', flexShrink: 0
                }}>
                  {a.service?.icon || '🏥'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/patients/${a.patient_id}`} style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c', textDecoration: 'none' }}>
                    {a.patient?.first_name} {a.patient?.last_name}
                  </Link>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                    {a.service?.name_he || 'טיפול'}
                    {a.price && ` · ₪${a.price}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {a.patient?.phone && (
                    <a
                      href={`https://wa.me/972${a.patient.phone.replace(/^0/, '').replace(/-/g, '')}`}
                      target="_blank" rel="noreferrer"
                      style={{ padding: '4px 10px', background: '#25d366', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}
                    >
                      WA
                    </a>
                  )}
                  <select
                    value={a.status}
                    onChange={e => updateStatus(a.id, e.target.value)}
                    style={{
                      padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px',
                      fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                      background: '#fff', outline: 'none',
                    }}
                  >
                    {Object.entries(APPOINTMENT_STATUS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

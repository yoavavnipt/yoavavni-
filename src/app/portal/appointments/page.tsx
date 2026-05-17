'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, APPOINTMENT_STATUS, CLINIC } from '@/lib/supabase'
import Link from 'next/link'

export default function PortalAppointmentsPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('portal_patient')
    if (!saved) { router.push('/portal'); return }
    const p = JSON.parse(saved)
    setPatient(p)
    load(p.id)
  }, [filter])

  async function load(patientId: string) {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let q = supabase
      .from('appointments')
      .select('*, service:service_types(name_he,icon,color)')
      .eq('patient_id', patientId)
      .order('date', { ascending: filter === 'upcoming' })

    if (filter === 'upcoming') q = q.gte('date', today)
    else q = q.lt('date', today).limit(20)

    const { data } = await q
    setAppointments(data || [])
    setLoading(false)
  }

  async function cancelAppointment(appt: any) {
    // Check 24hr rule
    const apptDateTime = new Date(`${appt.date}T${appt.time}`)
    const now = new Date()
    const diffHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      alert('לא ניתן לבטל תור בפחות מ-24 שעות מראש.\n\nלביטול צור קשר עם הקליניקה:\n' + CLINIC.phone + '\nשים לב: ביטול מאוחר כרוך בחיוב מלא.')
      return
    }

    if (!confirm('האם אתה בטוח שברצונך לבטל את התור?')) return

    setCancelling(appt.id)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)

    // Free up the slot
    await supabase.from('available_slots')
      .update({ status: 'open', patient_id: null })
      .eq('patient_id', patient.id)
      .eq('date', appt.date)
      .eq('time', appt.time)

    // Send WhatsApp to clinic
    const clinicMsg = encodeURIComponent(`❌ ביטול תור\n\n${patient.first_name} ${patient.last_name}\n${new Date(appt.date).toLocaleDateString('he-IL')} · ${appt.time?.slice(0,5)}\nטלפון: ${patient.phone}`)
    window.open(`https://wa.me/972545953889?text=${clinicMsg}`, '_blank')

    setCancelling(null)
    load(patient.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/portal')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontFamily: 'Heebo, sans-serif' }}>←</button>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>התורים שלי</div>
      </div>

      <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[{ key: 'upcoming', label: 'קרובים' }, { key: 'past', label: 'עבר' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} style={{ flex: 1, padding: '11px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: filter === f.key ? '700' : '400', background: filter === f.key ? '#1a3a5c' : 'transparent', color: filter === f.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : appointments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              {filter === 'upcoming' ? 'אין תורים קרובים' : 'אין היסטוריית תורים'}
            </div>
            {filter === 'upcoming' && (
              <Link href="/portal/book" style={{ padding: '11px 22px', background: '#3eb8e5', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                קבע תור עכשיו
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(a => {
              const apptDateTime = new Date(`${a.date}T${a.time}`)
              const canCancel = (apptDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60) >= 24 && a.status !== 'cancelled'
              const isUpcoming = filter === 'upcoming' && a.status !== 'cancelled'

              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: a.service?.color ? `${a.service.color}15` : '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {a.service?.icon || '🏥'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>{a.service?.name_he || 'טיפול'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(a.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · {a.time?.slice(0,5)}
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: APPOINTMENT_STATUS[a.status]?.bg || '#f1f5f9', color: APPOINTMENT_STATUS[a.status]?.color || '#475569' }}>
                      {APPOINTMENT_STATUS[a.status]?.label || a.status}
                    </span>
                  </div>
                  {a.price && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>מחיר</span>
                      <span style={{ fontWeight: '700', color: '#1a3a5c' }}>₪{a.price}</span>
                    </div>
                  )}
                  {isUpcoming && (
                    <div style={{ marginTop: '10px' }}>
                      {canCancel ? (
                        <button onClick={() => cancelAppointment(a)} disabled={cancelling === a.id} style={{ width: '100%', padding: '9px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                          {cancelling === a.id ? '⏳ מבטל...' : '❌ בטל תור'}
                        </button>
                      ) : (
                        <a href={`https://wa.me/972${CLINIC.phone.replace(/^0/,'').replace(/-/g,'')}?text=${encodeURIComponent(`שלום, אני ${patient?.first_name} ${patient?.last_name}.\nאני מעוניין לבטל את התור שלי לתאריך ${new Date(a.date).toLocaleDateString('he-IL')} בשעה ${a.time?.slice(0,5)}.\nאני מבין שביטול מאוחר כרוך בחיוב מלא.`)}`} target="_blank" rel="noreferrer"
                          style={{ display: 'block', padding: '9px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textAlign: 'center', color: '#92400e', textDecoration: 'none' }}>
                          ⚠️ בקשת ביטול מאוחר — שלח הודעה לקליניקה
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortalAppointmentsPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    const saved = sessionStorage.getItem('portal_patient')
    if (!saved) { router.push('/portal'); return }
    const p = JSON.parse(saved)
    setPatient(p)
    load(p.id)
  }, [filter])

  async function load(patientId: string) {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let q = supabase
      .from('appointments')
      .select('*, service:service_types(name_he,icon,color)')
      .eq('patient_id', patientId)
      .order('date', { ascending: filter === 'upcoming' })

    if (filter === 'upcoming') q = q.gte('date', today)
    else q = q.lt('date', today).limit(20)

    const { data } = await q
    setAppointments(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ background: '#1a3a5c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.push('/portal')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontFamily: 'Heebo, sans-serif' }}>←</button>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>התורים שלי</div>
      </div>

      <div style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
        {/* Filter */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[{ key: 'upcoming', label: 'קרובים' }, { key: 'past', label: 'עבר' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} style={{
              flex: 1, padding: '11px', border: 'none', cursor: 'pointer', fontSize: '13px',
              fontWeight: filter === f.key ? '700' : '400',
              background: filter === f.key ? '#1a3a5c' : 'transparent',
              color: filter === f.key ? '#fff' : '#64748b',
              fontFamily: 'Heebo, sans-serif',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : appointments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              {filter === 'upcoming' ? 'אין תורים קרובים' : 'אין היסטוריית תורים'}
            </div>
            {filter === 'upcoming' && (
              <Link href="/portal/book" style={{ padding: '11px 22px', background: '#3eb8e5', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                קבע תור עכשיו
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(a => (
              <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: a.service?.color ? `${a.service.color}15` : '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                    {a.service?.icon || '🏥'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>{a.service?.name_he || 'טיפול'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {new Date(a.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · {a.time?.slice(0,5)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    background: APPOINTMENT_STATUS[a.status]?.bg || '#f1f5f9',
                    color: APPOINTMENT_STATUS[a.status]?.color || '#475569'
                  }}>
                    {APPOINTMENT_STATUS[a.status]?.label || a.status}
                  </span>
                </div>
                {a.price && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>מחיר</span>
                    <span style={{ fontWeight: '700', color: '#1a3a5c' }}>₪{a.price}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

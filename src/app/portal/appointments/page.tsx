'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, APPOINTMENT_STATUS } from '@/lib/supabase'
import Link from 'next/link'

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

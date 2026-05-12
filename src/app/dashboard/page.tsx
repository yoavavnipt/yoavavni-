'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, APPOINTMENT_STATUS } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id,first_name,last_name,phone,diagnosis')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6)
      setResults(data || [])
      setOpen(true)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div style={{ position: 'relative' }}>
      <input
        placeholder="🔍 חפש מטופל..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{
          padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
          fontSize: '13px', outline: 'none', background: '#fff', width: '220px',
          fontFamily: 'Heebo, sans-serif',
        }}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, left: 0, background: '#fff',
          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0', zIndex: 100, marginTop: '4px',
        }}>
          {results.map(p => (
            <div key={p.id} onClick={() => { router.push(`/patients/${p.id}`); setQuery(''); setOpen(false) }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone} {p.diagnosis ? `· ${p.diagnosis}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, monthIncome: 0, pending: 0 })
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { count: patients } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const today = new Date().toISOString().split('T')[0]
      const { count: todayAppts } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today)
      const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const { data: billing } = await supabase.from('billing_records').select('amount').eq('status', 'paid').gte('created_at', startMonth)
      const monthIncome = billing?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0
      const { count: pending } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      setStats({ patients: patients || 0, todayAppts: todayAppts || 0, monthIncome, pending: pending || 0 })

      const { data: appts } = await supabase
        .from('appointments')
        .select(`*, patient:patients(first_name,last_name,phone), service:service_types(name_he,icon,color)`)
        .eq('date', today)
        .order('time')
        .limit(15)
      setAppointments(appts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    { label: 'מטופלים פעילים', value: stats.patients, icon: '👥', color: '#1e4a7a', sub: 'סה"כ' },
    { label: 'תורים היום', value: stats.todayAppts, icon: '📅', color: '#3eb8e5', sub: new Date().toLocaleDateString('he-IL', { weekday: 'long' }) },
    { label: 'הכנסה החודש', value: `₪${stats.monthIncome.toLocaleString()}`, icon: '💰', color: '#0b8a5e', sub: new Date().toLocaleDateString('he-IL', { month: 'long' }) },
    { label: 'ממתינים לאישור', value: stats.pending, icon: '⏳', color: '#e8a020', sub: 'תורים' },
  ]

  const quickActions = [
    { icon: '👤', label: 'מטופל חדש', href: '/patients/new', color: '#1a3a5c' },
    { icon: '📅', label: 'תור חדש',   href: '/calendar/new', color: '#3eb8e5' },
    { icon: '📋', label: 'SOAP חדש',  href: '/records/new',  color: '#7c3aed' },
    { icon: '💳', label: 'שלח תשלום', href: '/billing',      color: '#0b8a5e' },
  ]

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', fontSize: '14px' }}>
        טוען נתונים...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>לוח בקרה</h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <GlobalSearch />
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: '#fff', borderRadius: '12px', padding: '16px',
              borderRight: `3px solid ${k.color}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{k.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{k.label}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} style={{
              background: '#fff', borderRadius: '10px', padding: '14px',
              textAlign: 'center', border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              display: 'block', color: '#1e293b',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{a.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '600' }}>{a.label}</div>
            </Link>
          ))}
        </div>

        {/* Today's Appointments */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>תורים היום</div>
            <Link href="/calendar" style={{ fontSize: '12px', color: '#3eb8e5', fontWeight: '600' }}>הצג הכל ←</Link>
          </div>

          {appointments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
              <div>אין תורים להיום</div>
            </div>
          ) : (
            appointments.map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 18px',
                borderBottom: i < appointments.length - 1 ? '1px solid #f8fafc' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafcff',
              }}>
                <div style={{
                  fontWeight: '700', color: '#1a3a5c', fontSize: '14px',
                  minWidth: '52px', fontVariantNumeric: 'tabular-nums'
                }}>
                  {a.time?.slice(0, 5)}
                </div>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: a.service?.color ? `${a.service.color}20` : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0
                }}>
                  {a.service?.icon || '🏥'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/patients/${a.patient_id}`} style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c', textDecoration: 'none' }}>
                    {a.patient?.first_name} {a.patient?.last_name}
                  </Link>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                    {a.service?.name_he || 'טיפול'}
                    {a.patient?.phone && (
                      <a
                        href={`https://wa.me/972${a.patient.phone.replace(/^0/, '').replace(/-/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginRight: '8px', color: '#25d366', fontWeight: '600' }}
                        onClick={e => e.stopPropagation()}
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = APPOINTMENT_STATUS[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600',
      background: s.bg, color: s.color, whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  )
}

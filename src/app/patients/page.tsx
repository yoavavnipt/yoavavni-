'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'lead' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [search, filter])

  async function load() {
    setLoading(true)
    let q = supabase.from('patients').select('*').order('first_name')
    if (filter !== 'all') q = q.eq('status', filter)
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,id_number.ilike.%${search}%`)
    const { data } = await q
    setPatients(data || [])
    setLoading(false)
  }

  const filterTabs = [
    { key: 'all',      label: 'הכל' },
    { key: 'active',   label: 'פעיל' },
    { key: 'lead',     label: 'ליד' },
    { key: 'inactive', label: 'לא פעיל' },
  ]

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>מטופלים</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{patients.length} נמצאו</p>
          </div>
          <Link href="/patients/new" style={{
            padding: '9px 18px', background: '#1a3a5c', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: '700'
          }}>
            + מטופל חדש
          </Link>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            placeholder="🔍 חפש שם, טלפון, ת.ז..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', padding: '9px 14px',
              border: '1px solid #e2e8f0', borderRadius: '8px',
              fontSize: '13px', outline: 'none', background: '#fff'
            }}
          />
          <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {filterTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as any)}
                style={{
                  padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: '12px',
                  fontWeight: filter === t.key ? '700' : '400',
                  background: filter === t.key ? '#1a3a5c' : 'transparent',
                  color: filter === t.key ? '#fff' : '#64748b',
                  fontFamily: 'Heebo, sans-serif',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : patients.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
              <div>לא נמצאו מטופלים</div>
              <Link href="/patients/new" style={{ display: 'inline-block', marginTop: '12px', padding: '8px 16px', background: '#1a3a5c', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                הוסף מטופל ראשון
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['שם', 'טלפון', 'קופ"ח', 'אבחנה', 'סטטוס', 'פעולות'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <Link href={`/patients/${p.id}`} style={{ fontWeight: '600', color: '#1a3a5c', textDecoration: 'none' }}>
                          {p.first_name} {p.last_name}
                        </Link>
                        {p.id_number && <div style={{ fontSize: '11px', color: '#94a3b8' }}>ת.ז. {p.id_number}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <a href={`tel:${p.phone}`} style={{ color: '#1a3a5c', fontWeight: '500' }}>{p.phone}</a>
                        {p.phone && (
                          <a
                            href={`https://wa.me/972${p.phone.replace(/^0/, '').replace(/-/g, '')}`}
                            target="_blank" rel="noreferrer"
                            style={{ display: 'block', fontSize: '11px', color: '#25d366', fontWeight: '600', marginTop: '1px' }}
                          >
                            WhatsApp
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{p.hmo || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.diagnosis || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link href={`/patients/${p.id}`} style={{
                            padding: '5px 12px', border: '1px solid #e2e8f0',
                            borderRadius: '6px', color: '#1e293b', fontSize: '12px', fontWeight: '500'
                          }}>
                            פרופיל
                          </Link>
                          <Link href={`/calendar/new?patient=${p.id}`} style={{
                            padding: '5px 10px', background: '#3eb8e5', borderRadius: '6px',
                            color: '#fff', fontSize: '12px', fontWeight: '500'
                          }}>
                            + תור
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'פעיל',     bg: '#d1fae5', color: '#065f46' },
    lead:     { label: 'ליד',      bg: '#fef3c7', color: '#92400e' },
    inactive: { label: 'לא פעיל', bg: '#f1f5f9', color: '#475569' },
  }
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '600',
      background: s.bg, color: s.color
    }}>
      {s.label}
    </span>
  )
}

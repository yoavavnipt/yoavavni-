'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [search])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('treatment_records')
      .select(`*, patient:patients(first_name,last_name)`)
      .order('created_at', { ascending: false })
      .limit(50)
    const { data } = await q
    const filtered = (data || []).filter(r => {
      if (!search) return true
      const name = `${r.patient?.first_name} ${r.patient?.last_name}`.toLowerCase()
      return name.includes(search.toLowerCase())
    })
    setRecords(filtered)
    setLoading(false)
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>רשומות SOAP</h1>
          <Link href="/records/new" style={{ padding: '9px 18px', background: '#7c3aed', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            + רשומה חדשה
          </Link>
        </div>

        <input
          placeholder="🔍 חפש שם מטופל..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 14px', marginBottom: '14px',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            fontSize: '13px', outline: 'none', background: '#fff'
          }}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : records.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div>אין רשומות</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {records.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>
                      {r.patient?.first_name} {r.patient?.last_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {new Date(r.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {r.vas_score != null && (
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        background: r.vas_score > 6 ? '#fee2e2' : r.vas_score > 3 ? '#fef3c7' : '#d1fae5',
                        color: r.vas_score > 6 ? '#991b1b' : r.vas_score > 3 ? '#92400e' : '#065f46',
                      }}>
                        VAS {r.vas_score}/10
                      </span>
                    )}
                    <Link href={`/patients/${r.patient_id}`} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#475569' }}>
                      פרופיל
                    </Link>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { l: 'S', v: r.subjective,  c: '#3b82f6' },
                    { l: 'O', v: r.objective,   c: '#8b5cf6' },
                    { l: 'A', v: r.assessment,  c: '#f59e0b' },
                    { l: 'P', v: r.plan,         c: '#10b981' },
                  ].filter(x => x.v).map(x => (
                    <div key={x.l} style={{ flex: 1, minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ width: '20px', height: '20px', background: x.c, borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0, marginTop: '1px' }}>{x.l}</span>
                        <span style={{ fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>{x.v.length > 120 ? x.v.slice(0, 120) + '...' : x.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

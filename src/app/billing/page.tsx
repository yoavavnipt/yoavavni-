'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'
import Link from 'next/link'

export default function BillingPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalPending, setTotalPending] = useState(0)

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('billing_records')
      .select(`*, patient:patients(first_name,last_name,phone)`)
      .order('created_at', { ascending: false })
      .limit(60)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setRecords(data || [])

    // Stats
    const { data: all } = await supabase.from('billing_records').select('amount,status')
    const paid = (all || []).filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount || 0), 0)
    const pending = (all || []).filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0)
    setTotalPaid(paid)
    setTotalPending(pending)
    setLoading(false)
  }

  async function markPaid(id: string) {
    await supabase.from('billing_records').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  function sendWhatsApp(phone: string, amount: number, description: string) {
    const msg = encodeURIComponent(`שלום,\nבקשת תשלום עבור: ${description}\nסכום: ₪${amount}\n\nתודה,\n${CLINIC.name}`)
    window.open(`https://wa.me/972${phone.replace(/^0/, '').replace(/-/g, '')}?text=${msg}`, '_blank')
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>חיוב וקבלות</h1>
          <Link href="/billing/new" style={{ padding: '9px 18px', background: '#0b8a5e', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            + חיוב חדש
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #0b8a5e', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>שולם</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0b8a5e' }}>₪{totalPaid.toLocaleString()}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #e8a020', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ממתין לתשלום</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#e8a020' }}>₪{totalPending.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px', width: 'fit-content' }}>
          {[{ key: 'all', label: 'הכל' }, { key: 'paid', label: '✅ שולם' }, { key: 'pending', label: '⏳ ממתין' }].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key as any)} style={{
              padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: filter === t.key ? '700' : '400',
              background: filter === t.key ? '#1a3a5c' : 'transparent', color: filter === t.key ? '#fff' : '#64748b',
              fontFamily: 'Heebo, sans-serif'
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Records */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : records.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>אין חיובים</div>
          ) : records.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 18px', borderBottom: i < records.length - 1 ? '1px solid #f8fafc' : 'none'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>
                  {r.patient?.first_name} {r.patient?.last_name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  {r.description || 'טיפול'} · {new Date(r.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', minWidth: '70px', textAlign: 'left' }}>
                ₪{(r.amount || 0).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {r.status === 'pending' && r.patient?.phone && (
                  <button onClick={() => sendWhatsApp(r.patient.phone, r.amount, r.description || 'טיפול')} style={{
                    padding: '5px 10px', background: '#25d366', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
                  }}>
                    💬 WA
                  </button>
                )}
                {r.status === 'pending' && (
                  <button onClick={() => markPaid(r.id)} style={{
                    padding: '5px 10px', background: '#0b8a5e', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif'
                  }}>
                    ✅ שולם
                  </button>
                )}
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

function Badge({ status }: { status: string }) {
  const map: Record<string, any> = {
    paid:      { label: 'שולם',   bg: '#d1fae5', color: '#065f46' },
    pending:   { label: 'ממתין',  bg: '#fef3c7', color: '#92400e' },
    cancelled: { label: 'בוטל',  bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
}

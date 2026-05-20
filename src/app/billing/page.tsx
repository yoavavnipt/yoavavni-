'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'
import Link from 'next/link'

const VAT = 0.18

function withVAT(amount: number) { return amount }
function withoutVAT(amount: number) { return Math.round(amount / (1 + VAT)) }
function vatAmount(amount: number) { return amount - withoutVAT(amount) }

export default function BillingPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [showVAT, setShowVAT] = useState(true)

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

  function displayAmount(amount: number) {
    return showVAT ? withVAT(amount) : withoutVAT(amount)
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>חיוב וקבלות</h1>
            {/* טוגל מע"מ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>הצג מחירים:</span>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setShowVAT(true)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: showVAT ? '700' : '400', background: showVAT ? '#1a3a5c' : 'transparent', color: showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>כולל מע"מ</button>
                <button onClick={() => setShowVAT(false)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: !showVAT ? '700' : '400', background: !showVAT ? '#1a3a5c' : 'transparent', color: !showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>ללא מע"מ</button>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>מע"מ 18%</span>
            </div>
          </div>
          <Link href="/billing/new" style={{ padding: '9px 18px', background: '#0b8a5e', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            + חיוב חדש
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #0b8a5e', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>שולם</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0b8a5e' }}>₪{displayAmount(totalPaid).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {showVAT
                ? `לפני מע"מ: ₪${withoutVAT(totalPaid).toLocaleString()} | מע"מ: ₪${vatAmount(totalPaid).toLocaleString()}`
                : `כולל מע"מ: ₪${withVAT(totalPaid).toLocaleString()}`}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #e8a020', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>ממתין לתשלום</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#e8a020' }}>₪{displayAmount(totalPending).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {showVAT
                ? `לפני מע"מ: ₪${withoutVAT(totalPending).toLocaleString()} | מע"מ: ₪${vatAmount(totalPending).toLocaleString()}`
                : `כולל מע"מ: ₪${withVAT(totalPending).toLocaleString()}`}
            </div>
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
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: i < records.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/patients/${r.patient_id}`} style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c', textDecoration: 'none' }}>
                  {r.patient?.first_name} {r.patient?.last_name}
                </Link>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  {r.description || 'טיפול'} · {new Date(r.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
              <div style={{ textAlign: 'left', minWidth: '120px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>
                  ₪{displayAmount(r.amount || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {showVAT
                    ? `לפני מע"מ: ₪${withoutVAT(r.amount || 0).toLocaleString()}`
                    : `כולל מע"מ: ₪${withVAT(r.amount || 0).toLocaleString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {r.status === 'pending' && r.patient?.phone && (
                  <button onClick={() => sendWhatsApp(r.patient.phone, r.amount, r.description || 'טיפול')} style={{ padding: '5px 10px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    💬 WA
                  </button>
                )}
                {r.status === 'pending' && (
                  <button onClick={() => markPaid(r.id)} style={{ padding: '5px 10px', background: '#0b8a5e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
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
    paid:      { label: 'שולם',  bg: '#d1fae5', color: '#065f46' },
    pending:   { label: 'ממתין', bg: '#fef3c7', color: '#92400e' },
    cancelled: { label: 'בוטל', bg: '#fee2e2', color: '#991b1b' },
  }
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
}

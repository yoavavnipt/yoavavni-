'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, SERVICES } from '@/lib/supabase'

export default function ReportsPage() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => { load() }, [period])

  async function load() {
    setLoading(true)
    const now = new Date()
    let startDate: string
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (period === 'quarter') {
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString()
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    const [
      { count: totalPatients },
      { count: activePatients },
      { data: billing },
      { count: appointments },
      { data: serviceStats },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('billing_records').select('amount,status,payment_method').gte('created_at', startDate),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('created_at', startDate),
      supabase.from('appointments').select('service_type_id,price').gte('created_at', startDate),
    ])

    const paid = (billing || []).filter(b => b.status === 'paid')
    const totalIncome = paid.reduce((s, b) => s + (b.amount || 0), 0)
    const avgPerSession = paid.length > 0 ? Math.round(totalIncome / paid.length) : 0

    const paymentMethods: Record<string, number> = {}
    paid.forEach(b => {
      const m = b.payment_method || 'אחר'
      paymentMethods[m] = (paymentMethods[m] || 0) + (b.amount || 0)
    })

    setStats({ totalPatients, activePatients, totalIncome, avgPerSession, appointments, paidCount: paid.length, paymentMethods })
    setLoading(false)
  }

  const periodLabel = { month: 'חודש זה', quarter: 'רבעון זה', year: 'שנה זו' }[period]

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>דוחות ואנליטיקס</h1>
          <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {(['month', 'quarter', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px',
                fontWeight: period === p ? '700' : '400',
                background: period === p ? '#1a3a5c' : 'transparent',
                color: period === p ? '#fff' : '#64748b',
                fontFamily: 'Heebo, sans-serif',
              }}>
                {periodLabel === periodLabel && { month: 'חודש', quarter: 'רבעון', year: 'שנה' }[p]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>טוען...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'הכנסה', value: `₪${(stats.totalIncome || 0).toLocaleString()}`, icon: '💰', color: '#0b8a5e', sub: periodLabel },
                { label: 'ממוצע לטיפול', value: `₪${stats.avgPerSession || 0}`, icon: '📊', color: '#3eb8e5', sub: `${stats.paidCount || 0} טיפולים` },
                { label: 'תורים', value: stats.appointments || 0, icon: '📅', color: '#7c3aed', sub: periodLabel },
                { label: 'מטופלים פעילים', value: stats.activePatients || 0, icon: '👥', color: '#1e4a7a', sub: `מתוך ${stats.totalPatients || 0}` },
              ].map(k => (
                <div key={k.label} style={{
                  background: '#fff', borderRadius: '12px', padding: '16px',
                  borderRight: `3px solid ${k.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{k.icon}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>{k.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{k.label}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Payment methods breakdown */}
            {Object.keys(stats.paymentMethods || {}).length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '14px', color: '#1a3a5c' }}>💳 פילוח אמצעי תשלום</h2>
                {Object.entries(stats.paymentMethods).map(([method, amount]: any) => {
                  const pct = Math.round((amount / stats.totalIncome) * 100)
                  return (
                    <div key={method} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>{method}</span>
                        <span style={{ fontWeight: '700' }}>₪{amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#1a3a5c', borderRadius: '10px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, SERVICES } from '@/lib/supabase'

// Simple bar chart component
function BarChart({ data, color = '#1a3a5c', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px` }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{d.value > 0 ? d.value : ''}</div>
          <div style={{
            width: '100%', background: color, borderRadius: '4px 4px 0 0',
            height: `${Math.max((d.value / max) * (height - 30), d.value > 0 ? 4 : 0)}px`,
            transition: 'height 0.4s ease',
          }} />
          <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data, color = '#3eb8e5', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 400, h = height - 30
  const pts = data.map((d, i) => ({ x: (i / Math.max(data.length - 1, 1)) * w, y: h - (d.value / max) * h }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${pts[pts.length - 1]?.x} ${h} L 0 ${h} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {data.map((d, i) => <div key={i} style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', flex: 1 }}>{d.label}</div>)}
      </div>
    </div>
  )
}

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

export default function ReportsPage() {
  const [startMonth, setStartMonth] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 5); return d.toISOString().slice(0, 7) })
  const [endMonth, setEndMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>({})
  const [incomeByMonth, setIncomeByMonth] = useState<any[]>([])
  const [apptsByService, setApptsByService] = useState<any[]>([])
  const [apptsByMonth, setApptsByMonth] = useState<any[]>([])
  const [newPatientsByMonth, setNewPatientsByMonth] = useState<any[]>([])
  const [debtors, setDebtors] = useState<any[]>([])
  const [lostPatients, setLostPatients] = useState<any[]>([])
  const [cancellations, setCancellations] = useState<any[]>([])
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [noShows, setNoShows] = useState<any[]>([])

  useEffect(() => { load() }, [startMonth, endMonth])

  async function load() {
    setLoading(true)
    const start = `${startMonth}-01`
    const end = `${endMonth}-31`

    // Generate months list
    const months: string[] = []
    const cur = new Date(`${startMonth}-01`)
    const endD = new Date(`${endMonth}-01`)
    while (cur <= endD) {
      months.push(cur.toISOString().slice(0, 7))
      cur.setMonth(cur.getMonth() + 1)
    }

    const [
      { data: billingAll },
      { data: apptsAll },
      { data: patients },
      { data: billingPending },
    ] = await Promise.all([
      supabase.from('billing_records').select('amount,status,payment_method,created_at').gte('created_at', start).lte('created_at', end),
      supabase.from('appointments').select('*, patient:patients(first_name,last_name), service:service_types(name_he,icon)').gte('date', start).lte('date', end),
      supabase.from('patients').select('id,first_name,last_name,phone,created_at,status').order('created_at'),
      supabase.from('billing_records').select('amount,patient_id,patient:patients(first_name,last_name,phone),description,created_at').eq('status','pending'),
    ])

    const paid = (billingAll || []).filter(b => b.status === 'paid')
    const totalIncome = paid.reduce((s, b) => s + (b.amount || 0), 0)
    const totalAppts = (apptsAll || []).length
    const cancelled = (apptsAll || []).filter(a => a.status === 'cancelled').length
    const noShow = (apptsAll || []).filter(a => a.status === 'no_show').length
    const avgIncome = paid.length > 0 ? Math.round(totalIncome / paid.length) : 0

    const uniquePatients = new Set((apptsAll || []).filter(a => a.status !== 'cancelled').map(a => a.patient_id)).size
    const avgTreatmentsPerPatient = uniquePatients > 0 ? Math.round(((apptsAll || []).filter(a => a.status !== 'cancelled').length / uniquePatients) * 10) / 10 : 0

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {}
    paid.forEach(b => {
      const method = b.payment_method || 'לא צוין'
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (b.amount || 0)
    })

    setKpis({ totalIncome, totalAppts, cancelled, noShow, avgIncome, paidCount: paid.length, cancellationRate: totalAppts > 0 ? Math.round((cancelled / totalAppts) * 100) : 0, avgTreatmentsPerPatient, uniquePatients, paymentBreakdown })

    // Income by month
    setIncomeByMonth(months.map(m => ({
      label: MONTH_NAMES[parseInt(m.slice(5, 7)) - 1],
      value: paid.filter(b => b.created_at?.slice(0, 7) === m).reduce((s, b) => s + (b.amount || 0), 0)
    })))

    // Appointments by month
    setApptsByMonth(months.map(m => ({
      label: MONTH_NAMES[parseInt(m.slice(5, 7)) - 1],
      value: (apptsAll || []).filter(a => a.date?.slice(0, 7) === m && a.status !== 'cancelled').length
    })))

    // New patients by month
    setNewPatientsByMonth(months.map(m => ({
      label: MONTH_NAMES[parseInt(m.slice(5, 7)) - 1],
      value: (patients || []).filter(p => p.created_at?.slice(0, 7) === m).length
    })))

    // Appointments by service type
    const svcMap: Record<string, number> = {}
    ;(apptsAll || []).filter(a => a.status !== 'cancelled').forEach(a => {
      const name = a.service?.name_he || 'אחר'
      svcMap[name] = (svcMap[name] || 0) + 1
    })
    setApptsByService(Object.entries(svcMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: label.slice(0, 8), value })))

    // Peak hours
    const hourMap: Record<number, number> = {}
    ;(apptsAll || []).filter(a => a.status !== 'cancelled' && a.time).forEach(a => {
      const h = parseInt(a.time.slice(0, 2))
      hourMap[h] = (hourMap[h] || 0) + 1
    })
    setPeakHours(Object.entries(hourMap).sort((a, b) => Number(a[0]) - Number(b[0])).map(([h, v]) => ({ label: `${h}:00`, value: v as number })))

    // Cancellations by service
    const cancelMap: Record<string, number> = {}
    ;(apptsAll || []).filter(a => a.status === 'cancelled').forEach(a => {
      const name = a.service?.name_he || 'אחר'
      cancelMap[name] = (cancelMap[name] || 0) + 1
    })
    setCancellations(Object.entries(cancelMap).sort((a, b) => b[1] - a[1]).slice(0, 5))

    // No-shows by patient
    const nsMap: Record<string, { name: string; count: number; phone: string }> = {}
    ;(apptsAll || []).filter(a => a.status === 'no_show').forEach(a => {
      const pid = a.patient_id
      if (!nsMap[pid]) nsMap[pid] = { name: `${a.patient?.first_name} ${a.patient?.last_name}`, count: 0, phone: '' }
      nsMap[pid].count++
    })
    setNoShows(Object.values(nsMap).sort((a, b) => b.count - a.count).slice(0, 5))

    // Debtors
    const debtMap: Record<string, any> = {}
    ;(billingPending || []).forEach(b => {
      const pid = b.patient_id
      if (!debtMap[pid]) debtMap[pid] = { name: `${(b.patient as any)?.first_name} ${(b.patient as any)?.last_name}`, phone: (b.patient as any)?.phone, total: 0, count: 0 }
      debtMap[pid].total += (b.amount || 0)
      debtMap[pid].count++
    })
    setDebtors(Object.values(debtMap).sort((a, b) => b.total - a.total).slice(0, 10))

    // Lost patients (no appointment in last 4 weeks)
    const { data: recentAppts } = await supabase.from('appointments').select('patient_id').gte('date', new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0])
    const recentPids = new Set((recentAppts || []).map(a => a.patient_id))
    const { data: allActive } = await supabase.from('patients').select('id,first_name,last_name,phone').eq('status', 'active')
    const lost = (allActive || []).filter(p => !recentPids.has(p.id)).slice(0, 10)
    setLostPatients(lost)

    setLoading(false)
  }

  const inp = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none', background: '#fff' } as const

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📈 דוחות ואנליטיקס</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>מ:</span>
            <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={inp} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>עד:</span>
            <input type="month" value={endMonth} onChange={e => setEndMonth(e.target.value)} style={inp} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>טוען נתונים...</div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'הכנסה', value: `₪${kpis.totalIncome?.toLocaleString()}`, icon: '💰', color: '#0b8a5e', sub: `${kpis.paidCount} תשלומים` },
                { label: 'ממוצע לטיפול', value: `₪${kpis.avgIncome}`, icon: '📊', color: '#3eb8e5', sub: 'ממוצע' },
                { label: 'תורים', value: kpis.totalAppts, icon: '📅', color: '#7c3aed', sub: `${kpis.cancellationRate}% ביטולים` },
                { label: 'ממוצע למטופל', value: kpis.avgTreatmentsPerPatient, icon: '🔁', color: '#1e4a7a', sub: `${kpis.uniquePatients} מטופלים שונים` },
                { label: 'לא הגיעו', value: kpis.noShow, icon: '❌', color: '#dc2626', sub: 'no-show' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px', borderRight: `3px solid ${k.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{k.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a5c' }}>{k.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{k.label}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Payment method breakdown */}
            {kpis.paymentBreakdown && Object.keys(kpis.paymentBreakdown).length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>💳 פילוח לפי אמצעי תשלום</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '10px' }}>
                  {Object.entries(kpis.paymentBreakdown).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                    const colors: Record<string,string> = { 'מזומן': '#0b8a5e', 'טרנזילה': '#1e4a7a', 'ביט': '#7c3aed', 'פייבוקס': '#0891b2', 'העברה בנקאית': '#92400e' }
                    const color = colors[method] || '#64748b'
                    const pct = Math.round(((amount as number) / kpis.totalIncome) * 100)
                    return (
                      <div key={method} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', borderRight: `3px solid ${color}` }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color, marginBottom: '4px' }}>{method}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>₪{(amount as number).toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Charts row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>💰 הכנסות לפי חודש</div>
                <LineChart data={incomeByMonth} color="#0b8a5e" />
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>📅 תורים לפי חודש</div>
                <BarChart data={apptsByMonth} color="#7c3aed" />
              </div>
            </div>

            {/* Charts row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>🏥 טיפולים לפי סוג</div>
                <BarChart data={apptsByService} color="#3eb8e5" height={140} />
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>👥 מטופלים חדשים לפי חודש</div>
                <BarChart data={newPatientsByMonth} color="#1e4a7a" />
              </div>
            </div>

            {/* Peak hours */}
            {peakHours.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '14px' }}>⏰ שעות פיק — מתי הכי עמוס</div>
                <BarChart data={peakHours} color="#f59e0b" height={100} />
              </div>
            )}

            {/* Smart lists */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {/* Debtors */}
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#dc2626' }}>💸 חוב פתוח</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ממתין לתשלום</div>
                </div>
                {debtors.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>אין חובות פתוחים 🎉</div>
                ) : debtors.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #f8fafc' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{d.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.count} חיובים</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>₪{d.total.toLocaleString()}</span>
                      {d.phone && (
                        <a href={`https://wa.me/972${d.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: '11px', background: '#25d366', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          WA
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Lost patients */}
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#e8a020' }}>🔔 לא חזרו (4+ שבועות)</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>לחזרה</div>
                </div>
                {lostPatients.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>כולם חזרו לאחרונה 👍</div>
                ) : lostPatients.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.first_name} {p.last_name}</div>
                    {p.phone && (
                      <a href={`https://wa.me/972${p.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: '11px', background: '#25d366', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                        WA
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* No-shows + Cancellations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c' }}>❌ No-show לפי מטופל</div>
                </div>
                {noShows.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>אין no-shows בתקופה זו</div>
                ) : noShows.map((n, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600' }}>{n.name}</span>
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{n.count}×</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c' }}>🚫 ביטולים לפי סוג טיפול</div>
                </div>
                {cancellations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>אין ביטולים בתקופה זו</div>
                ) : cancellations.map(([name, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600' }}>{name}</span>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

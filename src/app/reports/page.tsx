'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function BarChart({ data, color = '#1a3a5c', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px` }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{d.value > 0 ? d.value : ''}</div>
          <div style={{ width: '100%', background: color, borderRadius: '4px 4px 0 0', height: `${Math.max((d.value / max) * (height - 30), d.value > 0 ? 4 : 0)}px`, transition: 'height 0.4s ease' }} />
          <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data, color = '#3eb8e5', height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 400, h = height - 30
  const pts = data.map((d, i) => ({ x: (i / Math.max(data.length - 1, 1)) * w, y: h - (d.value / max) * h }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${pts[pts.length - 1]?.x} ${h} L 0 ${h} Z`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: `${h}px` }}>
        <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
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

function CompareChart({ current, previous, currentYear, previousYear, height = 140, formatValue }: {
  current: number[]; previous: number[]; currentYear: number; previousYear: number; height?: number; formatValue?: (v: number) => string
}) {
  const max = Math.max(...current, ...previous, 1)
  const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']
  const barH = height - 40
  const fmt = formatValue || ((v: number) => v.toLocaleString())
  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#0b8a5e', borderRadius: '2px' }}/><span style={{ fontSize: '11px', color: '#64748b' }}>{currentYear}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#94a3b8', borderRadius: '2px' }}/><span style={{ fontSize: '11px', color: '#64748b' }}>{previousYear}</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${barH}px` }}>
        {Array.from({ length: 12 }, (_, i) => {
          const cur = current[i] || 0; const prev = previous[i] || 0
          const change = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', width: '100%' }}>
                <div title={`${previousYear}: ${fmt(prev)}`} style={{ flex: 1, background: '#cbd5e1', borderRadius: '3px 3px 0 0', height: `${Math.max((prev / max) * (barH - 20), prev > 0 ? 3 : 0)}px` }} />
                <div title={`${currentYear}: ${fmt(cur)}`} style={{ flex: 1, background: '#0b8a5e', borderRadius: '3px 3px 0 0', height: `${Math.max((cur / max) * (barH - 20), cur > 0 ? 3 : 0)}px` }} />
              </div>
              <div style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'center' }}>{MONTHS[i]}</div>
              {cur > 0 && prev > 0 && <div style={{ fontSize: '7px', fontWeight: '700', color: change >= 0 ? '#065f46' : '#991b1b' }}>{change >= 0 ? '+' : ''}{change}%</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Modal ניתוח נתון
function DrillDownModal({ kpiKey, kpiLabel, startMonth, endMonth, onClose }: { kpiKey: string; kpiLabel: string; startMonth: string; endMonth: string; onClose: () => void }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

  useEffect(() => { loadDrill() }, [])

  async function loadDrill() {
    setLoading(true)
    const start = `${startMonth}-01`, end = `${endMonth}-31`
    const months: string[] = []
    const cur = new Date(`${startMonth}-01`), endD = new Date(`${endMonth}-01`)
    while (cur <= endD) { months.push(cur.toISOString().slice(0, 7)); cur.setMonth(cur.getMonth() + 1) }

    if (kpiKey === 'income') {
      const { data: b } = await supabase.from('billing_records').select('amount,created_at,payment_method').eq('status','paid').gte('created_at',start).lte('created_at',end)
      const byMonth = months.map(m => ({ label: MONTHS[parseInt(m.slice(5,7))-1]+' '+m.slice(0,4), value: (b||[]).filter(x => x.created_at?.slice(0,7)===m).reduce((s,x)=>s+(x.amount||0),0) }))
      setData(byMonth)
    } else if (kpiKey === 'avg') {
      const { data: b } = await supabase.from('billing_records').select('amount,created_at').eq('status','paid').gte('created_at',start).lte('created_at',end)
      const byMonth = months.map(m => { const items = (b||[]).filter(x => x.created_at?.slice(0,7)===m); return { label: MONTHS[parseInt(m.slice(5,7))-1]+' '+m.slice(0,4), value: items.length > 0 ? Math.round(items.reduce((s,x)=>s+(x.amount||0),0)/items.length) : 0 } })
      setData(byMonth)
    } else if (kpiKey === 'appts') {
      const { data: a } = await supabase.from('appointments').select('date,status,service:service_types(name_he)').gte('date',start).lte('date',end)
      const byMonth = months.map(m => ({ label: MONTHS[parseInt(m.slice(5,7))-1]+' '+m.slice(0,4), value: (a||[]).filter(x => x.date?.slice(0,7)===m && x.status!=='cancelled').length }))
      setData(byMonth)
    } else if (kpiKey === 'avgPerPatient') {
      const { data: a } = await supabase.from('appointments').select('date,patient_id,status').gte('date',start).lte('date',end).neq('status','cancelled')
      const byMonth = months.map(m => { const items = (a||[]).filter(x => x.date?.slice(0,7)===m); const unique = new Set(items.map(x=>x.patient_id)).size; return { label: MONTHS[parseInt(m.slice(5,7))-1]+' '+m.slice(0,4), value: unique > 0 ? Math.round((items.length/unique)*10)/10 : 0 } })
      setData(byMonth)
    } else if (kpiKey === 'noshow') {
      const { data: a } = await supabase.from('appointments').select('date,patient:patients(first_name,last_name),status').eq('status','no_show').gte('date',start).lte('date',end)
      const byMonth = months.map(m => ({ label: MONTHS[parseInt(m.slice(5,7))-1]+' '+m.slice(0,4), value: (a||[]).filter(x => x.date?.slice(0,7)===m).length }))
      setData(byMonth)
    }
    setLoading(false)
  }

  const total = data.reduce((s,d) => s+d.value, 0)
  const avg = data.length > 0 ? Math.round(total/data.length) : 0
  const max = Math.max(...data.map(d=>d.value))
  const maxMonth = data.find(d=>d.value===max)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'700px', maxHeight:'85vh', overflow:'auto', direction:'rtl' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <div style={{ fontSize:'16px', fontWeight:'800', color:'#1a3a5c' }}>📊 ניתוח — {kpiLabel}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94a3b8' }}>✕</button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          {loading ? <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>טוען...</div> : (
            <>
              {/* סיכום */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
                {[
                  { label:'סה"כ בתקופה', value: kpiKey==='income' ? `₪${total.toLocaleString()}` : total.toLocaleString() },
                  { label:'ממוצע לחודש', value: kpiKey==='income' ? `₪${avg.toLocaleString()}` : avg.toLocaleString() },
                  { label:'חודש שיא', value: maxMonth?.label || '—' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#f8fafc', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                    <div style={{ fontSize:'18px', fontWeight:'800', color:'#1a3a5c' }}>{s.value}</div>
                    <div style={{ fontSize:'11px', color:'#64748b', marginTop:'4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* גרף */}
              <div style={{ marginBottom:'20px' }}>
                <BarChart data={data} color="#1a3a5c" height={140} />
              </div>
              {/* טבלה */}
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    <th style={{ padding:'8px 12px', textAlign:'right', color:'#64748b', fontWeight:'600' }}>חודש</th>
                    <th style={{ padding:'8px 12px', textAlign:'right', color:'#64748b', fontWeight:'600' }}>ערך</th>
                    <th style={{ padding:'8px 12px', textAlign:'right', color:'#64748b', fontWeight:'600' }}>מגמה</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d,i) => {
                    const prev = i > 0 ? data[i-1].value : null
                    const chg = prev && prev > 0 ? Math.round(((d.value-prev)/prev)*100) : null
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                        <td style={{ padding:'8px 12px', fontWeight:'500' }}>{d.label}</td>
                        <td style={{ padding:'8px 12px', fontWeight:'700', color:'#1a3a5c' }}>{kpiKey==='income' || kpiKey==='avg' ? `₪${d.value.toLocaleString()}` : d.value}</td>
                        <td style={{ padding:'8px 12px' }}>
                          {chg !== null && d.value > 0 && <span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:'700', background: chg>=0?'#d1fae5':'#fee2e2', color: chg>=0?'#065f46':'#991b1b' }}>{chg>=0?'+':''}{chg}%</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MONTH_NAMES = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

  const [viewMode, setViewMode] = useState<'period' | 'yearly'>('period')
  const [startMonth, setStartMonth] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 5); return d.toISOString().slice(0, 7) })
  const [endMonth, setEndMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [compareYear1, setCompareYear1] = useState(currentYear)
  const [compareYear2, setCompareYear2] = useState(currentYear - 1)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState('')
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
  const [serviceRevenue, setServiceRevenue] = useState<any[]>([])
  const [topPatientsByLTV, setTopPatientsByLTV] = useState<any[]>([])
  const [seasonality, setSeasonality] = useState<any[]>([])
  const [riskData, setRiskData] = useState<any>({})
  const [reportData, setReportData] = useState<any>(null)
  const [drillDown, setDrillDown] = useState<{key:string;label:string}|null>(null)
  const [yearCompare, setYearCompare] = useState<any>({ income1:[], income2:[], appts1:[], appts2:[], patients1:[], patients2:[] })
  const [yearSummary, setYearSummary] = useState<any>({ total1:0, total2:0, appts1:0, appts2:0 })

  useEffect(() => { load() }, [startMonth, endMonth])
  useEffect(() => { if (viewMode === 'yearly') loadYearlyComparison() }, [viewMode, compareYear1, compareYear2])

  async function loadYearlyComparison() {
    setLoading(true)
    const [{ data: b1 },{ data: b2 },{ data: a1 },{ data: a2 },{ data: p1 },{ data: p2 }] = await Promise.all([
      supabase.from('billing_records').select('amount,created_at').eq('status','paid').gte('created_at',`${compareYear1}-01-01`).lte('created_at',`${compareYear1}-12-31`),
      supabase.from('billing_records').select('amount,created_at').eq('status','paid').gte('created_at',`${compareYear2}-01-01`).lte('created_at',`${compareYear2}-12-31`),
      supabase.from('appointments').select('date').neq('status','cancelled').gte('date',`${compareYear1}-01-01`).lte('date',`${compareYear1}-12-31`),
      supabase.from('appointments').select('date').neq('status','cancelled').gte('date',`${compareYear2}-01-01`).lte('date',`${compareYear2}-12-31`),
      supabase.from('patients').select('created_at').gte('created_at',`${compareYear1}-01-01`).lte('created_at',`${compareYear1}-12-31`),
      supabase.from('patients').select('created_at').gte('created_at',`${compareYear2}-01-01`).lte('created_at',`${compareYear2}-12-31`),
    ])
    const inc1 = Array.from({length:12},(_,i) => (b1||[]).filter(b=>parseInt(b.created_at?.slice(5,7))===i+1).reduce((s,b)=>s+(b.amount||0),0))
    const inc2 = Array.from({length:12},(_,i) => (b2||[]).filter(b=>parseInt(b.created_at?.slice(5,7))===i+1).reduce((s,b)=>s+(b.amount||0),0))
    const ap1 = Array.from({length:12},(_,i) => (a1||[]).filter(a=>parseInt(a.date?.slice(5,7))===i+1).length)
    const ap2 = Array.from({length:12},(_,i) => (a2||[]).filter(a=>parseInt(a.date?.slice(5,7))===i+1).length)
    const pt1 = Array.from({length:12},(_,i) => (p1||[]).filter(p=>parseInt(p.created_at?.slice(5,7))===i+1).length)
    const pt2 = Array.from({length:12},(_,i) => (p2||[]).filter(p=>parseInt(p.created_at?.slice(5,7))===i+1).length)
    setYearCompare({income1:inc1,income2:inc2,appts1:ap1,appts2:ap2,patients1:pt1,patients2:pt2})
    setYearSummary({total1:inc1.reduce((s,v)=>s+v,0),total2:inc2.reduce((s,v)=>s+v,0),appts1:ap1.reduce((s,v)=>s+v,0),appts2:ap2.reduce((s,v)=>s+v,0)})
    setLoading(false)
  }

  async function load() {
    setLoading(true)
    const start = `${startMonth}-01`, end = `${endMonth}-31`
    const months: string[] = []
    const cur = new Date(`${startMonth}-01`), endD = new Date(`${endMonth}-01`)
    while (cur <= endD) { months.push(cur.toISOString().slice(0, 7)); cur.setMonth(cur.getMonth() + 1) }

    const [{ data: billingAll },{ data: apptsAll },{ data: patients },{ data: billingPending },{ data: allBillingEver }] = await Promise.all([
      supabase.from('billing_records').select('amount,status,payment_method,created_at,patient_id').gte('created_at',start).lte('created_at',end),
      supabase.from('appointments').select('*, patient:patients(first_name,last_name,phone), service:service_types(name_he,icon)').gte('date',start).lte('date',end),
      supabase.from('patients').select('id,first_name,last_name,phone,created_at,status').order('created_at'),
      supabase.from('billing_records').select('amount,patient_id,patient:patients(first_name,last_name,phone),description,created_at').eq('status','pending'),
      // רק מטופלים פעילים לסיכון עסקי
      supabase.from('billing_records').select('amount,patient_id,patient:patients(first_name,last_name,status),status,created_at'),
    ])

    const paid = (billingAll||[]).filter(b=>b.status==='paid')
    const totalIncome = paid.reduce((s,b)=>s+(b.amount||0),0)
    const totalAppts = (apptsAll||[]).length
    const cancelled = (apptsAll||[]).filter(a=>a.status==='cancelled').length
    const noShow = (apptsAll||[]).filter(a=>a.status==='no_show').length
    const avgIncome = paid.length > 0 ? Math.round(totalIncome/paid.length) : 0
    const uniquePatients = new Set((apptsAll||[]).filter(a=>a.status!=='cancelled').map(a=>a.patient_id)).size
    const avgTreatmentsPerPatient = uniquePatients > 0 ? Math.round(((apptsAll||[]).filter(a=>a.status!=='cancelled').length/uniquePatients)*10)/10 : 0
    const paymentBreakdown: Record<string,number> = {}
    paid.forEach(b => { const m = b.payment_method||'לא צוין'; paymentBreakdown[m]=(paymentBreakdown[m]||0)+(b.amount||0) })
    setKpis({totalIncome,totalAppts,cancelled,noShow,avgIncome,paidCount:paid.length,cancellationRate:totalAppts>0?Math.round((cancelled/totalAppts)*100):0,avgTreatmentsPerPatient,uniquePatients,paymentBreakdown})
    setIncomeByMonth(months.map(m=>({label:MONTH_NAMES[parseInt(m.slice(5,7))-1],value:paid.filter(b=>b.created_at?.slice(0,7)===m).reduce((s,b)=>s+(b.amount||0),0)})))
    setApptsByMonth(months.map(m=>({label:MONTH_NAMES[parseInt(m.slice(5,7))-1],value:(apptsAll||[]).filter(a=>a.date?.slice(0,7)===m&&a.status!=='cancelled').length})))
    setNewPatientsByMonth(months.map(m=>({label:MONTH_NAMES[parseInt(m.slice(5,7))-1],value:(patients||[]).filter(p=>p.created_at?.slice(0,7)===m).length})))
    const svcMap: Record<string,number> = {}
    ;(apptsAll||[]).filter(a=>a.status!=='cancelled').forEach(a=>{const name=a.service?.name_he||'אחר';svcMap[name]=(svcMap[name]||0)+1})
    setApptsByService(Object.entries(svcMap).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label:label.slice(0,8),value})))
    const svcRevenueMap: Record<string,{count:number;revenue:number}> = {}
    paid.forEach(b=>{
      const appt=(apptsAll||[]).find(a=>a.patient_id===b.patient_id&&a.date?.slice(0,7)===b.created_at?.slice(0,7))
      const svc=appt?.service?.name_he||'אחר'
      if(!svcRevenueMap[svc])svcRevenueMap[svc]={count:0,revenue:0}
      svcRevenueMap[svc].revenue+=(b.amount||0);svcRevenueMap[svc].count++
    })
    setServiceRevenue(Object.entries(svcRevenueMap).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,6).map(([name,d])=>({name,...d,avg:Math.round(d.revenue/d.count)})))

    // LTV — רק מטופלים פעילים
    const ltvMap: Record<string,{name:string;total:number;count:number}> = {}
    ;(allBillingEver||[]).filter(b=>b.status==='paid'&&(b.patient as any)?.status==='active').forEach(b=>{
      const pid=b.patient_id;const name=`${(b.patient as any)?.first_name} ${(b.patient as any)?.last_name}`
      if(!ltvMap[pid])ltvMap[pid]={name,total:0,count:0}
      ltvMap[pid].total+=(b.amount||0);ltvMap[pid].count++
    })
    setTopPatientsByLTV(Object.values(ltvMap).sort((a,b)=>b.total-a.total).slice(0,8))
    const totalPaidActive = Object.values(ltvMap).reduce((s,p)=>s+p.total,0)
    const topPatient = Object.values(ltvMap).sort((a,b)=>b.total-a.total)[0]
    const topPct = topPatient&&totalPaidActive>0?Math.round((topPatient.total/totalPaidActive)*100):0
    const avgLTV = Object.values(ltvMap).length>0?Math.round(totalPaidActive/Object.values(ltvMap).length):0
    setRiskData({topPatient,topPct,avgLTV,totalPatients:Object.values(ltvMap).length})

    const seasonMap: Record<number,number> = {}
    ;(allBillingEver||[]).filter(b=>b.status==='paid').forEach(b=>{const month=parseInt(b.created_at?.slice(5,7)||'1');seasonMap[month]=(seasonMap[month]||0)+(b.amount||0)})
    setSeasonality(Array.from({length:12},(_,i)=>({label:MONTH_NAMES[i],value:Math.round((seasonMap[i+1]||0)/1000)})))
    const hourMap: Record<number,number> = {}
    ;(apptsAll||[]).filter(a=>a.status!=='cancelled'&&a.time).forEach(a=>{const h=parseInt(a.time.slice(0,2));hourMap[h]=(hourMap[h]||0)+1})
    setPeakHours(Object.entries(hourMap).sort((a,b)=>Number(a[0])-Number(b[0])).map(([h,v])=>({label:`${h}:00`,value:v as number})))
    const cancelMap: Record<string,number> = {}
    ;(apptsAll||[]).filter(a=>a.status==='cancelled').forEach(a=>{const name=a.service?.name_he||'אחר';cancelMap[name]=(cancelMap[name]||0)+1})
    setCancellations(Object.entries(cancelMap).sort((a,b)=>b[1]-a[1]).slice(0,5))
    const nsMap: Record<string,{name:string;count:number}> = {}
    ;(apptsAll||[]).filter(a=>a.status==='no_show').forEach(a=>{const pid=a.patient_id;if(!nsMap[pid])nsMap[pid]={name:`${a.patient?.first_name} ${a.patient?.last_name}`,count:0};nsMap[pid].count++})
    setNoShows(Object.values(nsMap).sort((a,b)=>b.count-a.count).slice(0,5))
    const debtMap: Record<string,any> = {}
    ;(billingPending||[]).forEach(b=>{const pid=b.patient_id;if(!debtMap[pid])debtMap[pid]={name:`${(b.patient as any)?.first_name} ${(b.patient as any)?.last_name}`,phone:(b.patient as any)?.phone,total:0,count:0};debtMap[pid].total+=(b.amount||0);debtMap[pid].count++})
    setDebtors(Object.values(debtMap).sort((a,b)=>b.total-a.total).slice(0,10))
    const {data:recentAppts} = await supabase.from('appointments').select('patient_id').gte('date',new Date(Date.now()-28*86400000).toISOString().split('T')[0])
    const recentPids = new Set((recentAppts||[]).map(a=>a.patient_id))
    const {data:allActive} = await supabase.from('patients').select('id,first_name,last_name,phone').eq('status','active')
    setLostPatients((allActive||[]).filter(p=>!recentPids.has(p.id)).slice(0,10))
    setReportData({totalIncome,totalAppts,cancelled,noShow,avgIncome,uniquePatients,avgTreatmentsPerPatient,avgLTV,topPct,serviceRevenue:Object.entries(svcRevenueMap).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,4),months:months.length})
    setLoading(false)
  }

  async function getAiInsights() {
    if(!reportData)return
    setAiLoading(true);setAiInsights('')
    const prompt=`אתה יועץ עסקי לקליניקת פיזיותרפיה. נתח את הנתונים הבאים ותן תובנות עסקיות מעשיות בעברית.\n\nנתוני הקליניקה (${reportData.months} חודשים אחרונים):\n- הכנסות סה"כ: ₪${reportData.totalIncome?.toLocaleString()}\n- תורים: ${reportData.totalAppts} (${reportData.cancelled} ביטולים, ${reportData.noShow} no-show)\n- ממוצע לטיפול: ₪${reportData.avgIncome}\n- מטופלים פעילים: ${reportData.uniquePatients}\n- ממוצע טיפולים למטופל: ${reportData.avgTreatmentsPerPatient}\n- LTV ממוצע: ₪${reportData.avgLTV}\n- תלות בלקוח גדול: ${reportData.topPct}%\n\nספק:\n1. **3 תובנות עיקריות**\n2. **2 הזדמנויות עסקיות**\n3. **1 סיכון**\n4. **המלצה אחת קונקרטית** לחודש הקרוב`
    try {
      const res=await fetch('/api/ai-recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})})
      const data=await res.json();setAiInsights(data.text||'לא הצלחנו לקבל תובנות')
    } catch{setAiInsights('שגיאה בקבלת תובנות AI')}
    setAiLoading(false)
  }

  const inp = {padding:'7px 10px',border:'1px solid #e2e8f0',borderRadius:'7px',fontSize:'12px',fontFamily:'Heebo, sans-serif',outline:'none',background:'#fff'} as const
  const incomeChange = yearSummary.total2>0?Math.round(((yearSummary.total1-yearSummary.total2)/yearSummary.total2)*100):0
  const apptsChange = yearSummary.appts2>0?Math.round(((yearSummary.appts1-yearSummary.appts2)/yearSummary.appts2)*100):0

  const kpiCards = [
    {key:'income',label:'הכנסה',value:`₪${kpis.totalIncome?.toLocaleString()}`,icon:'💰',color:'#0b8a5e',sub:`${kpis.paidCount} תשלומים`},
    {key:'avg',label:'ממוצע לטיפול',value:`₪${kpis.avgIncome}`,icon:'📊',color:'#3eb8e5',sub:'ממוצע'},
    {key:'appts',label:'תורים',value:kpis.totalAppts,icon:'📅',color:'#7c3aed',sub:`${kpis.cancellationRate}% ביטולים`},
    {key:'avgPerPatient',label:'ממוצע למטופל',value:kpis.avgTreatmentsPerPatient,icon:'🔁',color:'#1e4a7a',sub:`${kpis.uniquePatients} מטופלים`},
    {key:'noshow',label:'לא הגיעו',value:kpis.noShow,icon:'❌',color:'#dc2626',sub:'no-show'},
  ]

  return (
    <AppLayout>
      <div style={{padding:'20px 24px'}} className="fade-in">

        {drillDown && <DrillDownModal kpiKey={drillDown.key} kpiLabel={drillDown.label} startMonth={startMonth} endMonth={endMonth} onClose={()=>setDrillDown(null)} />}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'10px'}}>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#1a3a5c'}}>📈 דוחות ואנליטיקס</h1>
          <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',background:'#fff',borderRadius:'8px',border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <button onClick={()=>setViewMode('period')} style={{padding:'8px 14px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:viewMode==='period'?'700':'400',background:viewMode==='period'?'#1a3a5c':'transparent',color:viewMode==='period'?'#fff':'#64748b',fontFamily:'Heebo, sans-serif'}}>📅 לפי תקופה</button>
              <button onClick={()=>{setViewMode('yearly');loadYearlyComparison()}} style={{padding:'8px 14px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:viewMode==='yearly'?'700':'400',background:viewMode==='yearly'?'#1a3a5c':'transparent',color:viewMode==='yearly'?'#fff':'#64748b',fontFamily:'Heebo, sans-serif'}}>📊 השוואת שנים</button>
            </div>
            {viewMode==='period' ? (
              <div style={{display:'flex',gap:'8px',alignItems:'center',background:'#fff',padding:'8px 12px',borderRadius:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <span style={{fontSize:'12px',color:'#64748b'}}>מ:</span>
                <input type="month" value={startMonth} onChange={e=>setStartMonth(e.target.value)} style={inp}/>
                <span style={{fontSize:'12px',color:'#64748b'}}>עד:</span>
                <input type="month" value={endMonth} onChange={e=>setEndMonth(e.target.value)} style={inp}/>
              </div>
            ) : (
              <div style={{display:'flex',gap:'8px',alignItems:'center',background:'#fff',padding:'8px 12px',borderRadius:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <select value={compareYear1} onChange={e=>setCompareYear1(Number(e.target.value))} style={inp}>
                  {years.map(y=><option key={y}>{y}</option>)}
                </select>
                <span style={{fontSize:'12px',color:'#64748b'}}>vs</span>
                <select value={compareYear2} onChange={e=>setCompareYear2(Number(e.target.value))} style={inp}>
                  {years.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
            )}
            <button onClick={getAiInsights} disabled={aiLoading||loading} style={{padding:'9px 16px',background:aiLoading?'#94a3b8':'linear-gradient(135deg, #7c3aed, #4f46e5)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:aiLoading?'not-allowed':'pointer',fontFamily:'Heebo, sans-serif'}}>
              {aiLoading?'⏳ מנתח...':'✨ תובנות AI'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>טוען נתונים...</div>
        ) : viewMode==='yearly' ? (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
              {[
                {label:`הכנסות ${compareYear1}`,value:`₪${yearSummary.total1.toLocaleString()}`,color:'#0b8a5e',icon:'💰'},
                {label:`הכנסות ${compareYear2}`,value:`₪${yearSummary.total2.toLocaleString()}`,color:'#94a3b8',icon:'💰'},
                {label:'שינוי הכנסות',value:`${incomeChange>=0?'+':''}${incomeChange}%`,color:incomeChange>=0?'#065f46':'#dc2626',icon:incomeChange>=0?'📈':'📉'},
                {label:'שינוי תורים',value:`${apptsChange>=0?'+':''}${apptsChange}%`,color:apptsChange>=0?'#1e4a7a':'#dc2626',icon:apptsChange>=0?'📈':'📉'},
              ].map(k=>(
                <div key={k.label} style={{background:'#fff',borderRadius:'12px',padding:'16px',borderRight:`3px solid ${k.color}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:'20px',marginBottom:'6px'}}>{k.icon}</div>
                  <div style={{fontSize:'22px',fontWeight:'800',color:k.color}}>{k.value}</div>
                  <div style={{fontSize:'11px',color:'#64748b',marginTop:'2px'}}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'16px',marginBottom:'16px'}}>
              <div style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'16px'}}>💰 הכנסות לפי חודש — {compareYear1} vs {compareYear2}</div>
                <CompareChart current={yearCompare.income1} previous={yearCompare.income2} currentYear={compareYear1} previousYear={compareYear2} height={180} formatValue={v=>`₪${v.toLocaleString()}`}/>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'16px'}}>📅 תורים לפי חודש — {compareYear1} vs {compareYear2}</div>
                <CompareChart current={yearCompare.appts1} previous={yearCompare.appts2} currentYear={compareYear1} previousYear={compareYear2} height={160}/>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'16px'}}>👥 מטופלים חדשים — {compareYear1} vs {compareYear2}</div>
                <CompareChart current={yearCompare.patients1} previous={yearCompare.patients2} currentYear={compareYear1} previousYear={compareYear2} height={140}/>
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>📋 טבלת השוואה מפורטת</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                <thead>
                  <tr style={{background:'#f8fafc'}}>
                    {['חודש',`הכנסות ${compareYear1}`,`הכנסות ${compareYear2}`,'שינוי',`תורים ${compareYear1}`,`תורים ${compareYear2}`].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'right',color:'#64748b',fontWeight:'600'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTH_NAMES.map((month,i)=>{
                    const inc1=yearCompare.income1[i]||0,inc2=yearCompare.income2[i]||0
                    const chg=inc2>0?Math.round(((inc1-inc2)/inc2)*100):0
                    return (
                      <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                        <td style={{padding:'8px 12px',fontWeight:'600'}}>{month}</td>
                        <td style={{padding:'8px 12px',color:'#0b8a5e',fontWeight:'600'}}>{inc1>0?`₪${inc1.toLocaleString()}`:'—'}</td>
                        <td style={{padding:'8px 12px',color:'#94a3b8'}}>{inc2>0?`₪${inc2.toLocaleString()}`:'—'}</td>
                        <td style={{padding:'8px 12px'}}>{inc1>0&&inc2>0&&<span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700',background:chg>=0?'#d1fae5':'#fee2e2',color:chg>=0?'#065f46':'#991b1b'}}>{chg>=0?'+':''}{chg}%</span>}</td>
                        <td style={{padding:'8px 12px',color:'#7c3aed',fontWeight:'600'}}>{yearCompare.appts1[i]||'—'}</td>
                        <td style={{padding:'8px 12px',color:'#94a3b8'}}>{yearCompare.appts2[i]||'—'}</td>
                      </tr>
                    )
                  })}
                  <tr style={{background:'#f8fafc',fontWeight:'800'}}>
                    <td style={{padding:'10px 12px'}}>סה"כ</td>
                    <td style={{padding:'10px 12px',color:'#0b8a5e'}}>₪{yearSummary.total1.toLocaleString()}</td>
                    <td style={{padding:'10px 12px',color:'#94a3b8'}}>₪{yearSummary.total2.toLocaleString()}</td>
                    <td style={{padding:'10px 12px'}}><span style={{padding:'3px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:'700',background:incomeChange>=0?'#d1fae5':'#fee2e2',color:incomeChange>=0?'#065f46':'#991b1b'}}>{incomeChange>=0?'+':''}{incomeChange}%</span></td>
                    <td style={{padding:'10px 12px',color:'#7c3aed'}}>{yearSummary.appts1}</td>
                    <td style={{padding:'10px 12px',color:'#94a3b8'}}>{yearSummary.appts2}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {aiInsights&&(
              <div style={{background:'linear-gradient(135deg, #f5f3ff, #ede9fe)',border:'2px solid #7c3aed',borderRadius:'14px',padding:'20px',marginBottom:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <div style={{fontWeight:'800',fontSize:'14px',color:'#4c1d95'}}>✨ תובנות AI לעסק שלך</div>
                  <button onClick={()=>setAiInsights('')} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:'16px'}}>✕</button>
                </div>
                <div style={{fontSize:'13px',color:'#374151',lineHeight:'1.9',whiteSpace:'pre-wrap',direction:'rtl'}}>{aiInsights}</div>
              </div>
            )}

            {/* KPIs — לחיצים */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'16px'}}>
              {kpiCards.map(k=>(
                <div key={k.key} onClick={()=>setDrillDown({key:k.key,label:k.label})}
                  style={{background:'#fff',borderRadius:'12px',padding:'14px',borderRight:`3px solid ${k.color}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',cursor:'pointer',transition:'box-shadow 0.15s'}}
                  onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)')}
                  onMouseLeave={e=>(e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)')}>
                  <div style={{fontSize:'18px',marginBottom:'4px'}}>{k.icon}</div>
                  <div style={{fontSize:'20px',fontWeight:'800',color:'#1a3a5c'}}>{k.value}</div>
                  <div style={{fontSize:'11px',color:'#64748b',marginTop:'1px'}}>{k.label}</div>
                  <div style={{fontSize:'10px',color:'#94a3b8'}}>{k.sub}</div>
                  <div style={{fontSize:'10px',color:k.color,marginTop:'3px',fontWeight:'600'}}>לחץ לניתוח ←</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>⚠️ סיכון עסקי — מטופלים פעילים בלבד</div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:riskData.topPct>20?'#fee2e2':'#d1fae5',borderRadius:'8px'}}>
                    <span style={{fontSize:'12px',color:'#374151'}}>מטופל מוביל</span>
                    <span style={{fontSize:'13px',fontWeight:'700',color:riskData.topPct>20?'#dc2626':'#065f46'}}>{riskData.topPatient?.name} — {riskData.topPct}%</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'#f8fafc',borderRadius:'8px'}}>
                    <span style={{fontSize:'12px',color:'#374151'}}>LTV ממוצע (פעילים)</span>
                    <span style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c'}}>₪{riskData.avgLTV?.toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'10px',background:'#f8fafc',borderRadius:'8px'}}>
                    <span style={{fontSize:'12px',color:'#374151'}}>מטופלים פעילים ששילמו</span>
                    <span style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c'}}>{riskData.totalPatients}</span>
                  </div>
                  {riskData.topPct>20&&<div style={{fontSize:'11px',color:'#dc2626',padding:'8px',background:'#fee2e2',borderRadius:'6px'}}>⚠️ תלות גבוהה — מטופל אחד מייצג יותר מ-20%</div>}
                </div>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>👑 מטופלים פעילים לפי ערך (LTV)</div>
                {topPatientsByLTV.slice(0,6).map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #f8fafc'}}>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <span style={{fontSize:'11px',color:'#94a3b8',minWidth:'16px'}}>#{i+1}</span>
                      <span style={{fontSize:'12px',fontWeight:'600'}}>{p.name}</span>
                    </div>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:'#0b8a5e'}}>₪{p.total.toLocaleString()}</div>
                      <div style={{fontSize:'10px',color:'#94a3b8'}}>{p.count} תשלומים</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {serviceRevenue.length>0&&(
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>💹 רווחיות לפי סוג שירות</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',gap:'10px'}}>
                  {serviceRevenue.map((s,i)=>(
                    <div key={i} style={{padding:'12px',background:'#f8fafc',borderRadius:'10px',borderRight:'3px solid #0b8a5e'}}>
                      <div style={{fontSize:'12px',fontWeight:'700',color:'#1a3a5c',marginBottom:'6px'}}>{s.name}</div>
                      <div style={{fontSize:'16px',fontWeight:'800',color:'#0b8a5e'}}>₪{s.revenue.toLocaleString()}</div>
                      <div style={{fontSize:'11px',color:'#64748b'}}>{s.count} תשלומים · ממוצע ₪{s.avg}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kpis.paymentBreakdown&&Object.keys(kpis.paymentBreakdown).length>0&&(
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>💳 פילוח לפי אמצעי תשלום</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))',gap:'10px'}}>
                  {(Object.entries(kpis.paymentBreakdown) as [string,number][]).sort((a,b)=>b[1]-a[1]).map(([method,amount])=>{
                    const colors: Record<string,string>={'מזומן':'#0b8a5e','כרטיס אשראי':'#1e4a7a','ביט':'#7c3aed','פייבוקס':'#0891b2','העברה בנקאית':'#92400e'}
                    const color=colors[method]||'#64748b'
                    const pct=Math.round(((amount as number)/kpis.totalIncome)*100)
                    return (
                      <div key={method} style={{padding:'12px',background:'#f8fafc',borderRadius:'10px',borderRight:`3px solid ${color}`}}>
                        <div style={{fontSize:'12px',fontWeight:'700',color,marginBottom:'4px'}}>{method}</div>
                        <div style={{fontSize:'16px',fontWeight:'800',color:'#1a3a5c'}}>₪{(amount as number).toLocaleString()}</div>
                        <div style={{fontSize:'11px',color:'#94a3b8'}}>{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>💰 הכנסות לפי חודש</div>
                <LineChart data={incomeByMonth} color="#0b8a5e"/>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>📅 תורים לפי חודש</div>
                <BarChart data={apptsByMonth} color="#7c3aed"/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>🏥 טיפולים לפי סוג</div>
                <BarChart data={apptsByService} color="#3eb8e5" height={140}/>
              </div>
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>👥 מטופלים חדשים לפי חודש</div>
                <BarChart data={newPatientsByMonth} color="#1e4a7a"/>
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>🌊 עונתיות — הכנסות לפי חודש (₪ אלפים)</div>
              <BarChart data={seasonality} color="#f59e0b" height={100}/>
            </div>

            {peakHours.length>0&&(
              <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c',marginBottom:'14px'}}>⏰ שעות פיק</div>
                <BarChart data={peakHours} color="#0891b2" height={100}/>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
              <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}><div style={{fontWeight:'700',fontSize:'13px',color:'#dc2626'}}>💸 חוב פתוח</div></div>
                {debtors.length===0?<div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'12px'}}>אין חובות 🎉</div>:debtors.map((d,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 18px',borderBottom:'1px solid #f8fafc'}}>
                    <div><div style={{fontSize:'13px',fontWeight:'600'}}>{d.name}</div><div style={{fontSize:'11px',color:'#94a3b8'}}>{d.count} חיובים</div></div>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <span style={{fontSize:'13px',fontWeight:'700',color:'#dc2626'}}>₪{d.total.toLocaleString()}</span>
                      {d.phone&&<a href={`https://wa.me/972${d.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:'11px',background:'#25d366',color:'#fff',padding:'3px 8px',borderRadius:'6px',fontWeight:'600'}}>WA</a>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}><div style={{fontWeight:'700',fontSize:'13px',color:'#e8a020'}}>🔔 לא חזרו (4+ שבועות)</div></div>
                {lostPatients.length===0?<div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'12px'}}>כולם חזרו 👍</div>:lostPatients.map((p,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 18px',borderBottom:'1px solid #f8fafc'}}>
                    <div style={{fontSize:'13px',fontWeight:'600'}}>{p.first_name} {p.last_name}</div>
                    {p.phone&&<a href={`https://wa.me/972${p.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:'11px',background:'#25d366',color:'#fff',padding:'3px 8px',borderRadius:'6px',fontWeight:'600'}}>WA</a>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}><div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c'}}>❌ No-show לפי מטופל</div></div>
                {noShows.length===0?<div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'12px'}}>אין no-shows</div>:noShows.map((n,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 18px',borderBottom:'1px solid #f8fafc',fontSize:'13px'}}>
                    <span style={{fontWeight:'600'}}>{n.name}</span>
                    <span style={{background:'#fee2e2',color:'#991b1b',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{n.count}×</span>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',borderRadius:'12px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9'}}><div style={{fontWeight:'700',fontSize:'13px',color:'#1a3a5c'}}>🚫 ביטולים לפי סוג טיפול</div></div>
                {cancellations.length===0?<div style={{padding:'20px',textAlign:'center',color:'#94a3b8',fontSize:'12px'}}>אין ביטולים</div>:cancellations.map(([name,count],i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 18px',borderBottom:'1px solid #f8fafc',fontSize:'13px'}}>
                    <span style={{fontWeight:'600'}}>{name}</span>
                    <span style={{background:'#fef3c7',color:'#92400e',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{count}×</span>
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

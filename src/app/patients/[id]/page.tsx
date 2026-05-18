'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, HMO_OPTIONS, APPOINTMENT_STATUS } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import HEPPanel from '@/components/HEPPanel'

const inp = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Heebo, sans-serif', background:'#fff' } as const
const ta = { ...{width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Heebo, sans-serif', background:'#fff'}, minHeight:'80px', resize:'vertical' as const }
const lbl = { display:'block' as const, fontSize:'11px', fontWeight:'700' as const, color:'#64748b', marginBottom:'4px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }
const card = { background:'#fff', borderRadius:'12px', padding:'18px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }

const FOOTER = `\n\nבברכה,\nקליניקת יואב אבני 🏥\n📍 רחוב התרשיש 8, גילון\n🌐 https://www.yoav-avni-clinic.com\n📸 https://www.instagram.com/yoavavni.pt`

function waPhone(phone: string) {
  return `972${phone?.replace(/^0/, '').replace(/-/g, '')}`
}

function isLocal(city: string) {
  return city && (city.includes('גילון') || city.includes('צורית'))
}

function getServicePrice(serviceName: string, city: string) {
  if (!serviceName) return 360
  if (serviceName.includes('פיזיו') && isLocal(city)) return 330
  if (serviceName.includes('פיזיו')) return 360
  if (serviceName.includes('מים') || serviceName.includes('הידרו')) return 340
  if (serviceName.includes('בית')) return 400
  if (serviceName.includes('קבוצתי')) return 140
  if (serviceName.includes('מדרסים') || serviceName.includes('אורתו')) return 1500
  if (serviceName.includes('היברידית+') || serviceName.includes('פרמיום')) return 1500
  if (serviceName.includes('היברידית')) return 650
  return 360
}

function buildContractMsg(patient: any, nextAppt: any) {
  const name = `${patient.first_name} ${patient.last_name}`
  const date = nextAppt ? new Date(nextAppt.date).toLocaleDateString('he-IL') : '___'
  const time = nextAppt?.time?.slice(0, 5) || '___'
  const service = nextAppt?.service?.name_he || 'פיזיותרפיה'
  const city = patient.city || ''
  const price = getServicePrice(service, city)
  const local = isLocal(city)

  if (service.includes('מים') || service.includes('הידרו')) {
    return `בוקר טוב ${name} 😊\n\nקבענו טיפול פיזיותרפיה במים בתאריך ${date} בשעה ${time}\nטיפול פיזיותרפיה במים אורך 60 דקות.\nעלות ${price} ₪ לטיפול.\n\nנא להביא:\n🩱 בגד ים\n🏊 כובע ים (חובה)\n🧴 מגבת\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`
  }
  if (service.includes('בית')) {
    return `בוקר טוב ${name} 😊\n\nקבענו ביקור בית בתאריך ${date} בשעה ${time}\nהטיפול אורך כ-60 דקות.\nעלות ${price} ₪ לטיפול.\n\nאנא הכינו מקום נוח ומרווח לטיפול.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`
  }
  if (service.includes('קבוצת ריצה') || service.includes('היברידי')) {
    return `בוקר טוב ${name} 😊\n\nברוך הבא לחבילת ריצה! 🏃\n\nהמפגש הראשון בתאריך ${date} בשעה ${time}\nעלות ${price} ₪ לחודש.\n\nביטול או שינוי יתבצע עד יום לפני ב-10:00.${FOOTER}`
  }
  if (service.includes('קבוצתי')) {
    return `בוקר טוב ${name} 😊\n\nקבענו טיפול שיקום קבוצתי בתאריך ${date} בשעה ${time}\nעלות ${price} ₪ למתאמן.\n\nנא להגיע עם בגדים נוחים.\nביטול או שינוי יתבצע עד יום לפני ב-10:00.${FOOTER}`
  }
  return `בוקר טוב ${name} 😊\n\nקבענו טיפול פיזיותרפיה בתאריך ${date} בשעה ${time}\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות ${price} ₪ לטיפול${local ? ' לתושבי גילון וצורית' : ''}.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${FOOTER}`
}

function buildReminderMsg(patient: any, nextAppt: any) {
  const name = `${patient.first_name} ${patient.last_name}`
  const date = nextAppt ? new Date(nextAppt.date).toLocaleDateString('he-IL') : '___'
  const time = nextAppt?.time?.slice(0, 5) || '___'
  return `שלום ${name} 😊\n\nתזכורת — יש לך תור מחר ${date} בשעה ${time}.\n\n📍 רחוב התרשיש 8, גילון\nלשינוי או ביטול — עד הערב ב-10:00.\n\nמחכים לך! 🙏\nקליניקת יואב אבני`
}

function buildPaymentMsg(patient: any, lastAppt: any) {
  const name = `${patient.first_name} ${patient.last_name}`
  const service = lastAppt?.service?.name_he || 'טיפול'
  const { price, link } = getPaymentLink(service, patient.city || '')
  return `שלום ${name} 😊\n\nתזכורת לתשלום עבור ${service}.\nסכום: ₪${price}\n\n💳 לתשלום באשראי:\n${link}\n\nתודה! 🙏\nקליניקת יואב אבני`
}

function openWA(phone: string, msg: string) {
  window.open(`https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(msg)}`, '_blank')
}

const PAYMENT_LINKS: Record<string, { price: number; link: string }> = {
  'physio_local':  { price: 330,  link: 'https://www.yoav-avni-clinic.com/_paylink/AZtZIkT9' },
  'physio':        { price: 360,  link: 'https://www.yoav-avni-clinic.com/_paylink/AZvCL5XV' },
  'hydro':         { price: 340,  link: 'https://www.yoav-avni-clinic.com/_paylink/AZa0Pm4K' },
  'home':          { price: 400,  link: 'https://www.yoav-avni-clinic.com/_paylink/AZZsK6kw' },
  'ortho':         { price: 1500, link: 'https://www.yoav-avni-clinic.com/_paylink/AZx5lGoD' },
  'run_basic':     { price: 650,  link: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TL4Bx' },
  'run_plus':      { price: 1000, link: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TMBia' },
  'run_premium':   { price: 1500, link: 'https://www.yoav-avni-clinic.com/_paylink/AZ4TMJ68' },
}

function getPaymentLink(serviceName: string, city: string): { price: number; link: string } {
  if (!serviceName) return PAYMENT_LINKS['physio']
  if ((serviceName.includes('פיזיו') && !serviceName.includes('מים')) && isLocal(city)) return PAYMENT_LINKS['physio_local']
  if (serviceName.includes('פיזיו') && !serviceName.includes('מים')) return PAYMENT_LINKS['physio']
  if (serviceName.includes('מים') || serviceName.includes('הידרו')) return PAYMENT_LINKS['hydro']
  if (serviceName.includes('בית')) return PAYMENT_LINKS['home']
  if (serviceName.includes('מדרס') || serviceName.includes('אורתו')) return PAYMENT_LINKS['ortho']
  if (serviceName.includes('פרמיום') || serviceName.includes('1500')) return PAYMENT_LINKS['run_premium']
  if (serviceName.includes('היברידית+') || serviceName.includes('1000')) return PAYMENT_LINKS['run_plus']
  if (serviceName.includes('היברידית') || serviceName.includes('ריצה')) return PAYMENT_LINKS['run_basic']
  return PAYMENT_LINKS['physio']
}

function getFundingLabel(patient: any) {
  if (!patient.funding_type || patient.funding_type === 'self') return null
  if (patient.funding_type === 'hmo') return patient.hmo || 'קופת חולים'
  if (patient.funding_type === 'insurance') return patient.insurance ? `ביטוח: ${patient.insurance}` : 'ביטוח פרטי'
  if (patient.funding_type === 'group') return patient.funding_group_name ? `קבוצה: ${patient.funding_group_name}` : 'קבוצה'
  return null
}

export default function PatientProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [tab, setTab] = useState<'overview'|'intake'|'goals'|'appointments'|'records'|'billing'>('overview')
  const [intake, setIntake] = useState<any>({})
  const [intakeSaving, setIntakeSaving] = useState(false)
  const [goals, setGoals] = useState<any[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalForm, setGoalForm] = useState({ action: '', measure: '', difficulty: 'ללא קושי', target_date: '', notes: '' })
  const [updateText, setUpdateText] = useState<Record<string,string>>({})
  const [goalUpdates, setGoalUpdates] = useState<Record<string,any[]>>({})

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    const [{ data: p }, { data: a }, { data: r }, { data: b }, { data: g }] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*, service:service_types(name_he,icon,color)').eq('patient_id', id).order('date', { ascending: false }).limit(20),
      supabase.from('treatment_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('billing_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('treatment_goals').select('*').eq('patient_id', id).order('created_at'),
    ])
    setPatient(p); setForm(p || {})
    setAppointments(a || []); setRecords(r || []); setBilling(b || [])
    setGoals(g || [])
    if (p?.intake_data) { try { setIntake(JSON.parse(p.intake_data)) } catch {} }
    if (g && g.length > 0) {
      const { data: updates } = await supabase.from('goal_updates').select('*').in('goal_id', g.map((x:any)=>x.id)).order('date')
      const map: Record<string,any[]> = {}
      ;(updates||[]).forEach((u:any) => { if(!map[u.goal_id]) map[u.goal_id]=[]; map[u.goal_id].push(u) })
      setGoalUpdates(map)
    }
    setLoading(false)
  }

  const set = (f: string, v: string) => setForm((p: any) => ({ ...p, [f]: v }))
  const setI = (f: string, v: any) => setIntake((p: any) => ({ ...p, [f]: v }))

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('patients').update(form).eq('id', id)
    setSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    setPatient(form); setEditing(false)
  }

  async function saveIntake() {
    setIntakeSaving(true)
    const { error } = await supabase.from('patients').update({ intake_data: JSON.stringify(intake) }).eq('id', id)
    setIntakeSaving(false)
    if (error) { alert('שגיאה: ' + error.message); return }
    alert('ראיון הקבלה נשמר!')
  }

  const setG = (f: string, v: string) => setGoalForm(p => ({ ...p, [f]: v }))

  async function saveGoal() {
    if (!goalForm.action || !goalForm.measure) { alert('יש למלא פעולה ומדד'); return }
    setGoalSaving(true)
    await supabase.from('treatment_goals').insert([{ ...goalForm, patient_id: id }])
    setGoalSaving(false)
    setShowGoalForm(false)
    setGoalForm({ action: '', measure: '', difficulty: 'ללא קושי', target_date: '', notes: '' })
    loadAll()
  }

  async function updateGoalStatus(goalId: string, status: string) {
    await supabase.from('treatment_goals').update({ status }).eq('id', goalId)
    loadAll()
  }

  async function addGoalUpdate(goalId: string) {
    const text = updateText[goalId]
    if (!text) return
    await supabase.from('goal_updates').insert([{ goal_id: goalId, note: text }])
    setUpdateText(p => ({ ...p, [goalId]: '' }))
    loadAll()
  }

  const totalPaid = billing.filter(b => b.status === 'paid').reduce((s, b) => s + (b.amount || 0), 0)

  if (loading) return <AppLayout><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#94a3b8' }}>טוען...</div></AppLayout>
  if (!patient) return <AppLayout><div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>מטופל לא נמצא</div></AppLayout>

  const tabs = [
    { key: 'overview',     label: 'סקירה כללית' },
    { key: 'intake',       label: '📋 ראיון קבלה' },
    { key: 'goals',        label: `🎯 מטרות (${goals.length})` },
    { key: 'appointments', label: `תורים (${appointments.length})` },
    { key: 'records',      label: `SOAP (${records.length})` },
    { key: 'billing',      label: `חיוב (${billing.length})` },
  ]

  const fundingLabel = getFundingLabel(patient)

  return (
    <AppLayout>
      <div style={{ padding:'20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <button onClick={() => router.back()} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:'#94a3b8' }}>←</button>
            <div style={{ width:'52px', height:'52px', background:'#1a3a5c', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'800', color:'#fff', flexShrink:0 }}>
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#1a3a5c' }}>{patient.first_name} {patient.last_name}</h1>
              <div style={{ display:'flex', gap:'10px', marginTop:'3px', fontSize:'12px', color:'#64748b', flexWrap:'wrap' }}>
                {patient.phone && <a href={`tel:${patient.phone}`} style={{ color:'#1a3a5c', fontWeight:'600' }}>{patient.phone}</a>}
                {fundingLabel && <span style={{ background:'#dbeafe', color:'#1e40af', padding:'1px 8px', borderRadius:'12px', fontWeight:'600' }}>💰 {fundingLabel}</span>}
                {patient.diagnosis && <span style={{ color:'#7c3aed' }}>• {patient.diagnosis}</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {patient.phone && (() => {
              const today = new Date().toISOString().split('T')[0]
              const nextAppt = appointments.find(a => a.date >= today && a.status !== 'cancelled')
              const lastAppt = appointments.find(a => a.date <= today && a.status === 'completed')
              return (
                <>
                  {nextAppt && (
                    <button onClick={() => openWA(patient.phone, buildContractMsg(patient, nextAppt))}
                      style={{ padding:'8px 12px', background:'#1e4a7a', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                      📋 חוזה טיפולי
                    </button>
                  )}
                  {nextAppt && (
                    <button onClick={() => openWA(patient.phone, buildReminderMsg(patient, nextAppt))}
                      style={{ padding:'8px 12px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                      ⏰ תזכורת לתור
                    </button>
                  )}
                  <button onClick={() => openWA(patient.phone, buildPaymentMsg(patient, lastAppt || nextAppt))}
                    style={{ padding:'8px 12px', background:'#0b8a5e', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                    💳 תזכורת תשלום
                  </button>
                  <Link href={`/whatsapp?patient=${id}`} style={{ padding:'8px 12px', background:'#25d366', color:'#fff', borderRadius:'8px', fontSize:'11px', fontWeight:'700' }}>
                    💬 כל ההודעות
                  </Link>
                  <button onClick={() => {
                    const phone = patient.phone?.replace(/^0/,'').replace(/-/g,'')
                    const msg = encodeURIComponent(`שלום ${patient.first_name} ${patient.last_name} 😊\n\nיצרנו עבורך גישה אישית לפורטל הקליניקה!\n\n🔗 לכניסה:\nhttps://yoavavni-9dy3.vercel.app/portal\n\nהיכנס עם מספר הטלפון שלך: ${patient.phone}\n\nבפורטל תוכל:\n📅 לקבוע תורים בעצמך\n📋 לראות את התורים הקרובים שלך\n\nקליניקת יואב אבני`)
                    window.open(`https://wa.me/972${phone}?text=${msg}`, '_blank')
                  }} style={{ padding:'8px 12px', background:'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                    🔗 הזמן לפורטל
                  </button>
                </>
              )
            })()}
            <Link href={`/records/new?patient=${id}`} style={{ padding:'8px 14px', background:'#7c3aed', color:'#fff', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>+ SOAP</Link>
            <Link href={`/calendar/new?patient=${id}`} style={{ padding:'8px 14px', background:'#3eb8e5', color:'#fff', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>+ תור</Link>
            {patient && <HEPPanel patient={patient} />}
            <button onClick={() => setEditing(!editing)} style={{ padding:'8px 14px', background:editing?'#e2e8f0':'#1a3a5c', color:editing?'#475569':'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
              {editing ? 'ביטול' : '✏️ עריכה'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { label:'סה"כ תורים', value:appointments.length, icon:'📅', color:'#3eb8e5' },
            { label:'טיפולים SOAP', value:records.length, icon:'📋', color:'#7c3aed' },
            { label:'שולם סה"כ', value:`₪${totalPaid.toLocaleString()}`, icon:'💰', color:'#0b8a5e' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'10px', padding:'14px', borderRight:`3px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'20px', marginBottom:'6px' }}>{s.icon}</div>
              <div style={{ fontSize:'20px', fontWeight:'800' }}>{s.value}</div>
              <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* VAS Chart */}
        {records.filter(r => r.vas_score != null).length > 1 && (() => {
          const vasData = records.filter(r => r.vas_score != null).reverse()
          const max = 10
          const w = 400, h = 80
          const pts = vasData.map((r, i) => ({
            x: (i / Math.max(vasData.length - 1, 1)) * w,
            y: h - (r.vas_score / max) * h,
            score: r.vas_score,
            date: new Date(r.created_at).toLocaleDateString('he-IL', { day:'numeric', month:'numeric' })
          }))
          const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
          const area = `${path} L ${pts[pts.length-1].x} ${h} L 0 ${h} Z`
          const first = vasData[0]?.vas_score
          const last = vasData[vasData.length-1]?.vas_score
          const trend = last < first ? '📉 ירידה בכאב' : last > first ? '📈 עלייה בכאב' : '➡️ יציב'
          const trendColor = last < first ? '#065f46' : last > first ? '#991b1b' : '#92400e'
          return (
            <div style={{ background:'#fff', borderRadius:'12px', padding:'16px', marginBottom:'14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <div style={{ fontWeight:'700', fontSize:'13px', color:'#1a3a5c' }}>📊 מגמת כאב VAS</div>
                <span style={{ fontSize:'11px', fontWeight:'700', color: trendColor, background: last < first ? '#d1fae5' : last > first ? '#fee2e2' : '#fef3c7', padding:'3px 10px', borderRadius:'20px' }}>
                  {trend}
                </span>
              </div>
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:'80px' }}>
                <defs>
                  <linearGradient id="vasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#vasGrad)" />
                <path d={path} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#ef4444" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">{p.score}</text>
                  </g>
                ))}
              </svg>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
                {pts.map((p, i) => <div key={i} style={{ fontSize:'9px', color:'#94a3b8', textAlign:'center', flex:1 }}>{p.date}</div>)}
              </div>
            </div>
          )
        })()}

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'2px solid #f1f5f9', marginBottom:'16px', overflowX:'auto' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              padding:'10px 14px', border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap',
              fontSize:'13px', fontWeight:tab===t.key?'700':'400',
              color:tab===t.key?'#1a3a5c':'#94a3b8',
              borderBottom:tab===t.key?'2px solid #1a3a5c':'2px solid transparent',
              marginBottom:'-2px', fontFamily:'Heebo, sans-serif',
            }}>{t.label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div style={card}>
              <h3 style={{ fontWeight:'700', marginBottom:'14px', fontSize:'13px', color:'#64748b' }}>📋 פרטים אישיים</h3>
              {editing ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div><label style={lbl}>שם פרטי</label><input style={inp} value={form.first_name||''} onChange={e=>set('first_name',e.target.value)}/></div>
                  <div><label style={lbl}>שם משפחה</label><input style={inp} value={form.last_name||''} onChange={e=>set('last_name',e.target.value)}/></div>
                  <div><label style={lbl}>טלפון</label><input style={{...inp,direction:'ltr'}} value={form.phone||''} onChange={e=>set('phone',e.target.value)}/></div>
                  <div><label style={lbl}>אימייל</label><input style={{...inp,direction:'ltr'}} value={form.email||''} onChange={e=>set('email',e.target.value)}/></div>
                  <div><label style={lbl}>ת.ז.</label><input style={{...inp,direction:'ltr'}} value={form.id_number||''} onChange={e=>set('id_number',e.target.value)}/></div>
                  <div><label style={lbl}>תאריך לידה</label><input type="date" style={inp} value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)}/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={lbl}>כתובת</label><input style={inp} value={form.address||''} onChange={e=>set('address',e.target.value)}/></div>
                  <div><label style={lbl}>עיר</label><input style={inp} value={form.city||''} onChange={e=>set('city',e.target.value)}/></div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[['שם',`${patient.first_name} ${patient.last_name}`],['ת.ז.',patient.id_number],['תאריך לידה',patient.date_of_birth?new Date(patient.date_of_birth).toLocaleDateString('he-IL'):null],['טלפון',patient.phone],['אימייל',patient.email],['כתובת',[patient.address,patient.city].filter(Boolean).join(', ')]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l as string} style={{display:'flex',gap:'8px',fontSize:'13px'}}>
                      <span style={{color:'#94a3b8',minWidth:'80px',flexShrink:0}}>{l}</span>
                      <span style={{fontWeight:'500',color:'#1e293b'}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={card}>
              <h3 style={{ fontWeight:'700', marginBottom:'14px', fontSize:'13px', color:'#64748b' }}>🏥 מידע רפואי</h3>
              {editing ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  {/* סוג מימון */}
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={lbl}>סוג מימון</label>
                    <select style={inp} value={form.funding_type||'self'} onChange={e=>set('funding_type',e.target.value)}>
                      <option value="self">עצמי</option>
                      <option value="hmo">קופת חולים</option>
                      <option value="insurance">ביטוח פרטי</option>
                      <option value="group">קבוצה</option>
                    </select>
                  </div>
                  {form.funding_type==='hmo' && (
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={lbl}>קופת חולים</label>
                      <select style={inp} value={form.hmo||''} onChange={e=>set('hmo',e.target.value)}>
                        <option value="">בחר...</option>
                        {HMO_OPTIONS.map(h=><option key={h}>{h}</option>)}
                      </select>
                    </div>
                  )}
                  {form.funding_type==='insurance' && (
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={lbl}>חברת ביטוח</label>
                      <input style={inp} value={form.insurance||''} onChange={e=>set('insurance',e.target.value)} placeholder="מגדל, כלל, מנורה..."/>
                    </div>
                  )}
                  {form.funding_type==='group' && (
                    <div style={{gridColumn:'1/-1'}}>
                      <label style={lbl}>שם הקבוצה</label>
                      <input style={inp} value={form.funding_group_name||''} onChange={e=>set('funding_group_name',e.target.value)} placeholder="מכבי, צבא, עבודה..."/>
                    </div>
                  )}
                  <div style={{gridColumn:'1/-1'}}><label style={lbl}>אבחנה</label><input style={inp} value={form.diagnosis||''} onChange={e=>set('diagnosis',e.target.value)}/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={lbl}>רקע רפואי</label><textarea style={ta} value={form.medical_history||''} onChange={e=>set('medical_history',e.target.value)}/></div>
                  <div><label style={lbl}>תרופות</label><input style={inp} value={form.medications||''} onChange={e=>set('medications',e.target.value)}/></div>
                  <div><label style={lbl}>אלרגיות</label><input style={inp} value={form.allergies||''} onChange={e=>set('allergies',e.target.value)}/></div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[
                    ['גורם מממן', fundingLabel],
                    ['אבחנה',patient.diagnosis],
                    ['רקע רפואי',patient.medical_history],
                    ['תרופות',patient.medications],
                    ['אלרגיות',patient.allergies]
                  ].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l as string} style={{display:'flex',gap:'8px',fontSize:'13px'}}>
                      <span style={{color:'#94a3b8',minWidth:'80px',flexShrink:0}}>{l}</span>
                      <span style={{fontWeight:'500',color:'#1e293b'}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {editing && (
              <div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end',gap:'8px'}}>
                <button onClick={()=>setEditing(false)} style={{padding:'9px 16px',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#fff',fontSize:'13px',cursor:'pointer',fontFamily:'Heebo, sans-serif'}}>ביטול</button>
                <button onClick={save} disabled={saving} style={{padding:'9px 20px',background:'#1a3a5c',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'Heebo, sans-serif'}}>{saving?'⏳ שומר...':'💾 שמור'}</button>
              </div>
            )}
          </div>
        )}

        {/* INTAKE */}
        {tab === 'intake' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#1a3a5c' }}>ראיון קבלה</div>
              <button onClick={saveIntake} disabled={intakeSaving} style={{ padding:'9px 20px', background:intakeSaving?'#94a3b8':'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                {intakeSaving?'⏳ שומר...':'💾 שמור ראיון'}
              </button>
            </div>

            <div style={card}>
              <h3 style={{fontWeight:'700',marginBottom:'14px',fontSize:'13px',color:'#1a3a5c',borderBottom:'1px solid #f1f5f9',paddingBottom:'8px'}}>📋 רקע ואבחנות</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div><label style={lbl}>רקע</label><textarea style={ta} value={intake.background||''} onChange={e=>setI('background',e.target.value)} placeholder="רקע רפואי, היסטוריה..."/></div>
                <div><label style={lbl}>אבחנה רופא</label><input style={inp} value={intake.doctor_diagnosis||''} onChange={e=>setI('doctor_diagnosis',e.target.value)}/></div>
                <div><label style={lbl}>אבחנה פיזיותרפיסט</label><input style={inp} value={intake.pt_diagnosis||''} onChange={e=>setI('pt_diagnosis',e.target.value)}/></div>
                <div><label style={lbl}>בעיות תפקודיות</label><textarea style={ta} value={intake.functional_problems||''} onChange={e=>setI('functional_problems',e.target.value)}/></div>
                <div><label style={lbl}>תפקוד ADL</label><textarea style={ta} value={intake.adl||''} onChange={e=>setI('adl',e.target.value)}/></div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{fontWeight:'700',marginBottom:'14px',fontSize:'13px',color:'#1a3a5c',borderBottom:'1px solid #f1f5f9',paddingBottom:'8px'}}>🔍 בדיקה</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div><label style={lbl}>כוח</label><textarea style={{...ta,minHeight:'60px'}} value={intake.exam_strength||''} onChange={e=>setI('exam_strength',e.target.value)}/></div>
                <div><label style={lbl}>טווחים (ROM)</label><textarea style={{...ta,minHeight:'60px'}} value={intake.exam_rom||''} onChange={e=>setI('exam_rom',e.target.value)}/></div>
                <div><label style={lbl}>טונוס</label><textarea style={{...ta,minHeight:'60px'}} value={intake.exam_tonus||''} onChange={e=>setI('exam_tonus',e.target.value)}/></div>
                <div><label style={lbl}>תחושה</label><textarea style={{...ta,minHeight:'60px'}} value={intake.exam_sensation||''} onChange={e=>setI('exam_sensation',e.target.value)}/></div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{fontWeight:'700',marginBottom:'14px',fontSize:'13px',color:'#1a3a5c',borderBottom:'1px solid #f1f5f9',paddingBottom:'8px'}}>🎯 מטרות ותוכנית</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div><label style={lbl}>מטרות הטיפול</label><textarea style={{...ta,minHeight:'100px'}} value={intake.goals||''} onChange={e=>setI('goals',e.target.value)}/></div>
                <div><label style={lbl}>תוכנית טיפול</label><textarea style={{...ta,minHeight:'100px'}} value={intake.treatment_plan||''} onChange={e=>setI('treatment_plan',e.target.value)}/></div>
              </div>
            </div>

            <div style={card}>
              <h3 style={{fontWeight:'700',marginBottom:'14px',fontSize:'13px',color:'#1a3a5c',borderBottom:'1px solid #f1f5f9',paddingBottom:'8px'}}>✅ אישורים</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {[
                  { key:'exercise_explained', label:'הוסברה חשיבות תרגול עצמי' },
                  { key:'no_ci', label:'אין CI' },
                  { key:'no_red_flags', label:'שולל דגלים אדומים' },
                  { key:'no_violence', label:'שולל אלימות' },
                  { key:'patient_consent', label:'המטופל נתן הסכמתו להצבת המטרות' },
                ].map(item => (
                  <label key={item.key} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',fontSize:'13px',fontWeight:'500'}}>
                    <input type="checkbox" checked={!!intake[item.key]} onChange={e=>setI(item.key,e.target.checked)}
                      style={{width:'18px',height:'18px',cursor:'pointer'}}/>
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',paddingBottom:'20px'}}>
              <button onClick={saveIntake} disabled={intakeSaving} style={{padding:'10px 28px',background:intakeSaving?'#94a3b8':'#1a3a5c',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'Heebo, sans-serif'}}>
                {intakeSaving?'⏳ שומר...':'💾 שמור ראיון קבלה'}
              </button>
            </div>
          </div>
        )}

        {/* GOALS */}
        {tab === 'goals' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#1a3a5c' }}>מטרות טיפול SMART</div>
              <button onClick={() => setShowGoalForm(true)} style={{ padding:'8px 16px', background:'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                + מטרה חדשה
              </button>
            </div>

            {showGoalForm && (
              <div style={{ background:'#fff', borderRadius:'12px', padding:'18px', marginBottom:'14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'2px solid #3eb8e5' }}>
                <div style={{ fontWeight:'700', fontSize:'13px', color:'#1a3a5c', marginBottom:'14px' }}>🎯 מטרה חדשה</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div>
                    <label style={lbl}>פעולה — מה המטופל יעשה</label>
                    <input style={inp} value={goalForm.action} onChange={e=>setG('action',e.target.value)} placeholder="ילך, ירוץ, יעלה מדרגות, ירים משקל..." />
                  </div>
                  <div>
                    <label style={lbl}>מדד — כמה / כמה זמן</label>
                    <input style={inp} value={goalForm.measure} onChange={e=>setG('measure',e.target.value)} placeholder="10 דקות, 500 מטר, 15 קילו, 90 מעלות..." />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div>
                      <label style={lbl}>רמת קושי</label>
                      <select style={inp} value={goalForm.difficulty} onChange={e=>setG('difficulty',e.target.value)}>
                        <option>ללא קושי</option>
                        <option>עם קושי קל</option>
                        <option>באופן עצמאי</option>
                        <option>עם עזר חיצוני</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>תאריך יעד</label>
                      <input type="date" style={inp} value={goalForm.target_date} onChange={e=>setG('target_date',e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>הערות</label>
                    <input style={inp} value={goalForm.notes} onChange={e=>setG('notes',e.target.value)} placeholder="הקשר קליני, רלוונטיות תפקודית..." />
                  </div>
                  <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                    <button onClick={() => setShowGoalForm(false)} style={{ padding:'9px 16px', border:'1px solid #e2e8f0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>ביטול</button>
                    <button onClick={saveGoal} disabled={goalSaving} style={{ flex:1, padding:'9px', background:goalSaving?'#94a3b8':'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                      {goalSaving ? '⏳ שומר...' : '💾 שמור מטרה'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {goals.length === 0 && !showGoalForm ? (
              <div style={{ background:'#fff', borderRadius:'12px', padding:'40px', textAlign:'center', color:'#94a3b8', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>🎯</div>
                <div>אין מטרות טיפול עדיין</div>
                <button onClick={() => setShowGoalForm(true)} style={{ marginTop:'12px', padding:'8px 16px', background:'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                  הגדר מטרה ראשונה
                </button>
              </div>
            ) : goals.map(g => {
              const updates = goalUpdates[g.id] || []
              const statusColors: Record<string,{bg:string;color:string}> = {
                'בתהליך':  { bg:'#fef3c7', color:'#92400e' },
                'הושג':    { bg:'#d1fae5', color:'#065f46' },
                'עודכן':   { bg:'#dbeafe', color:'#1e40af' },
                'לא הושג': { bg:'#fee2e2', color:'#991b1b' },
              }
              const sc = statusColors[g.status] || { bg:'#f1f5f9', color:'#475569' }
              return (
                <div key={g.id} style={{ background:'#fff', borderRadius:'12px', padding:'16px', marginBottom:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderRight: g.status === 'הושג' ? '4px solid #10b981' : '4px solid #3eb8e5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'800', fontSize:'15px', color:'#1a3a5c' }}>
                        {g.status === 'הושג' ? '✅ ' : '🎯 '}
                        {g.action} — {g.measure}
                      </div>
                      <div style={{ fontSize:'12px', color:'#64748b', marginTop:'3px' }}>
                        {g.difficulty}
                        {g.target_date && ` · יעד: ${new Date(g.target_date).toLocaleDateString('he-IL')}`}
                      </div>
                      {g.notes && <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>{g.notes}</div>}
                    </div>
                    <select value={g.status} onChange={e => updateGoalStatus(g.id, e.target.value)} style={{
                      padding:'4px 8px', border:`1px solid ${sc.color}30`, borderRadius:'20px',
                      fontSize:'11px', fontWeight:'700', cursor:'pointer',
                      background: sc.bg, color: sc.color, fontFamily:'Heebo, sans-serif', outline:'none', marginRight:'8px'
                    }}>
                      <option>בתהליך</option>
                      <option>הושג</option>
                      <option>עודכן</option>
                      <option>לא הושג</option>
                    </select>
                  </div>

                  {updates.length > 0 && (
                    <div style={{ marginBottom:'10px', padding:'10px', background:'#f8fafc', borderRadius:'8px' }}>
                      <div style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', marginBottom:'6px', textTransform:'uppercase' }}>היסטוריית עדכונים</div>
                      {updates.map((u,i) => (
                        <div key={u.id} style={{ display:'flex', gap:'8px', fontSize:'12px', marginBottom: i < updates.length-1 ? '6px' : '0' }}>
                          <span style={{ color:'#94a3b8', flexShrink:0 }}>{new Date(u.date).toLocaleDateString('he-IL')}</span>
                          <span style={{ color:'#374151' }}>{u.note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {g.status !== 'הושג' && (
                    <div style={{ display:'flex', gap:'8px' }}>
                      <input
                        value={updateText[g.id] || ''}
                        onChange={e => setUpdateText(p => ({ ...p, [g.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addGoalUpdate(g.id)}
                        placeholder="הוסף עדכון התקדמות..."
                        style={{ ...inp, fontSize:'12px', flex:1 }}
                      />
                      <button onClick={() => addGoalUpdate(g.id)} style={{
                        padding:'7px 14px', background:'#3eb8e5', color:'#fff', border:'none',
                        borderRadius:'7px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif'
                      }}>
                        + עדכן
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* APPOINTMENTS */}
        {tab === 'appointments' && (
          <div style={{background:'#fff',borderRadius:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:'700',fontSize:'14px'}}>היסטוריית תורים</div>
              <Link href={`/calendar/new?patient=${id}`} style={{padding:'6px 12px',background:'#3eb8e5',color:'#fff',borderRadius:'6px',fontSize:'12px',fontWeight:'600'}}>+ תור חדש</Link>
            </div>
            {appointments.length===0?(
              <div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>אין תורים</div>
            ):appointments.map((a,i)=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 18px',borderBottom:i<appointments.length-1?'1px solid #f8fafc':'none'}}>
                <div style={{fontWeight:'600',fontSize:'13px',minWidth:'90px',color:'#1a3a5c'}}>{new Date(a.date).toLocaleDateString('he-IL')}</div>
                <div style={{fontSize:'13px',color:'#64748b',minWidth:'50px'}}>{a.time?.slice(0,5)}</div>
                <div style={{flex:1,fontSize:'13px'}}>{a.service?.icon} {a.service?.name_he}</div>
                {a.price&&<div style={{fontSize:'13px',fontWeight:'600',color:'#0b8a5e'}}>₪{a.price}</div>}
                <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:APPOINTMENT_STATUS[a.status]?.bg||'#f1f5f9',color:APPOINTMENT_STATUS[a.status]?.color||'#475569'}}>{APPOINTMENT_STATUS[a.status]?.label||a.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* SOAP */}
        {tab === 'records' && (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <Link href={`/records/new?patient=${id}`} style={{padding:'8px 14px',background:'#7c3aed',color:'#fff',borderRadius:'8px',fontSize:'12px',fontWeight:'700'}}>+ רשומת SOAP חדשה</Link>
            </div>
            {records.length===0?(
              <div style={{background:'#fff',borderRadius:'12px',padding:'40px',textAlign:'center',color:'#94a3b8'}}>אין רשומות SOAP</div>
            ):records.map(r=>(
              <div key={r.id} style={{background:'#fff',borderRadius:'10px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{new Date(r.created_at).toLocaleDateString('he-IL')}</div>
                  {r.vas_score!=null&&<span style={{padding:'2px 10px',background:r.vas_score>6?'#fee2e2':r.vas_score>3?'#fef3c7':'#d1fae5',borderRadius:'20px',fontSize:'11px',fontWeight:'700',color:r.vas_score>6?'#991b1b':r.vas_score>3?'#92400e':'#065f46'}}>VAS {r.vas_score}/10</span>}
                </div>
                {[['S',r.subjective,'#3b82f6'],['O',r.objective,'#8b5cf6'],['A',r.assessment,'#f59e0b'],['P',r.plan,'#10b981']].filter(([,v])=>v).map(([l,v,c])=>(
                  <div key={l as string} style={{display:'flex',gap:'10px',marginBottom:'8px',fontSize:'13px'}}>
                    <span style={{width:'22px',height:'22px',background:c as string,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',color:'#fff',flexShrink:0}}>{l}</span>
                    <span style={{color:'#374151',lineHeight:'1.5'}}>{v as string}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* BILLING */}
        {tab === 'billing' && (
          <div style={{background:'#fff',borderRadius:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',overflow:'hidden'}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:'700',fontSize:'14px'}}>חיובים</div>
                <div style={{fontSize:'11px',color:'#0b8a5e',marginTop:'2px'}}>סה"כ שולם: ₪{totalPaid.toLocaleString()}</div>
              </div>
              <Link href={`/billing/new?patient=${id}`} style={{padding:'6px 12px',background:'#0b8a5e',color:'#fff',borderRadius:'6px',fontSize:'12px',fontWeight:'600'}}>+ חיוב חדש</Link>
            </div>
            {billing.length===0?(
              <div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>אין חיובים</div>
            ):billing.map((b,i)=>(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 18px',borderBottom:i<billing.length-1?'1px solid #f8fafc':'none'}}>
                <div style={{fontWeight:'600',fontSize:'13px',minWidth:'90px'}}>{new Date(b.created_at).toLocaleDateString('he-IL')}</div>
                <div style={{flex:1,fontSize:'13px',color:'#64748b'}}>{b.description||'טיפול'}</div>
                <div style={{fontSize:'14px',fontWeight:'700',color:'#1a3a5c'}}>₪{(b.amount||0).toLocaleString()}</div>
                <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:b.status==='paid'?'#d1fae5':b.status==='pending'?'#fef3c7':'#fee2e2',color:b.status==='paid'?'#065f46':b.status==='pending'?'#92400e':'#991b1b'}}>{b.status==='paid'?'שולם':b.status==='pending'?'ממתין':'בוטל'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

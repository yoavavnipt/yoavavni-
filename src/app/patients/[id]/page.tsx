'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, HMO_OPTIONS, APPOINTMENT_STATUS } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  // Default physio
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
  const price = getServicePrice(service, patient.city || '')
  return `שלום ${name},\n\nתזכורת לתשלום עבור ${service}.\nסכום לתשלום: ₪${price}\n\nניתן לשלם:\n💵 מזומן בקליניקה\n💳 אשראי בקליניקה\n📱 ביט / פייבוקס: 054-5953889\n\nתודה! 🙏\nקליניקת יואב אבני`
}

function openWA(phone: string, msg: string) {
  window.open(`https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(msg)}`, '_blank')
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
  const [tab, setTab] = useState<'overview'|'intake'|'appointments'|'records'|'billing'>('overview')
  const [intake, setIntake] = useState<any>({})
  const [intakeSaving, setIntakeSaving] = useState(false)

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    const [{ data: p }, { data: a }, { data: r }, { data: b }] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments').select('*, service:service_types(name_he,icon,color)').eq('patient_id', id).order('date', { ascending: false }).limit(20),
      supabase.from('treatment_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('billing_records').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(20),
    ])
    setPatient(p); setForm(p || {})
    setAppointments(a || []); setRecords(r || []); setBilling(b || [])
    // Load intake from patient data
    if (p?.intake_data) { try { setIntake(JSON.parse(p.intake_data)) } catch {} }
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

  const totalPaid = billing.filter(b => b.status === 'paid').reduce((s, b) => s + (b.amount || 0), 0)

  if (loading) return <AppLayout><div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#94a3b8' }}>טוען...</div></AppLayout>
  if (!patient) return <AppLayout><div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>מטופל לא נמצא</div></AppLayout>

  const tabs = [
    { key: 'overview',     label: 'סקירה כללית' },
    { key: 'intake',       label: '📋 ראיון קבלה' },
    { key: 'appointments', label: `תורים (${appointments.length})` },
    { key: 'records',      label: `SOAP (${records.length})` },
    { key: 'billing',      label: `חיוב (${billing.length})` },
  ]

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
                {patient.hmo && <span>{patient.hmo}</span>}
                {patient.diagnosis && <span style={{ color:'#7c3aed' }}>• {patient.diagnosis}</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {patient.phone && (() => {
              const today = new Date().toISOString().split('T')[0]
              const nextAppt = appointments.find(a => a.date >= today && a.status !== 'cancelled')
              const lastAppt = appointments.find(a => a.date <= today && a.status === 'completed')
              const isFirstTime = appointments.filter(a => a.status === 'completed').length === 0
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
                </>
              )
            })()}
            <Link href={`/records/new?patient=${id}`} style={{ padding:'8px 14px', background:'#7c3aed', color:'#fff', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>+ SOAP</Link>
            <Link href={`/calendar/new?patient=${id}`} style={{ padding:'8px 14px', background:'#3eb8e5', color:'#fff', borderRadius:'8px', fontSize:'12px', fontWeight:'700' }}>+ תור</Link>
            <button onClick={() => setEditing(!editing)} style={{ padding:'8px 14px', background:editing?'#e2e8f0':'#1a3a5c', color:editing?'#475569':'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
              {editing ? 'ביטול' : '✏️ עריכה'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
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
                  <div><label style={lbl}>קופ"ח</label><select style={inp} value={form.hmo||''} onChange={e=>set('hmo',e.target.value)}><option value="">בחר...</option>{HMO_OPTIONS.map(h=><option key={h}>{h}</option>)}</select></div>
                  <div><label style={lbl}>ביטוח</label><input style={inp} value={form.insurance||''} onChange={e=>set('insurance',e.target.value)}/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={lbl}>אבחנה</label><input style={inp} value={form.diagnosis||''} onChange={e=>set('diagnosis',e.target.value)}/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={lbl}>רקע רפואי</label><textarea style={ta} value={form.medical_history||''} onChange={e=>set('medical_history',e.target.value)}/></div>
                  <div><label style={lbl}>תרופות</label><input style={inp} value={form.medications||''} onChange={e=>set('medications',e.target.value)}/></div>
                  <div><label style={lbl}>אלרגיות</label><input style={inp} value={form.allergies||''} onChange={e=>set('allergies',e.target.value)}/></div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[['קופ"ח',patient.hmo],['ביטוח',patient.insurance],['אבחנה',patient.diagnosis],['רקע רפואי',patient.medical_history],['תרופות',patient.medications],['אלרגיות',patient.allergies]].filter(([,v])=>v).map(([l,v])=>(
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

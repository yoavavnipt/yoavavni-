'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

const FOOTER = `\n\nבברכה,\nקליניקת יואב אבני 🏥\n📍 רחוב התרשיש 8, גילון\n🌐 https://www.yoav-avni-clinic.com\n📸 https://www.instagram.com/yoavavni.pt`

const T = [
  { id:'physio_local', l:'ברוך הבא — פיזיו גילון/צורית', i:'👋', c:'#1e4a7a', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול פיזיותרפיה בתאריך ${d} בשעה ${t}\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 330 ₪ לטיפול לתושבי גילון וצורית.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${FOOTER}`},
  { id:'physio', l:'ברוך הבא — פיזיו (רגיל)', i:'🦴', c:'#1e4a7a', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול פיזיותרפיה בתאריך ${d} בשעה ${t}\nטיפול פיזיותרפיה אורך 45-50 דקות.\nעלות 350 ₪ לטיפול.\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.\nנא להגיע עם בגדים נוחים.${FOOTER}`},
  { id:'hydro', l:'ברוך הבא — הידרותרפיה', i:'💧', c:'#0891b2', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול הידרותרפיה בתאריך ${d} בשעה ${t}\nטיפול הידרותרפיה אורך 60 דקות.\nעלות 420 ₪ לטיפול.\n\nנא להביא:\n🩱 בגד ים\n🏊 כובע ים (חובה)\n🧴 מגבת\n\nנא להביא מכתב רופא או כל אינפורמציה רפואית רלוונטית.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`},
  { id:'home', l:'ברוך הבא — ביקור בית', i:'🏠', c:'#0b8a5e', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו ביקור בית בתאריך ${d} בשעה ${t}\nהטיפול אורך כ-60 דקות.\nעלות 550 ₪ לטיפול.\n\nאנא הכינו מקום נוח ומרווח לטיפול.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`},
  { id:'sport', l:'ברוך הבא — שיקום ספורטיבי', i:'⚽', c:'#c2410c', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו טיפול שיקום ספורטיבי בתאריך ${d} בשעה ${t}\nהטיפול אורך 45 דקות.\nעלות 380 ₪ לטיפול.\n\nנא להגיע עם בגדים ספורטיביים נוחים.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`},
  { id:'online', l:'ברוך הבא — ייעוץ אונליין', i:'💻', c:'#065f46', f:(p:any,d:string,t:string)=>`בוקר טוב ${p.first_name} ${p.last_name} 😊\n\nקבענו ייעוץ אונליין בתאריך ${d} בשעה ${t}\nהייעוץ אורך כ-30 דקות.\nעלות 280 ₪.\n\nהפגישה תתקיים בוידאו — אשלח לך קישור לפני הפגישה.\nביטול או שינוי יתבצע עד יום לפני ב-10:00 — מעבר לכך ידרש חיוב מלא.${FOOTER}`},
  { id:'reminder', l:'תזכורת לתור', i:'⏰', c:'#7c3aed', f:(p:any,d:string,t:string)=>`שלום ${p.first_name} ${p.last_name} 😊\n\nתזכורת — יש לך תור מחר ${d} בשעה ${t}.\n\n📍 רחוב התרשיש 8, גילון\nלשינוי או ביטול — עד הערב ב-10:00.\n\nמחכים לך! 🙏\nקליניקת יואב אבני`},
  { id:'payment', l:'בקשת תשלום', i:'💳', c:'#0b8a5e', f:(p:any,_d:string,_t:string,a?:string)=>{
    const links: Record<string,string> = {
      '330': 'https://www.yoav-avni-clinic.com/_paylink/AZtZIkT9',
      '360': 'https://www.yoav-avni-clinic.com/_paylink/AZvCL5XV',
      '340': 'https://www.yoav-avni-clinic.com/_paylink/AZa0Pm4K',
      '400': 'https://www.yoav-avni-clinic.com/_paylink/AZZsK6kw',
      '1500': 'https://www.yoav-avni-clinic.com/_paylink/AZx5lGoD',
      '650': 'https://www.yoav-avni-clinic.com/_paylink/AZ4TL4Bx',
      '1000': 'https://www.yoav-avni-clinic.com/_paylink/AZ4TMBia',
    }
    const link = a ? (links[a] || '') : ''
    return `שלום ${p.first_name} ${p.last_name},\n\nבקשת תשלום עבור טיפול.\nסכום לתשלום: ₪${a||'___'}${link ? `\n\n💳 לתשלום באשראי:\n${link}` : ''}\n\nאו:\n💵 מזומן בקליניקה\n📱 ביט / פייבוקס: 054-5953889\n\nתודה! 🙏\nקליניקת יואב אבני`
  }},
  { id:'exercises', l:'תרגילי בית', i:'🏋️', c:'#854d0e', f:(p:any)=>`שלום ${p.first_name} ${p.last_name} 😊\n\nמצורפים תרגילי הבית שלך לביצוע עד הטיפול הבא.\nחשוב לבצע אותם כפי שהסברתי — כל יום או יומיים! 💪\n\nלשאלות — אני כאן.\nקליניקת יואב אבני`},
  { id:'book_again', l:'תזכורת לתור נוסף', i:'📅', c:'#3eb8e5', f:(p:any)=>`שלום ${p.first_name} ${p.last_name} 😊\n\nרציתי להזכיר — חשוב לשמור על רצף הטיפולים להחלמה מיטבית!\n\nלקביעת תור נוסף:\n📞 054-5953889\n🌐 https://www.yoav-avni-clinic.com\n\nנשמח לראותך בקרוב! 💪\nקליניקת יואב אבני`},
]

export default function WAWrapper() {
  return <Suspense fallback={<AppLayout><div style={{padding:'40px',textAlign:'center',color:'#94a3b8'}}>טוען...</div></AppLayout>}><WAPage /></Suspense>
}

function WAPage() {
  const sp = useSearchParams()
  const pid = sp.get('patient')
  const [patients, setPatients] = useState<any[]>([])
  const [patient, setPatient] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState<string|null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(()=>{
    supabase.from('patients').select('id,first_name,last_name,phone,city').eq('status','active').order('first_name').then(({data})=>{
      setPatients(data||[])
      if(pid&&data){const p=(data as any[]).find(x=>x.id===pid);if(p)setPatient(p)}
    })
  },[pid])

  function build(id:string,p:any,d:string,t:string,a:string){
    const tmpl=T.find(x=>x.id===id)
    return tmpl&&p?tmpl.f(p,d||'___',t||'___',a):''
  }

  function pick(id:string){setSel(id);setSent(false);setMsg(build(id,patient,date,time,amount))}
  function send(){
    if(!patient?.phone||!msg)return
    window.open(`https://wa.me/972${patient.phone.replace(/^0/,'').replace(/-/g,'')}?text=${encodeURIComponent(msg)}`,'_blank')
    setSent(true)
  }

  const filtered=patients.filter(p=>`${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase()))
  const inp={width:'100%',padding:'8px 10px',border:'1px solid #e2e8f0',borderRadius:'7px',fontSize:'13px',fontFamily:'Heebo, sans-serif',outline:'none'} as const

  return (
    <AppLayout>
      <div style={{padding:'20px 24px',maxWidth:'640px'}} className="fade-in">
        <h1 style={{fontSize:'22px',fontWeight:'800',color:'#1a3a5c',marginBottom:'20px'}}>💬 הודעות WhatsApp</h1>

        {/* Step 1 */}
        <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c',marginBottom:'12px'}}>שלב 1 — בחר מטופל</div>
          {patient?(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#f0f9ff',borderRadius:'8px',border:'1px solid #bae6fd'}}>
              <div>
                <div style={{fontWeight:'700',fontSize:'13px'}}>{patient.first_name} {patient.last_name}</div>
                <div style={{fontSize:'11px',color:'#64748b',marginTop:'1px'}}>{patient.phone}{patient.city?` · ${patient.city}`:''}</div>
              </div>
              <button onClick={()=>{setPatient(null);setSel(null);setMsg('');setSent(false)}} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:'20px'}}>×</button>
            </div>
          ):(
            <div>
              <input placeholder="🔍 חפש שם או טלפון..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{...inp,marginBottom:'8px'}} />
              {search&&(
                <div style={{border:'1px solid #e2e8f0',borderRadius:'8px',overflow:'hidden',maxHeight:'200px',overflowY:'auto'}}>
                  {filtered.slice(0,8).map(p=>(
                    <div key={p.id} onClick={()=>{setPatient(p);setSearch('');setSel(null);setMsg('')}}
                      style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f8fafc',fontSize:'13px'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='#f0f9ff')}
                      onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                      <span style={{fontWeight:'600'}}>{p.first_name} {p.last_name}</span>
                      <span style={{color:'#94a3b8',marginRight:'8px',fontSize:'11px'}}>{p.phone}</span>
                    </div>
                  ))}
                  {filtered.length===0&&<div style={{padding:'16px',textAlign:'center',color:'#94a3b8',fontSize:'12px'}}>לא נמצאו מטופלים</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2 */}
        {patient&&(
          <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c',marginBottom:'12px'}}>שלב 2 — בחר תבנית</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {T.map(t=>(
                <button key={t.id} onClick={()=>pick(t.id)} style={{
                  padding:'11px 12px',border:`2px solid ${sel===t.id?t.c:'#e2e8f0'}`,borderRadius:'8px',
                  background:sel===t.id?`${t.c}12`:'#fff',cursor:'pointer',textAlign:'right',
                  fontFamily:'Heebo, sans-serif',fontSize:'12px',fontWeight:sel===t.id?'700':'400',
                  color:sel===t.id?t.c:'#374151',transition:'all 0.12s',
                }}>
                  {t.i} {t.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {sel&&patient&&(
          <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c',marginBottom:'12px'}}>שלב 3 — פרטים (אופציונלי)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div>
                <label style={{display:'block',fontSize:'11px',fontWeight:'700',color:'#64748b',marginBottom:'4px'}}>תאריך</label>
                <input type="date" value={date} onChange={e=>{setDate(e.target.value);setMsg(build(sel,patient,e.target.value,time,amount))}} style={inp}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'11px',fontWeight:'700',color:'#64748b',marginBottom:'4px'}}>שעה</label>
                <input type="time" value={time} onChange={e=>{setTime(e.target.value);setMsg(build(sel,patient,date,e.target.value,amount))}} style={inp}/>
              </div>
              {sel==='payment'&&(
                <div>
                  <label style={{display:'block',fontSize:'11px',fontWeight:'700',color:'#64748b',marginBottom:'4px'}}>סכום ₪</label>
                  <input type="number" value={amount} placeholder="350" onChange={e=>{setAmount(e.target.value);setMsg(build(sel,patient,date,time,e.target.value))}} style={inp}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {msg&&(
          <div style={{background:'#fff',borderRadius:'12px',padding:'18px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'#1a3a5c',marginBottom:'10px'}}>שלב 4 — תצוגה מקדימה (ניתן לערוך)</div>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} style={{
              width:'100%',minHeight:'240px',padding:'12px',border:'1px solid #e2e8f0',borderRadius:'8px',
              fontSize:'13px',lineHeight:'1.7',resize:'vertical',fontFamily:'Heebo, sans-serif',
              outline:'none',background:'#f8fffe',direction:'rtl',
            }}/>
            <button onClick={send} style={{
              width:'100%',marginTop:'12px',padding:'14px',
              background:sent?'#0b8a5e':'#25d366',color:'#fff',border:'none',borderRadius:'10px',
              fontSize:'16px',fontWeight:'800',cursor:'pointer',fontFamily:'Heebo, sans-serif',
              boxShadow:'0 4px 12px rgba(37,211,102,0.3)',
            }}>
              {sent?'✅ נשלח! שלח שוב':'📤 שלח ב-WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

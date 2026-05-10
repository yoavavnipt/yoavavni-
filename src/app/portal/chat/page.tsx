'use client'
import { useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const TOPICS = [
  { id: 'back', label: 'כאב גב', icon: '🔙' },
  { id: 'neck', label: 'כאב צוואר', icon: '🦒' },
  { id: 'shoulder', label: 'כאב כתף', icon: '💪' },
  { id: 'knee', label: 'כאב ברך', icon: '🦵' },
  { id: 'sport', label: 'פציעת ספורט', icon: '⚽' },
  { id: 'hydro', label: 'פיזיותרפיה במים', icon: '💧' },
  { id: 'run', label: 'קבוצת ריצה', icon: '🏃' },
  { id: 'other', label: 'אחר', icon: '💬' },
]

const HOW = [
  'המלצה של חבר/משפחה',
  'אינסטגרם / רשתות חברתיות',
  'גוגל',
  'רופא / מומחה',
  'אחר',
]

type Step = 'welcome' | 'name' | 'phone' | 'topic' | 'problem' | 'how' | 'done'

interface Message {
  from: 'bot' | 'user'
  text: string
}

export default function ChatbotPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: `שלום! 👋 אני הבוט של ${CLINIC.name}.\n\nאשמח לעזור לך לתאם טיפול. זה ייקח רק דקה!` },
    { from: 'bot', text: 'מה שמך הפרטי?' },
  ])
  const [input, setInput] = useState('')
  const [data, setData] = useState({ firstName: '', lastName: '', phone: '', topic: '', problem: '', how: '' })
  const [saving, setSaving] = useState(false)

  function addBot(text: string) {
    setMessages(p => [...p, { from: 'bot', text }])
  }

  function addUser(text: string) {
    setMessages(p => [...p, { from: 'user', text }])
  }

  function handleSend() {
    if (!input.trim()) return
    const val = input.trim()
    setInput('')

    if (step === 'name') {
      addUser(val)
      const parts = val.split(' ')
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ')
      setData(p => ({ ...p, firstName, lastName }))
      setTimeout(() => {
        addBot(`נעים מאוד ${firstName}! 😊`)
        addBot('מה מספר הטלפון שלך?')
        setStep('phone')
      }, 400)
    }

    else if (step === 'phone') {
      const phone = val.replace(/\D/g, '')
      if (phone.length < 9) {
        addUser(val)
        setTimeout(() => addBot('מספר הטלפון לא נראה תקין. נסה שוב:'), 300)
        return
      }
      addUser(val)
      setData(p => ({ ...p, phone: val }))
      setTimeout(() => {
        addBot('מעולה! 💪\n\nבאיזה נושא אתה מעוניין?')
        setStep('topic')
      }, 400)
    }

    else if (step === 'problem') {
      addUser(val)
      setData(p => ({ ...p, problem: val }))
      setTimeout(() => {
        addBot('תודה! שאלה אחרונה — איך שמעת עלינו?')
        setStep('how')
      }, 400)
    }
  }

  function selectTopic(topic: typeof TOPICS[0]) {
    addUser(`${topic.icon} ${topic.label}`)
    setData(p => ({ ...p, topic: topic.label }))
    setTimeout(() => {
      addBot(`מעולה, ${topic.label}.\n\nתאר בקצרה את הבעיה שלך (מתי התחיל, כמה כואב, וכו'):`)
      setStep('problem')
    }, 400)
  }

  function selectHow(how: string) {
    addUser(how)
    setData(p => ({ ...p, how }))
    setTimeout(() => submit({ ...data, how }), 400)
  }

  async function submit(finalData: typeof data) {
    setSaving(true)
    addBot('מעולה! 🙏 רושם אותך במערכת...')

    // Create patient in DB
    const { error } = await supabase.from('patients').insert([{
      first_name: finalData.firstName,
      last_name: finalData.lastName || '',
      phone: finalData.phone,
      diagnosis: finalData.topic,
      notes: `בעיה: ${finalData.problem}\nאיך הגיע: ${finalData.how}`,
      status: 'lead',
    }])

    // Send WhatsApp notification to clinic
    const waMsg = encodeURIComponent(
      `🔔 ליד חדש מהפורטל!\n\n` +
      `שם: ${finalData.firstName} ${finalData.lastName}\n` +
      `טלפון: ${finalData.phone}\n` +
      `נושא: ${finalData.topic}\n` +
      `בעיה: ${finalData.problem}\n` +
      `הגיע מ: ${finalData.how}\n\n` +
      `לחץ לפתוח WhatsApp: https://wa.me/972${finalData.phone.replace(/^0/,'').replace(/-/g,'')}`
    )

    setTimeout(() => {
      window.open(`https://wa.me/972545953889?text=${waMsg}`, '_blank')
    }, 1000)

    setSaving(false)
    setStep('done')
    setTimeout(() => {
      addBot(`✅ נרשמת בהצלחה!\n\nצוות הקליניקה יחזור אליך בהקדם לתיאום תור.\n\nנתראה! 😊`)
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#f0f4f8', fontFamily: 'Heebo, sans-serif', direction: 'rtl',
    }}>
      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: '#3eb8e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>בוט קליניקת יואב אבני</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>🟢 מחובר · עונה מיד</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-start' : 'flex-end' }}>
            <div style={{
              maxWidth: '75%', padding: '10px 14px', borderRadius: m.from === 'user' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
              background: m.from === 'user' ? '#1a3a5c' : '#fff',
              color: m.from === 'user' ? '#fff' : '#1e293b',
              fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Topic buttons */}
        {step === 'topic' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => selectTopic(t)} style={{
                padding: '12px', background: '#fff', border: '2px solid #e2e8f0',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                fontSize: '13px', fontWeight: '600', color: '#1e293b',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3eb8e5'; e.currentTarget.style.background = '#f0f9ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}>
                <span style={{ fontSize: '18px' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* How buttons */}
        {step === 'how' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {HOW.map(h => (
              <button key={h} onClick={() => selectHow(h)} style={{
                padding: '11px 16px', background: '#fff', border: '2px solid #e2e8f0',
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                fontSize: '13px', fontWeight: '600', color: '#1e293b', textAlign: 'right',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3eb8e5'; e.currentTarget.style.background = '#f0f9ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}>
                {h}
              </button>
            ))}
          </div>
        )}

        {/* Done - back to portal */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <a href="/portal" style={{
              display: 'inline-block', padding: '12px 24px', background: '#1a3a5c',
              color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none'
            }}>
              חזור לפורטל →
            </a>
          </div>
        )}
      </div>

      {/* Input */}
      {(step === 'name' || step === 'phone' || step === 'problem') && (
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={step === 'name' ? 'שם מלא...' : step === 'phone' ? '050-0000000' : 'תאר את הבעיה...'}
            style={{
              flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: '10px', fontSize: '14px', outline: 'none',
              fontFamily: 'Heebo, sans-serif',
            }}
          />
          <button onClick={handleSend} style={{
            padding: '10px 16px', background: '#3eb8e5', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '16px',
            cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
          }}>
            ←
          </button>
        </div>
      )}

      {/* Welcome start button */}
      {step === 'welcome' && (
        <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setStep('name')} style={{
            width: '100%', padding: '13px', background: '#3eb8e5', color: '#fff',
            border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800',
            cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
          }}>
            בואו נתחיל! 💪
          </button>
        </div>
      )}
    </div>
  )
}

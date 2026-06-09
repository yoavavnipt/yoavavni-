'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; content: string }

const PAGE_CONTEXTS: Record<string, { title: string; system: string; tip: string }> = {
  '/dashboard': {
    title: 'ראשי',
    system: 'אתה עוזר AI לקליניקת פיזיותרפיה של יואב אבני בגילון. אתה עוזר במשימות ניהוליות, מעקב אחר מטופלים, חיובים ותורים. ענה בעברית קצר וממוקד.',
    tip: 'טיפ: לחץ על KPI כלשהו בדשבורד לצפייה בפירוט המלא'
  },
  '/patients': {
    title: 'מטופלים',
    system: 'אתה עוזר AI לניהול מטופלים בקליניקת פיזיותרפיה. עזור בחיפוש, סינון, ניהול רשימות ומעקב אחר מטופלים. ענה בעברית.',
    tip: 'טיפ: ניתן לסנן מטופלים לפי סטטוס, גורם מממן ותאריך'
  },
  '/calendar': {
    title: 'יומן',
    system: 'אתה עוזר AI לניהול יומן תורים. עזור בתזמון, תזכורות, ניהול ביטולים ואופטימיזציה של לוח הזמנים. ענה בעברית.',
    tip: 'טיפ: ניתן לשלוח תזכורת WhatsApp ישירות מהתור'
  },
  '/billing': {
    title: 'חיוב',
    system: 'אתה עוזר AI לניהול חיובים וגבייה. עזור בחישובי מע"מ, מעקב חובות, שליחת תזכורות תשלום. ענה בעברית.',
    tip: 'טיפ: ניתן לשלוח חשבונית PDF ישירות למייל המטופל'
  },
  '/reports': {
    title: 'דוחות',
    system: 'אתה עוזר AI לניתוח נתונים קליניים ועסקיים. עזור בפרשנות גרפים, זיהוי מגמות וקבלת החלטות עסקיות. ענה בעברית.',
    tip: 'טיפ: השווה שנים שונות לזיהוי מגמות עונתיות'
  },
  '/social': {
    title: 'סושיאל מדיה',
    system: 'אתה מומחה שיווק דיגיטלי לקליניקת פיזיותרפיה יואב אבני. עזור בתכנון תוכן, אסטרטגיית סושיאל מדיה וכתיבת פוסטים. ענה בעברית.',
    tip: 'טיפ: הוסף נושא ספציפי לקבלת תוכן ממוקד יותר'
  },
  '/todo': {
    title: 'משימות',
    system: 'אתה עוזר AI לניהול משימות ותעדוף. עזור בארגון משימות, תעדוף ומעקב התקדמות. ענה בעברית.',
    tip: 'טיפ: סמן משימות דחופות כ"דחוף" לתעדוף אוטומטי'
  },
  '/messages': {
    title: 'הודעות',
    system: 'אתה עוזר AI לתקשורת עם מטופלים. עזור בניסוח הודעות, מעקב שיחות וניהול תקשורת. ענה בעברית.',
    tip: 'טיפ: Enter לשליחת הודעה, Shift+Enter לשורה חדשה'
  },
  '/subscriptions': {
    title: 'מנויים',
    system: 'אתה עוזר AI לניהול מנויים וכרטיסיות. עזור במעקב תפוגות, חידושים וניהול מנויים. ענה בעברית.',
    tip: 'טיפ: מנויים שפגים בשבוע הקרוב מוצגים בצהוב'
  },
  '/expenses': {
    title: 'הוצאות',
    system: 'אתה עוזר AI לניהול הוצאות קליניקה. עזור בקיטלוג הוצאות, ניתוח עלויות ותכנון תקציב. ענה בעברית.',
    tip: 'טיפ: ניתן לייבא חשבוניות PDF אוטומטית עם AI'
  },
}

function getPageContext(pathname: string) {
  // חיפוש מדויק
  if (PAGE_CONTEXTS[pathname]) return PAGE_CONTEXTS[pathname]
  // חיפוש חלקי
  for (const [path, ctx] of Object.entries(PAGE_CONTEXTS)) {
    if (pathname.startsWith(path)) return ctx
  }
  // מטופל ספציפי
  if (pathname.startsWith('/patients/')) {
    return {
      title: 'פרופיל מטופל',
      system: 'אתה עוזר AI קליני לפיזיותרפיסט יואב אבני. עזור בניתוח SOAP, המלצות טיפול, קונטרה-אינדיקציות ותכנון טיפול. ענה בעברית.',
      tip: 'טיפ: לחץ "המלץ תוכנית טיפול" בראיון הקבלה לקבלת המלצות AI'
    }
  }
  return {
    title: 'קליניקת יואב אבני',
    system: 'אתה עוזר AI לקליניקת פיזיותרפיה של יואב אבני בגילון. ענה בעברית קצר וממוקד.',
    tip: 'שאל אותי כל שאלה על ניהול הקליניקה'
  }
}

export default function AIAssistant() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const ctx = getPageContext(pathname)

  useEffect(() => {
    setMessages([])
    setShowTip(true)
  }, [pathname])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // הסתר tip אחרי 8 שניות
  useEffect(() => {
    if (showTip) {
      const t = setTimeout(() => setShowTip(false), 8000)
      return () => clearTimeout(t)
    }
  }, [showTip, pathname])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ''
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          system: ctx.system,
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'לא הצלחתי לעבד את הבקשה'
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'שגיאה בחיבור ל-AI. נסה שוב.' }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* באנר טיפ */}
      {showTip && !open && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '20px', zIndex: 490,
          background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)',
          color: '#fff', padding: '10px 14px', borderRadius: '12px',
          fontSize: '12px', maxWidth: '260px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <span>💡 {ctx.tip}</span>
            <button onClick={() => setShowTip(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: 0 }}>✕</button>
          </div>
        </div>
      )}

      {/* כפתור צף */}
      <button onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 500,
          width: '52px', height: '52px', borderRadius: '50%',
          background: open ? '#dc2626' : 'linear-gradient(135deg, #1a3a5c, #3eb8e5)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }}>
        {open ? '✕' : '✨'}
      </button>

      {/* חלון צ'אט */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '84px', left: '20px', zIndex: 500,
          width: '340px', height: '460px',
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>✨ AI Assistant</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              {ctx.title} · קליניקת יואב אבני
            </div>
          </div>

          {/* הודעות */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>שלום יואב!</div>
                <div>איך אוכל לעזור בדף {ctx.title}?</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: msg.role === 'user' ? '#1a3a5c' : '#f8fafc',
                  color: msg.role === 'user' ? '#fff' : '#1a3a5c',
                  fontSize: '13px', lineHeight: '1.5', direction: 'rtl',
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '14px 4px 14px 14px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#94a3b8' }}>
                  ⏳ חושב...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* שדה קלט */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="שאל אותי משהו..."
              style={{
                flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: '20px', fontSize: '13px', fontFamily: 'Heebo, sans-serif',
                direction: 'rtl', outline: 'none'
              }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: input.trim() ? '#1a3a5c' : '#e2e8f0',
                color: '#fff', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}

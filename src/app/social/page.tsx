'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState, useRef } from 'react'

const HASHTAGS_PHYSIO = '#פיזיותרפיה #שיקום #בריאות #כאבגב #ספורט #ריצה #כדורסל #תרגול #בריאותהגב #physiotherapy #rehabilitation #sportsphysio #israeliphysio #יואבאבני #קליניקתיואבאבני'

const REEL_HOOKS = [
  'לא ידעת שזה גורם לכאב שלך 👇',
  'הטעות שכולם עושים בשיקום ❌',
  'למה הכאב חוזר? הסיבה האמיתית 🔍',
  '3 שניות שישנו לך את החיים 💥',
  'הפיזיותרפיסט שלא מספרים לך 🤫',
  'אחרי שתראה את זה — לא תעשה טעות זו שוב',
]

const STORY_HOOKS = [
  'ידעת את זה? 🤔',
  'שאלה: מה גורם לכאב שלך?',
  'טיפ מהיר לכאב גב 🙌',
  'האם גם אתה עושה את זה? 👇',
  'הצביעו: כאב גב / כאב ברך',
]

export default function SocialMediaPage() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [mode, setMode] = useState<'reel' | 'story'>('reel')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('video/')) { alert('יש להעלות קובץ וידאו בלבד'); return }
    setVideo(file)
    setVideoUrl(URL.createObjectURL(file))
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function generate() {
    if (!topic) { alert('תאר בקצרה את תוכן הסרטון'); return }
    setLoading(true); setResult(null)

    const prompt = mode === 'reel'
      ? `אתה מומחה שיווק דיגיטלי לקליניקות פיזיותרפיה. צור תוכן אינסטגרם מקצועי לרילס.

תוכן הסרטון: ${topic}
קליניקה: קליניקת יואב אבני — פיזיותרפיה ושיקום, גילון

צור תוכן שיווקי שמושך מקסימום חשיפה ולידים. ענה אך ורק ב-JSON תקין ללא markdown:
{
  "hook": "משפט פתיחה מושך (עד 8 מילים) שעוצר את הגלילה",
  "caption": "טקסט מלא לפוסט (150-200 מילים בעברית) — מרתק, מקצועי, עם CTA חזק בסוף",
  "cta": "קריאה לפעולה קצרה (לדוגמה: השאר פרטים בביו 👆)",
  "hashtags": "20 האשטאגים הרלוונטיים ביותר",
  "music_mood": "סגנון מוזיקה מומלץ (לדוגמה: אנרגטי ומוטיבציוני, שקט ומרגיע)",
  "best_time": "הזמן הטוב ביותר לפרסום",
  "text_overlay": "טקסט קצר שיופיע על הסרטון (עד 5 מילים)",
  "font_style": "סגנון פונט מומלץ באינסטגרם",
  "tips": ["טיפ 1 לעריכת הרילס", "טיפ 2", "טיפ 3"]
}`
      : `אתה מומחה שיווק דיגיטלי לקליניקות פיזיותרפיה. צור תוכן אינסטגרם לסטורי.

תוכן הסרטון: ${topic}
קליניקה: קליניקת יואב אבני — פיזיותרפיה ושיקום, גילון

צור תוכן שמגדיל מעורבות ולידים. ענה אך ורק ב-JSON תקין ללא markdown:
{
  "hook": "טקסט פתיחה קצר ומושך (עד 5 מילים)",
  "text_overlay": "טקסט שיופיע על הסרטון (עד 4 מילים, גדול ובולט)",
  "sticker": "סוג סטיקר מומלץ (שאלה / הצבעה / ספירה לאחור / קישור)",
  "sticker_text": "הטקסט לסטיקר (לדוגמה: כאב גב? / כן / לא)",
  "caption": "טקסט קצר לסטורי (עד 3 משפטים)",
  "cta": "קריאה לפעולה (לדוגמה: הקשב לביו 👆 / שלח לי הודעה 💬)",
  "music_mood": "סגנון מוזיקה מומלץ",
  "best_time": "הזמן הטוב ביותר לפרסום",
  "font_style": "סגנון פונט מומלץ",
  "tips": ["טיפ 1 לסטורי אפקטיבי", "טיפ 2", "טיפ 3"]
}`

    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      const text = data.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResult(parsed)
    } catch {
      alert('שגיאה ביצירת התוכן. ייתכן שאין קרדיט ב-Anthropic.')
    }
    setLoading(false)
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copy(text, k)} style={{ padding: '4px 10px', background: copiedKey === k ? '#d1fae5' : '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: copiedKey === k ? '#065f46' : '#64748b', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' }}>
      {copiedKey === k ? '✅ הועתק' : '📋 העתק'}
    </button>
  )

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📱 שיווק סושיאל מדיה</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>העלה סרטון וה-AI יכין לך תוכן מושלם לאינסטגרם</p>
          </div>
          {/* בחירת מצב */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <button onClick={() => { setMode('reel'); setResult(null) }} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: mode === 'reel' ? '700' : '400', background: mode === 'reel' ? '#1a3a5c' : 'transparent', color: mode === 'reel' ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎬 רילס
            </button>
            <button onClick={() => { setMode('story'); setResult(null) }} style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: mode === 'story' ? '700' : '400', background: mode === 'story' ? '#1a3a5c' : 'transparent', color: mode === 'story' ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📖 סטורי
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.5fr' : '1fr', gap: '20px' }}>
          {/* צד שמאל — העלאה */}
          <div>
            {/* אזור גרירה */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !video && fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? '#1a3a5c' : '#cbd5e1'}`, borderRadius: '16px', padding: video ? '16px' : '48px', textAlign: 'center', cursor: video ? 'default' : 'pointer', background: dragging ? '#f0f9ff' : '#fff', transition: 'all 0.2s', marginBottom: '16px' }}
            >
              <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              {video ? (
                <div>
                  <video src={videoUrl} controls style={{ width: '100%', borderRadius: '10px', maxHeight: '300px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>✅ {video.name}</span>
                    <button onClick={() => { setVideo(null); setVideoUrl(''); setResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontFamily: 'Heebo, sans-serif' }}>החלף סרטון</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎬</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '8px' }}>גרור סרטון לכאן</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>או לחץ לבחירת קובץ</div>
                  <div style={{ display: 'inline-block', padding: '10px 24px', background: '#1a3a5c', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>בחר סרטון</div>
                </>
              )}
            </div>

            {/* תיאור תוכן */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '18px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>תאר את תוכן הסרטון *</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder={mode === 'reel'
                  ? 'לדוגמה: טיפ לחיזוק שרירי הגב התחתון, 3 תרגילים שכל אחד יכול לעשות בבית...'
                  : 'לדוגמה: הדגמה של תרגיל לכאב ברך אחרי פציעת ספורט...'}
                style={{ width: '100%', minHeight: '100px', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', resize: 'vertical', outline: 'none', direction: 'rtl' }}
              />
            </div>

            {/* Hook suggestions */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>💡 השראה ל-{mode === 'reel' ? 'Hook רילס' : 'פתיחת סטורי'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(mode === 'reel' ? REEL_HOOKS : STORY_HOOKS).map((h, i) => (
                  <div key={i} onClick={() => setTopic(prev => prev ? prev + '. ' + h : h)}
                    style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#374151', border: '1px solid #e2e8f0' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>
                    {h}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={loading || !topic} style={{ width: '100%', padding: '14px', background: loading || !topic ? '#94a3b8' : 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading || !topic ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif', boxShadow: !loading && topic ? '0 4px 14px rgba(26,58,92,0.3)' : 'none' }}>
              {loading ? '⏳ ה-AI מכין תוכן...' : `✨ צור תוכן ל${mode === 'reel' ? 'רילס' : 'סטורי'}`}
            </button>
          </div>

          {/* צד ימין — תוצאות */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Hook */}
              <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '700' }}>🎯 Hook — עוצר את הגלילה</div>
                <div style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.4' }}>{result.hook}</div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <CopyBtn text={result.hook} k="hook" />
                </div>
              </div>

              {/* Text Overlay */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>📝 טקסט על הסרטון</div>
                  <CopyBtn text={result.text_overlay} k="overlay" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>{result.text_overlay}</div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>פונט מומלץ: <strong>{result.font_style}</strong></div>
              </div>

              {/* Sticker (story only) */}
              {mode === 'story' && result.sticker && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>🎪 סטיקר מומלץ</div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ padding: '8px 16px', background: '#fef3c7', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{result.sticker}</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>"{result.sticker_text}"</div>
                    <CopyBtn text={result.sticker_text} k="sticker" />
                  </div>
                </div>
              )}

              {/* Caption */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>💬 טקסט לפוסט</div>
                  <CopyBtn text={result.caption + '\n\n' + result.cta + '\n\n' + result.hashtags} k="full" />
                </div>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap', direction: 'rtl', maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  {result.caption}
                </div>
              </div>

              {/* CTA */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>🚀 קריאה לפעולה (CTA)</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c' }}>{result.cta}</div>
                  </div>
                  <CopyBtn text={result.cta} k="cta" />
                </div>
              </div>

              {/* Hashtags */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>🏷️ האשטאגים</div>
                  <CopyBtn text={result.hashtags} k="hashtags" />
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6', lineHeight: '1.8', direction: 'rtl' }}>{result.hashtags}</div>
              </div>

              {/* Music + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>🎵 מוזיקה מומלצת</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a5c' }}>{result.music_mood}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>⏰ זמן פרסום מומלץ</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a5c' }}>{result.best_time}</div>
                </div>
              </div>

              {/* Tips */}
              {result.tips && (
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', marginBottom: '10px', textTransform: 'uppercase' }}>💡 טיפים לעריכה</div>
                  {result.tips.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: '#374151' }}>
                      <span style={{ color: '#0b8a5e', fontWeight: '700', flexShrink: 0 }}>{i + 1}.</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* כפתור העתק הכל */}
              <button onClick={() => copy(`${result.hook}\n\n${result.caption}\n\n${result.cta}\n\n${result.hashtags}`, 'all')}
                style={{ width: '100%', padding: '13px', background: copiedKey === 'all' ? '#0b8a5e' : '#25d366', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {copiedKey === 'all' ? '✅ הועתק!' : '📋 העתק הכל לאינסטגרם'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

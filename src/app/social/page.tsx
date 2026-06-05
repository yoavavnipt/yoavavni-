'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState, useRef, useEffect } from 'react'

const MAKE_WEBHOOK = 'https://hook.eu1.make.com/wl7puq7yr9wj39p7as225gut62t5911v'
const UNSPLASH_KEY = ''
type Mode = 'reel' | 'story' | 'carousel' | 'post'

const REEL_HOOKS = [
  'לא ידעת שזה גורם לכאב שלך 👇',
  'הטעות שכולם עושים בשיקום ❌',
  'למה הכאב חוזר? הסיבה האמיתית 🔍',
  'מנוחה ממושכת = יותר כאב. למה?',
  'הפיזיותרפיסט שלא מספרים לך 🤫',
  'Motion is lotion — מה זה אומר בפועל?',
]
const STORY_HOOKS = [
  'ידעת את זה? 🤔', 'שאלה: מה גורם לכאב שלך?',
  'טיפ מהיר לכאב גב 🙌', 'האם גם אתה עושה את זה? 👇',
  'הצביעו: כאב גב / כאב ברך',
]
const CAROUSEL_TOPICS = [
  'מיתוסים על כאב גב', 'למה מנוחה לא עוזרת',
  'שיקום נכון אחרי פציעת ספורט', 'תרגילים לחיזוק הגב', 'כיצד הגוף לומד כאב',
]

// מצייר שקף קרוסל על canvas עם תמונה + overlay + טקסט + לוגו
async function drawSlide(canvas: HTMLCanvasElement, imageUrl: string, headline: string, body: string, slideNum: number, total: number) {
  const ctx = canvas.getContext('2d')!
  canvas.width = 1080; canvas.height = 1080

  // תמונת רקע
  await new Promise<void>((resolve) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => { ctx.drawImage(img, 0, 0, 1080, 1080); resolve() }
    img.onerror = () => { ctx.fillStyle = '#1a3a5c'; ctx.fillRect(0, 0, 1080, 1080); resolve() }
    img.src = imageUrl
  })

  // overlay כחול כהה
  ctx.fillStyle = 'rgba(26, 58, 92, 0.72)'
  ctx.fillRect(0, 0, 1080, 1080)

  // מספר שקף
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`${slideNum}/${total}`, 40, 60)

  // כותרת
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Arial'
  ctx.textAlign = 'right'
  ctx.direction = 'rtl'
  const maxWidth = 960
  const words = headline.split(' ')
  let line = ''; let y = 400
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, 1040, y); line = word; y += 80
    } else { line = test }
  }
  ctx.fillText(line, 1040, y)

  // גוף
  if (body) {
    ctx.font = '36px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
    const bodyWords = body.split(' '); let bLine = ''; let by = y + 100
    for (const word of bodyWords) {
      const test = bLine ? bLine + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth && bLine) {
        ctx.fillText(bLine, 1040, by); bLine = word; by += 50
      } else { bLine = test }
    }
    ctx.fillText(bLine, 1040, by)
  }

  // לוגו
  await new Promise<void>((resolve) => {
    const logo = new Image(); logo.crossOrigin = 'anonymous'
    logo.onload = () => {
      const logoH = 120; const logoW = (logo.width / logo.height) * logoH
      ctx.drawImage(logo, 1080 - logoW - 40, 1080 - logoH - 40, logoW, logoH)
      resolve()
    }
    logo.onerror = () => resolve()
    logo.src = '/logo.png'
  })
}

async function fetchUnsplashImage(query: string): Promise<string> {
  try {
    const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`)
    const data = await res.json()
    return data.url || ''
  } catch { return '' }
}

export default function SocialMediaPage() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [mode, setMode] = useState<Mode>('reel')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'script' | 'srt' | 'carousel'>('content')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [slideImages, setSlideImages] = useState<string[]>([])
  const [generatingImages, setGeneratingImages] = useState(false)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  function handleFile(file: File) {
    if (!file.type.startsWith('video/')) { alert('יש להעלות קובץ וידאו בלבד'); return }
    setVideo(file); setVideoUrl(URL.createObjectURL(file)); setResult(null)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) handleFile(file)
  }
  function downloadSRT(srt: string) {
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'captions.srt'; a.click()
    URL.revokeObjectURL(url)
  }
  async function publishToMake(caption: string) {
    setPublishing(true); setPublished(false)
    try {
      await fetch(MAKE_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: mode, caption, topic, image_url: '' }) })
      setPublished(true); setTimeout(() => setPublished(false), 4000)
    } catch { alert('שגיאה בשליחה ל-Make') }
    setPublishing(false)
  }

  function buildPrompt(): string {
    const base = `You are a social media expert for an Israeli physiotherapy clinic called "קליניקת יואב אבני" in Gilon. Topic: ${topic}. Return ONLY valid JSON, no markdown, no newlines inside string values.`
    if (mode === 'reel') return `${base} Format: {"hook":"","caption":"","cta":"","hashtags":"#פיזיותרפיה #יואבאבני #motionislotion","music_mood":"","best_time":"","text_overlay":"","font_style":"Classic White","voiceover_script":[{"second":0,"text":""},{"second":5,"text":""},{"second":12,"text":""},{"second":18,"text":""}],"tips":["",""]}`
    if (mode === 'story') return `${base} Format: {"hook":"","text_overlay":"","sticker":"","sticker_text":"","caption":"","cta":"","music_mood":"","best_time":"","font_style":"Classic White","voiceover_script":[{"second":0,"text":""},{"second":5,"text":""},{"second":10,"text":""}],"tips":["",""]}`
    if (mode === 'carousel') return `${base} Format: {"title":"","caption":"","hashtags":"#פיזיותרפיה #יואבאבני #motionislotion","slides":[{"num":1,"type":"hook","headline":"","body":"","photo_query":"physiotherapy exercise"},{"num":2,"type":"problem","headline":"","body":"","photo_query":"back pain"},{"num":3,"type":"solution","headline":"","body":"","photo_query":"physical therapy treatment"},{"num":4,"type":"cta","headline":"","body":"054-5953889","photo_query":"healthy active lifestyle"}],"tips":["",""]}`
    return `${base} Format: {"headline":"","caption":"","hashtags":"#פיזיותרפיה #יואבאבני","photo_query":"physiotherapy","best_time":"","cta":"","design_notes":""}`
  }

  async function generate() {
    if (!topic) { alert('תאר את הנושא קודם'); return }
    setLoading(true); setResult(null); setSlideImages([]); setActiveTab('content')
    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ''
      if (!apiKey) { alert('שגיאה: NEXT_PUBLIC_ANTHROPIC_API_KEY לא מוגדר'); setLoading(false); return }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, messages: [{ role: 'user', content: buildPrompt() }] }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { alert(`שגיאה: ${data.error?.message || res.status}`); setLoading(false); return }
      const text = data.content?.[0]?.text || ''
      const jsonStart = text.indexOf('{'); const jsonEnd = text.lastIndexOf('}')
      if (jsonStart === -1 || jsonEnd === -1) { alert('לא התקבל תוכן תקין'); setLoading(false); return }
      let clean = text.substring(jsonStart, jsonEnd + 1)
      let parsed: any = null
      try { parsed = JSON.parse(clean) } catch {
        try { parsed = JSON.parse(clean.replace(/[\r\n\t]+/g, ' ')) } catch {
          parsed = { hook: '⚠️ תוכן התקבל', caption: text, cta: 'העתק ידנית', hashtags: '', tips: ['נסה שוב'] }
        }
      }
      setResult(parsed)
      // אם קרוסל — טען תמונות Unsplash
      if (parsed.slides && UNSPLASH_KEY) {
        setGeneratingImages(true)
        setActiveTab('carousel')
        const imgs = await Promise.all(parsed.slides.map((s: any) => fetchUnsplashImage(s.photo_query || topic)))
        setSlideImages(imgs)
        setGeneratingImages(false)
      }
    } catch (err: any) { alert('שגיאה: ' + err.message) }
    setLoading(false)
  }

  // צייר slides על canvas כשיש תמונות
  useEffect(() => {
    if (!result?.slides || slideImages.length === 0) return
    result.slides.forEach((slide: any, i: number) => {
      const canvas = canvasRefs.current[i]
      if (canvas && slideImages[i]) {
        drawSlide(canvas, slideImages[i], slide.headline, slide.body || '', i + 1, result.slides.length)
      }
    })
  }, [slideImages, result])

  function downloadSlide(i: number) {
    const canvas = canvasRefs.current[i]
    if (!canvas) return
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/jpeg', 0.9)
    a.download = `slide_${i + 1}.jpg`; a.click()
  }

  function generateSRT(script: { second: number; text: string }[]) {
    return script.map((line, i) => {
      const start = line.second; const end = script[i + 1]?.second || (line.second + 4)
      const fmt = (s: number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')},000`
      return `${i + 1}\n${fmt(start)} --> ${fmt(end)}\n${line.text}\n`
    }).join('\n')
  }
  function copy(text: string, key: string) { navigator.clipboard.writeText(text); setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000) }
  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copy(text, k)} style={{ padding: '4px 10px', background: copiedKey === k ? '#d1fae5' : '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: copiedKey === k ? '#065f46' : '#64748b', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' }}>
      {copiedKey === k ? '✅ הועתק' : '📋 העתק'}
    </button>
  )
  const modes: { key: Mode; icon: string; label: string }[] = [
    { key: 'reel', icon: '🎬', label: 'רילס' }, { key: 'story', icon: '📖', label: 'סטורי' },
    { key: 'carousel', icon: '🎠', label: 'קרוסל' }, { key: 'post', icon: '🖼️', label: 'פוסט' },
  ]

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📱 שיווק סושיאל מדיה</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>AI מכין תוכן + תמונות בסגנון YOAVAVNI</p>
          </div>
          <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {modes.map(m => (
              <button key={m.key} onClick={() => { setMode(m.key); setResult(null); setSlideImages([]) }}
                style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: mode === m.key ? '700' : '400', background: mode === m.key ? '#1a3a5c' : 'transparent', color: mode === m.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '380px 1fr' : '600px', gap: '20px', justifyContent: result ? 'stretch' : 'center' }}>
          <div>
            {(mode === 'reel' || mode === 'story') && (
              <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
                onClick={() => !video && fileRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? '#1a3a5c' : '#cbd5e1'}`, borderRadius: '16px', padding: video ? '16px' : '32px', textAlign: 'center', cursor: video ? 'default' : 'pointer', background: dragging ? '#f0f9ff' : '#fff', marginBottom: '16px' }}>
                <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                {video ? (
                  <div>
                    <video src={videoUrl} controls style={{ width: '100%', borderRadius: '10px', maxHeight: '240px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>✅ {video.name}</span>
                      <button onClick={() => { setVideo(null); setVideoUrl(''); setResult(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontFamily: 'Heebo, sans-serif' }}>החלף</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎬</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '4px' }}>גרור סרטון לכאן</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>MP4, MOV, AVI</div>
                    <div style={{ display: 'inline-block', padding: '8px 20px', background: '#1a3a5c', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>בחר סרטון</div>
                  </>
                )}
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                {mode === 'carousel' ? '📋 נושא הקרוסל *' : mode === 'post' ? '📋 נושא הפוסט *' : '📋 תאר את תוכן הסרטון *'}
              </label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={mode === 'reel' ? 'לדוגמה: מסביר למה מנוחה ממושכת מגדילה כאב...' : mode === 'story' ? 'לדוגמה: טיפ מהיר לכאב גב תחתון...' : mode === 'carousel' ? 'לדוגמה: למה מנוחה לא פותרת כאב גב...' : 'לדוגמה: פוסט חינוכי על חשיבות התנועה...'}
                style={{ width: '100%', minHeight: '90px', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', resize: 'vertical', outline: 'none', direction: 'rtl' }} />
            </div>
            {(mode === 'reel' || mode === 'story') && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>💡 רעיונות ל-Hook</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {(mode === 'reel' ? REEL_HOOKS : STORY_HOOKS).map((h, i) => (
                    <div key={i} onClick={() => setTopic(prev => prev ? prev + '. ' + h : h)}
                      style={{ padding: '7px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#374151', border: '1px solid #e2e8f0' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>{h}</div>
                  ))}
                </div>
              </div>
            )}
            {mode === 'carousel' && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>💡 נושאים מומלצים</div>
                {CAROUSEL_TOPICS.map((t, i) => (
                  <div key={i} onClick={() => setTopic(t)}
                    style={{ padding: '7px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#374151', border: '1px solid #e2e8f0', marginBottom: '5px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>{t}</div>
                ))}
              </div>
            )}
            <button onClick={generate} disabled={loading || !topic}
              style={{ width: '100%', padding: '14px', background: loading || !topic ? '#94a3b8' : 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: loading || !topic ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {loading ? '⏳ ה-AI מכין תוכן...' : `✨ צור ${mode === 'reel' ? 'רילס' : mode === 'story' ? 'סטורי' : mode === 'carousel' ? 'קרוסל' : 'פוסט'}`}
            </button>
            {topic && (
              <button onClick={() => publishToMake(topic)} disabled={publishing}
                style={{ width: '100%', padding: '11px', background: published ? '#0b8a5e' : publishing ? '#94a3b8' : 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: publishing ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '8px' }}>
                {published ? '✅ נשמר ב-Make!' : publishing ? '⏳ שולח...' : '📤 שמור נושא ב-Make'}
              </button>
            )}
          </div>

          {result && (
            <div>
              <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px' }}>
                {[
                  { key: 'content', label: '📄 תוכן' },
                  ...(result.voiceover_script ? [{ key: 'script', label: '🎙️ סקריפט' }, { key: 'srt', label: '📺 SRT' }] : []),
                  ...(result.slides ? [{ key: 'carousel', label: '🎠 קרוסל' }] : []),
                ].map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                    style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === t.key ? '700' : '400', background: activeTab === t.key ? '#1a3a5c' : 'transparent', color: activeTab === t.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(result.hook || result.headline || result.title) && (
                    <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontWeight: '700' }}>🎯 Hook</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.4', textDecoration: 'underline' }}>{result.hook || result.headline || result.title}</div>
                      <div style={{ marginTop: '10px' }}><CopyBtn text={result.hook || result.headline || result.title} k="hook" /></div>
                    </div>
                  )}
                  {result.text_overlay && (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>📝 טקסט על הסרטון</div>
                        <CopyBtn text={result.text_overlay} k="overlay" />
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', padding: '12px', background: '#1a3a5c', borderRadius: '8px', textAlign: 'center' }}>{result.text_overlay}</div>
                    </div>
                  )}
                  {mode === 'story' && result.sticker && (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🎪 סטיקר</div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ padding: '6px 14px', background: '#fef3c7', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#92400e' }}>{result.sticker}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>"{result.sticker_text}"</div>
                        <CopyBtn text={result.sticker_text} k="sticker" />
                      </div>
                    </div>
                  )}
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>💬 caption</div>
                      <CopyBtn text={(result.caption || '') + '\n\n' + (result.cta || '') + '\n\n' + (result.hashtags || '')} k="full" />
                    </div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap', direction: 'rtl', maxHeight: '180px', overflowY: 'auto', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>{result.caption}</div>
                  </div>
                  {result.cta && (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>🚀 CTA</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c' }}>{result.cta}</div></div>
                        <CopyBtn text={result.cta} k="cta" />
                      </div>
                    </div>
                  )}
                  {result.hashtags && (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>🏷️ האשטאגים</div>
                        <CopyBtn text={result.hashtags} k="hashtags" />
                      </div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', lineHeight: '1.8' }}>{result.hashtags}</div>
                    </div>
                  )}
                  {(result.music_mood || result.best_time) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {result.music_mood && <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>🎵 מוזיקה</div><div style={{ fontSize: '12px', fontWeight: '600', color: '#1a3a5c' }}>{result.music_mood}</div></div>}
                      {result.best_time && <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>⏰ זמן פרסום</div><div style={{ fontSize: '12px', fontWeight: '600', color: '#1a3a5c' }}>{result.best_time}</div></div>}
                    </div>
                  )}
                  {result.tips && (
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '14px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', marginBottom: '8px' }}>💡 טיפים</div>
                      {result.tips.map((tip: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '12px', color: '#374151' }}>
                          <span style={{ color: '#0b8a5e', fontWeight: '700' }}>{i + 1}.</span><span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button onClick={() => copy(`${result.hook || result.headline || ''}\n\n${result.caption || ''}\n\n${result.cta || ''}\n\n${result.hashtags || ''}`, 'all')}
                      style={{ padding: '13px', background: copiedKey === 'all' ? '#0b8a5e' : '#25d366', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      {copiedKey === 'all' ? '✅ הועתק!' : '📋 העתק הכל'}
                    </button>
                    <button onClick={() => publishToMake(`${result.hook || result.headline || ''}\n\n${result.caption || ''}\n\n${result.cta || ''}\n\n${result.hashtags || ''}`)} disabled={publishing}
                      style={{ padding: '13px', background: published ? '#0b8a5e' : publishing ? '#94a3b8' : 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: publishing ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      {published ? '✅ נשלח!' : publishing ? '⏳ שולח...' : '📤 שלח ל-Make'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'script' && result.voiceover_script && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>🎙️ סקריפט קריינות</div>
                    <CopyBtn text={result.voiceover_script.map((l: any) => `[${l.second}שנ] ${l.text}`).join('\n')} k="script" />
                  </div>
                  {result.voiceover_script.map((line: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ minWidth: '52px', padding: '4px 8px', background: '#1a3a5c', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{line.second}שנ'</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a5c', lineHeight: '1.5', direction: 'rtl' }}>{line.text}</div>
                    </div>
                  ))}
                  <button onClick={() => copy(result.voiceover_script.map((l: any) => l.text).join('\n\n'), 'script_plain')}
                    style={{ width: '100%', padding: '11px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '12px' }}>
                    {copiedKey === 'script_plain' ? '✅ הועתק!' : '📋 העתק לקריינות'}
                  </button>
                </div>
              )}

              {activeTab === 'srt' && result.voiceover_script && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c', marginBottom: '8px' }}>📺 קובץ כתוביות SRT</div>
                  <pre style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: '10px', padding: '16px', fontSize: '12px', overflowX: 'auto', lineHeight: '1.8', direction: 'ltr', textAlign: 'left' }}>{generateSRT(result.voiceover_script)}</pre>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                    <button onClick={() => downloadSRT(generateSRT(result.voiceover_script))} style={{ padding: '11px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>⬇️ הורד SRT</button>
                    <button onClick={() => copy(generateSRT(result.voiceover_script), 'srt')} style={{ padding: '11px', background: copiedKey === 'srt' ? '#0b8a5e' : '#f1f5f9', color: copiedKey === 'srt' ? '#fff' : '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      {copiedKey === 'srt' ? '✅ הועתק' : '📋 העתק SRT'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'carousel' && result.slides && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {generatingImages && (
                    <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0369a1' }}>⏳ מוריד תמונות מ-Unsplash...</div>
                    </div>
                  )}
                  {result.slides.map((slide: any, i: number) => (
                    <div key={slide.num} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div style={{ background: '#1a3a5c', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>שקף {slide.num} — {slide.type === 'hook' ? 'Hook' : slide.type === 'problem' ? 'בעיה' : slide.type === 'solution' ? 'פתרון' : 'CTA'}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <CopyBtn text={`${slide.headline}\n${slide.body}`} k={`slide${slide.num}`} />
                          {slideImages[i] && <button onClick={() => downloadSlide(i)} style={{ padding: '4px 10px', background: '#0b8a5e', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', color: '#fff', fontFamily: 'Heebo, sans-serif' }}>⬇️ הורד</button>}
                        </div>
                      </div>
                      <div style={{ padding: '0' }}>
                        <canvas ref={el => { canvasRefs.current[i] = el }} style={{ width: '100%', display: slideImages[i] ? 'block' : 'none', borderRadius: '0 0 12px 12px' }} />
                        {!slideImages[i] && (
                          <div style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', textDecoration: 'underline', marginBottom: '8px' }}>{slide.headline}</div>
                            {slide.body && <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.7' }}>{slide.body}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {result.caption && (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>💬 caption + hashtags</div>
                        <CopyBtn text={(result.caption || '') + '\n\n' + (result.hashtags || '')} k="carousel_caption" />
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8', direction: 'rtl', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>{result.caption}</div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px' }}>{result.hashtags}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

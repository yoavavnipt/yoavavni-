'use client'
import { useState, useEffect } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

interface Props {
  patient: any
}

const COMMON_EXERCISES = [
  { name: 'גשר', default_sets: 3, default_reps: 15, default_hold: '', notes: 'לשמור על גב ניטרלי, לסחוט את הישבן' },
  { name: 'קלאם של', default_sets: 3, default_reps: 15, default_hold: '', notes: 'לשמור על אגן יציב, לא לגלגל את הגב' },
  { name: 'פלאנק', default_sets: 3, default_reps: '', default_hold: '30', notes: 'גב ישר, לא להפיל את הירכיים' },
  { name: 'סקוואט', default_sets: 3, default_reps: 12, default_hold: '', notes: 'ברכיים מעל האצבעות, לרדת לאט' },
  { name: 'מתיחת ירך', default_sets: 3, default_reps: '', default_hold: '30', notes: 'לנשום בצורה רגועה' },
  { name: 'הרמת עקב', default_sets: 3, default_reps: 20, default_hold: '', notes: 'לעלות לאט, לרדת עוד יותר לאט' },
  { name: 'Wall slide', default_sets: 3, default_reps: 12, default_hold: '', notes: 'גב צמוד לקיר לאורך כל התנועה' },
  { name: 'Bird dog', default_sets: 3, default_reps: 10, default_hold: '3', notes: 'לייצב את הליבה לפני התנועה' },
]

interface Exercise {
  name: string
  sets: string
  reps: string
  hold: string
  notes: string
  videoUrl: string
}

export default function HEPPanel({ patient }: Props) {
  const [showPanel, setShowPanel] = useState(false)
  const [mode, setMode] = useState<'choose' | 'video' | 'plan'>('choose')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoNote, setVideoNote] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [dbVideos, setDbVideos] = useState<any[]>([])
  const [customExercise, setCustomExercise] = useState({ name: '', sets: '3', reps: '12', hold: '', notes: '', videoUrl: '' })

  useEffect(() => {
    if (showPanel) {
      supabase.from('exercise_videos').select('*').order('title').then(({ data }) => setDbVideos(data || []))
    }
  }, [showPanel])

  function addFromLibrary(ex: typeof COMMON_EXERCISES[0]) {
    setExercises(p => [...p, {
      name: ex.name,
      sets: String(ex.default_sets),
      reps: String(ex.default_reps || ''),
      hold: String(ex.default_hold || ''),
      notes: ex.notes,
      videoUrl: '',
    }])
  }

  function addFromDB(v: any) {
    setExercises(p => [...p, {
      name: v.title,
      sets: v.sets || '3',
      reps: v.reps || '12',
      hold: v.hold_time || '',
      notes: v.instructions || '',
      videoUrl: v.url || '',
    }])
  }

  function addCustom() {
    if (!customExercise.name) return
    setExercises(p => [...p, { ...customExercise }])
    setCustomExercise({ name: '', sets: '3', reps: '12', hold: '', notes: '', videoUrl: '' })
  }

  function removeExercise(i: number) {
    setExercises(p => p.filter((_, idx) => idx !== i))
  }

  function updateExercise(i: number, field: keyof Exercise, value: string) {
    setExercises(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e))
  }

  function sendVideo() {
    if (!videoUrl) return
    const name = `${patient.first_name} ${patient.last_name}`
    const phone = patient.phone?.replace(/^0/, '').replace(/-/g, '')
    const msg = `שלום ${name} 😊\n\nמצורף סרטון תרגיל הבית שלך:\n${videoUrl}${videoNote ? `\n\n${videoNote}` : ''}\n\nלשאלות — אני כאן 💪\n${CLINIC.name}`
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowPanel(false)
  }

  function buildPlanMessage() {
    const name = `${patient.first_name} ${patient.last_name}`
    let msg = `שלום ${name} 😊\n\nתוכנית תרגילי הבית שלך:\n`
    msg += `${'─'.repeat(25)}\n\n`
    exercises.forEach((e, i) => {
      msg += `${i + 1}. *${e.name}*\n`
      if (e.sets || e.reps) {
        msg += `   📊 ${e.sets ? `${e.sets} סטים` : ''}${e.sets && e.reps ? ' × ' : ''}${e.reps ? `${e.reps} חזרות` : ''}${e.hold ? ` | החזק ${e.hold} שנ'` : ''}\n`
      }
      if (e.notes) msg += `   💡 ${e.notes}\n`
      if (e.videoUrl) msg += `   🎬 ${e.videoUrl}\n`
      msg += '\n'
    })
    msg += `${'─'.repeat(25)}\n`
    msg += `⚠️ לעצור במידה ומופיע כאב חד\n`
    msg += `לשאלות — אני כאן 💪\n${CLINIC.name}`
    return msg
  }

  function sendPlan() {
    if (exercises.length === 0) return
    const phone = patient.phone?.replace(/^0/, '').replace(/-/g, '')
    const msg = buildPlanMessage()
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setShowPanel(false)
  }

  const inp = { width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none', background: '#fff' } as const

  if (!showPanel) return (
    <button onClick={() => { setShowPanel(true); setMode('choose') }} style={{
      padding: '8px 12px', background: '#854d0e', color: '#fff',
      border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
      cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
    }}>
      🏋️ תרגילי בית
    </button>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', background: '#854d0e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>🏋️ שליחת תרגילי בית</div>
          <button onClick={() => { setShowPanel(false); setMode('choose'); setExercises([]) }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontFamily: 'Heebo, sans-serif' }}>
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {/* CHOOSE MODE */}
          {mode === 'choose' && (
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', textAlign: 'center' }}>
                שלום {patient.first_name} — בחר איך לשלוח תרגילי בית:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div onClick={() => setMode('video')} style={{
                  padding: '24px 16px', background: '#fff', border: '2px solid #e2e8f0',
                  borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#854d0e'; e.currentTarget.style.background = '#fef9f0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎬</div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>שלח סרטון</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>לינק YouTube / WhatsApp</div>
                </div>
                <div onClick={() => setMode('plan')} style={{
                  padding: '24px 16px', background: '#fff', border: '2px solid #e2e8f0',
                  borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#854d0e'; e.currentTarget.style.background = '#fef9f0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>בנה תוכנית</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>רשימת תרגילים + מינונים</div>
                </div>
              </div>
            </div>
          )}

          {/* VIDEO MODE */}
          {mode === 'video' && (
            <div>
              <button onClick={() => setMode('choose')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', marginBottom: '14px', fontFamily: 'Heebo, sans-serif' }}>← חזור</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>לינק הסרטון</label>
                  <input style={{ ...inp, direction: 'ltr' }} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/... או https://wa.me/..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>הערה / דגשים</label>
                  <textarea value={videoNote} onChange={e => setVideoNote(e.target.value)}
                    placeholder="לשמור על גב ניטרלי, לעצור אם יש כאב חד..."
                    style={{ ...inp, minHeight: '80px', resize: 'vertical' as const }} />
                </div>
              </div>
            </div>
          )}

          {/* PLAN MODE */}
          {mode === 'plan' && (
            <div>
              <button onClick={() => setMode('choose')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', marginBottom: '14px', fontFamily: 'Heebo, sans-serif' }}>← חזור</button>

              {/* Quick add from library */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>הוסף מהמאגר המהיר</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {COMMON_EXERCISES.map(e => (
                    <button key={e.name} onClick={() => addFromLibrary(e)} style={{
                      padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '20px',
                      background: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                      color: '#374151',
                    }}
                    onMouseEnter={e2 => { e2.currentTarget.style.background = '#fef9f0'; e2.currentTarget.style.borderColor = '#854d0e' }}
                    onMouseLeave={e2 => { e2.currentTarget.style.background = '#fff'; e2.currentTarget.style.borderColor = '#e2e8f0' }}>
                      + {e.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* From DB videos */}
              {dbVideos.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>הוסף מהמאגר שלי</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {dbVideos.map(v => (
                      <button key={v.id} onClick={() => addFromDB(v)} style={{
                        padding: '5px 10px', border: '1px solid #dbeafe', borderRadius: '20px',
                        background: '#eff6ff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', color: '#1e40af',
                      }}>
                        🎬 {v.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom exercise */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>הוסף תרגיל מותאם</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                  <input style={inp} value={customExercise.name} onChange={e => setCustomExercise(p => ({ ...p, name: e.target.value }))} placeholder="שם תרגיל" />
                  <input style={inp} value={customExercise.sets} onChange={e => setCustomExercise(p => ({ ...p, sets: e.target.value }))} placeholder="סטים" />
                  <input style={inp} value={customExercise.reps} onChange={e => setCustomExercise(p => ({ ...p, reps: e.target.value }))} placeholder="חזרות" />
                  <input style={inp} value={customExercise.hold} onChange={e => setCustomExercise(p => ({ ...p, hold: e.target.value }))} placeholder="שנ'" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                  <input style={inp} value={customExercise.notes} onChange={e => setCustomExercise(p => ({ ...p, notes: e.target.value }))} placeholder="דגשים..." />
                  <button onClick={addCustom} style={{ padding: '7px 14px', background: '#854d0e', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>+ הוסף</button>
                </div>
              </div>

              {/* Exercise list */}
              {exercises.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>התוכנית ({exercises.length} תרגילים)</div>
                  {exercises.map((e, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{i + 1}. {e.name}</div>
                        <button onClick={() => removeExercise(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>×</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <input style={{ ...inp, fontSize: '11px' }} value={e.sets} onChange={ev => updateExercise(i, 'sets', ev.target.value)} placeholder="סטים" />
                        <input style={{ ...inp, fontSize: '11px' }} value={e.reps} onChange={ev => updateExercise(i, 'reps', ev.target.value)} placeholder="חזרות" />
                        <input style={{ ...inp, fontSize: '11px' }} value={e.hold} onChange={ev => updateExercise(i, 'hold', ev.target.value)} placeholder="החזקה שנ'" />
                      </div>
                      <input style={{ ...inp, fontSize: '11px', marginTop: '6px' }} value={e.notes} onChange={ev => updateExercise(i, 'notes', ev.target.value)} placeholder="דגשים..." />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
          {mode === 'video' && (
            <button onClick={sendVideo} disabled={!videoUrl} style={{
              width: '100%', padding: '13px', background: videoUrl ? '#25d366' : '#94a3b8',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800',
              cursor: videoUrl ? 'pointer' : 'not-allowed', fontFamily: 'Heebo, sans-serif',
            }}>
              📤 שלח סרטון ב-WhatsApp
            </button>
          )}
          {mode === 'plan' && (
            <button onClick={sendPlan} disabled={exercises.length === 0} style={{
              width: '100%', padding: '13px', background: exercises.length > 0 ? '#25d366' : '#94a3b8',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800',
              cursor: exercises.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'Heebo, sans-serif',
            }}>
              📤 שלח תוכנית ב-WhatsApp ({exercises.length} תרגילים)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

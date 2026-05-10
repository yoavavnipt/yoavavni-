'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['גב', 'צוואר', 'כתף', 'ברך', 'ירך', 'קרסול', 'ליבה', 'מתיחות', 'חיזוק', 'שיקום', 'פיזיותרפיה במים', 'ריצה']

const inp = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Heebo, sans-serif', background:'#fff' } as const
const lbl = { display:'block' as const, fontSize:'11px', fontWeight:'700' as const, color:'#64748b', marginBottom:'4px', textTransform:'uppercase' as const }

function getYouTubeId(url: string) {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

function getYouTubeThumbnail(url: string) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', category: '', url: '', duration: '',
    sets: '', reps: '', hold_time: '', instructions: '', notes: ''
  })

  useEffect(() => { load() }, [cat, search])

  async function load() {
    setLoading(true)
    let q = supabase.from('exercise_videos').select('*').order('category').order('title')
    if (cat) q = q.eq('category', cat)
    if (search) q = q.ilike('title', `%${search}%`)
    const { data } = await q
    setVideos(data || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ title:'', category:'', url:'', duration:'', sets:'', reps:'', hold_time:'', instructions:'', notes:'' })
    setEditingId(null)
  }

  function openNew() { resetForm(); setShowForm(true) }

  function openEdit(v: any) {
    setForm({
      title: v.title || '', category: v.category || '', url: v.url || '',
      duration: v.duration || '', sets: v.sets || '', reps: v.reps || '',
      hold_time: v.hold_time || '', instructions: v.instructions || '', notes: v.notes || ''
    })
    setEditingId(v.id)
    setShowForm(true)
  }

  async function save() {
    if (!form.title || !form.url) { alert('שם וקישור הם שדות חובה'); return }
    setSaving(true)
    if (editingId) {
      await supabase.from('exercise_videos').update(form).eq('id', editingId)
    } else {
      await supabase.from('exercise_videos').insert([form])
    }
    setSaving(false)
    setShowForm(false)
    resetForm()
    load()
  }

  async function deleteVideo(id: string) {
    if (!confirm('למחוק את הסרטון?')) return
    await supabase.from('exercise_videos').delete().eq('id', id)
    load()
  }

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  return (
    <AppLayout>
      <div style={{ padding:'20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#1a3a5c' }}>🎬 מאגר סרטוני תרגילים</h1>
            <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>{videos.length} סרטונים</p>
          </div>
          <button onClick={openNew} style={{ padding:'9px 18px', background:'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            + סרטון חדש
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          <input placeholder="🔍 חפש תרגיל..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{ ...inp, flex:1, minWidth:'200px' }} />
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            <button onClick={()=>setCat('')} style={{ padding:'6px 12px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:!cat?'700':'400', background:!cat?'#1a3a5c':'#fff', color:!cat?'#fff':'#64748b', fontFamily:'Heebo, sans-serif', boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>הכל</button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={()=>setCat(cat===c?'':c)} style={{ padding:'6px 12px', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:cat===c?'700':'400', background:cat===c?'#1a3a5c':'#fff', color:cat===c?'#fff':'#64748b', fontFamily:'Heebo, sans-serif', boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Videos grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>טוען...</div>
        ) : videos.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:'12px', padding:'60px', textAlign:'center', color:'#94a3b8', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎬</div>
            <div style={{ fontSize:'14px', marginBottom:'6px' }}>אין סרטונים עדיין</div>
            <div style={{ fontSize:'12px', marginBottom:'16px' }}>הוסף סרטון ראשון עם לינק YouTube</div>
            <button onClick={openNew} style={{ padding:'10px 20px', background:'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>+ הוסף סרטון</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'14px' }}>
            {videos.map(v => {
              const thumb = getYouTubeThumbnail(v.url)
              const ytId = getYouTubeId(v.url)
              return (
                <div key={v.id} style={{ background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  {/* Thumbnail */}
                  <div style={{ position:'relative', height:'140px', background:'#1a3a5c', overflow:'hidden' }}>
                    {thumb ? (
                      <img src={thumb} alt={v.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:'40px' }}>🎬</div>
                    )}
                    {ytId && (
                      <a href={v.url} target="_blank" rel="noreferrer" style={{
                        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                        width:'44px', height:'44px', background:'rgba(255,0,0,0.9)', borderRadius:'50%',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'#fff'
                      }}>▶</a>
                    )}
                    {v.category && (
                      <span style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(26,58,92,0.85)', color:'#fff', padding:'3px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:'700' }}>
                        {v.category}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding:'12px' }}>
                    <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'6px', color:'#1e293b' }}>{v.title}</div>

                    {/* Dosage */}
                    {(v.sets || v.reps || v.hold_time || v.duration) && (
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'6px' }}>
                        {v.sets && <span style={{ background:'#dbeafe', color:'#1e40af', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'600' }}>{v.sets} סטים</span>}
                        {v.reps && <span style={{ background:'#d1fae5', color:'#065f46', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'600' }}>{v.reps} חזרות</span>}
                        {v.hold_time && <span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'600' }}>החזק {v.hold_time} שנ'</span>}
                        {v.duration && <span style={{ background:'#f3e8ff', color:'#6b21a8', padding:'2px 7px', borderRadius:'8px', fontSize:'10px', fontWeight:'600' }}>{v.duration}</span>}
                      </div>
                    )}

                    {v.instructions && (
                      <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'8px', lineHeight:'1.5' }}>
                        {v.instructions.length > 80 ? v.instructions.slice(0,80) + '...' : v.instructions}
                      </div>
                    )}

                    <div style={{ display:'flex', gap:'6px' }}>
                      <button onClick={()=>openEdit(v)} style={{ flex:1, padding:'6px', border:'1px solid #e2e8f0', borderRadius:'6px', background:'#fff', fontSize:'11px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', color:'#475569' }}>
                        ✏️ עריכה
                      </button>
                      <button onClick={()=>deleteVideo(v.id)} style={{ padding:'6px 10px', border:'1px solid #fee2e2', borderRadius:'6px', background:'#fff', fontSize:'11px', cursor:'pointer', fontFamily:'Heebo, sans-serif', color:'#dc2626' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'540px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
              {/* Modal Header */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1a3a5c' }}>
                <div style={{ fontWeight:'800', fontSize:'16px', color:'#fff' }}>
                  {editingId ? '✏️ עריכת סרטון' : '+ סרטון חדש'}
                </div>
                <button onClick={()=>{setShowForm(false);resetForm()}} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'18px', fontFamily:'Heebo, sans-serif' }}>×</button>
              </div>

              <div style={{ overflowY:'auto', padding:'20px', flex:1 }}>
                {/* Preview */}
                {form.url && getYouTubeThumbnail(form.url) && (
                  <div style={{ marginBottom:'16px', borderRadius:'8px', overflow:'hidden', height:'120px' }}>
                    <img src={getYouTubeThumbnail(form.url)!} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={lbl}>שם התרגיל *</label>
                    <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="לדוגמה: סקוואט מבוקר" />
                  </div>
                  <div>
                    <label style={lbl}>קישור YouTube *</label>
                    <input style={{...inp, direction:'ltr'}} value={form.url} onChange={e=>set('url',e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                  </div>
                  <div>
                    <label style={lbl}>קטגוריה</label>
                    <select style={inp} value={form.category} onChange={e=>set('category',e.target.value)}>
                      <option value="">בחר קטגוריה...</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Dosage */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                    <div>
                      <label style={lbl}>סטים</label>
                      <input style={inp} value={form.sets} onChange={e=>set('sets',e.target.value)} placeholder="3" />
                    </div>
                    <div>
                      <label style={lbl}>חזרות</label>
                      <input style={inp} value={form.reps} onChange={e=>set('reps',e.target.value)} placeholder="12" />
                    </div>
                    <div>
                      <label style={lbl}>החזקה (שנ')</label>
                      <input style={inp} value={form.hold_time} onChange={e=>set('hold_time',e.target.value)} placeholder="30" />
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>הוראות ביצוע בעברית</label>
                    <textarea value={form.instructions} onChange={e=>set('instructions',e.target.value)}
                      placeholder="לשמור על גב ניטרלי לאורך כל התנועה. לרדת לאט ולשלוט בתנועה. לעצור במידה ומופיע כאב חד."
                      style={{ ...inp, minHeight:'80px', resize:'vertical' as const }} />
                  </div>
                  <div>
                    <label style={lbl}>הערות למטפל</label>
                    <input style={inp} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="הערות פנימיות..." />
                  </div>
                </div>
              </div>

              <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:'8px' }}>
                <button onClick={()=>{setShowForm(false);resetForm()}} style={{ padding:'10px 16px', border:'1px solid #e2e8f0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>ביטול</button>
                <button onClick={save} disabled={saving} style={{ flex:1, padding:'10px', background:saving?'#94a3b8':'#1a3a5c', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'800', cursor:saving?'not-allowed':'pointer', fontFamily:'Heebo, sans-serif' }}>
                  {saving ? '⏳ שומר...' : '💾 שמור סרטון'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

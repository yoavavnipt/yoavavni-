'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const MAKE_WEBHOOK = 'https://hook.eu1.make.com/wl7puq7yr9wj39p7as225gut62t5911v'

type Post = {
  id: string
  title: string
  content_type: string
  platform: string
  caption: string
  hashtags: string
  image_url: string
  scheduled_date: string
  scheduled_time: string
  status: 'draft' | 'approved' | 'published' | 'cancelled'
  notes: string
  social_data: any
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  post:     { icon: '🖼️', label: 'פוסט',    color: '#3b82f6' },
  reel:     { icon: '🎬', label: 'רילס',    color: '#7c3aed' },
  story:    { icon: '📖', label: 'סטורי',   color: '#e8a020' },
  carousel: { icon: '🎠', label: 'קרוסל',   color: '#0b8a5e' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: 'טיוטה',   bg: '#f1f5f9', color: '#475569' },
  approved:  { label: '✅ מאושר', bg: '#d1fae5', color: '#065f46' },
  published: { label: '🚀 פורסם', bg: '#dbeafe', color: '#1e40af' },
  cancelled: { label: '❌ בוטל',  bg: '#fee2e2', color: '#dc2626' },
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export default function ContentCalendarPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [showForm, setShowForm] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = שבוע נוכחי
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', content_type: 'post', platform: 'instagram',
    caption: '', hashtags: '', scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00', notes: '', status: 'draft'
  })

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase.from('content_calendar').select('*').order('scheduled_date').order('scheduled_time')
    setPosts(data || [])
    setLoading(false)
  }

  async function addPost() {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('content_calendar').insert({ ...form })
    setForm({ title: '', content_type: 'post', platform: 'instagram', caption: '', hashtags: '', scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '09:00', notes: '', status: 'draft' })
    setShowForm(false)
    await loadPosts()
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('content_calendar').update({ status }).eq('id', id)
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p))
  }

  async function publishToMake(post: Post) {
    setPublishing(post.id)
    try {
      await fetch(MAKE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: post.content_type,
          caption: `${post.caption}\n\n${post.hashtags}`,
          title: post.title,
          image_url: post.image_url || '',
          scheduled_date: post.scheduled_date,
          scheduled_time: post.scheduled_time,
          platform: post.platform,
        })
      })
      await supabase.from('content_calendar').update({ status: 'published' }).eq('id', post.id)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published' } : p))
      await supabase.from('notifications').insert({ type: 'system', title: '🚀 תוכן פורסם', body: post.title, link: '/content-calendar' })
    } catch { alert('שגיאה בשליחה ל-Make') }
    setPublishing(null)
  }

  async function deletePost(id: string) {
    await supabase.from('content_calendar').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  // חישוב ימי השבוע
  function getWeekDays(weekOffset: number) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays(selectedWeek)
  const weekStart = weekDays[0].toISOString().split('T')[0]
  const weekEnd = weekDays[6].toISOString().split('T')[0]
  const weekPosts = posts.filter(p => p.scheduled_date >= weekStart && p.scheduled_date <= weekEnd)

  function getPostsForDay(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return weekPosts.filter(p => p.scheduled_date === dateStr)
  }

  const pendingApproval = posts.filter(p => p.status === 'draft').length
  const approvedThisWeek = weekPosts.filter(p => p.status === 'approved').length

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📅 לוח תוכן</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {pendingApproval > 0 && <span style={{ color: '#e8a020', fontWeight: '700' }}>{pendingApproval} ממתינים לאישור · </span>}
              {approvedThisWeek} מאושרים השבוע
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <button onClick={() => setView('calendar')} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: view === 'calendar' ? '700' : '400', background: view === 'calendar' ? '#1a3a5c' : 'transparent', color: view === 'calendar' ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>📅 לוח</button>
              <button onClick={() => setView('list')} style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: view === 'list' ? '700' : '400', background: view === 'list' ? '#1a3a5c' : 'transparent', color: view === 'list' ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>📋 רשימה</button>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {showForm ? '✕ ביטול' : '+ תוכן חדש'}
            </button>
          </div>
        </div>

        {/* טופס הוספה */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '14px' }}>➕ תוכן חדש</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>כותרת *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="נושא הפוסט..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>סוג</label>
                <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>פלטפורמה</label>
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }}>
                  <option value="instagram">📸 Instagram</option>
                  <option value="facebook">👤 Facebook</option>
                  <option value="both">📸👤 שניהם</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Caption</label>
              <textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="טקסט הפוסט..."
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>האשטאגים</label>
                <input value={form.hashtags} onChange={e => setForm({ ...form, hashtags: e.target.value })} placeholder="#פיזיותרפיה #יואבאבני..."
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך פרסום</label>
                <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>שעה</label>
                <input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={addPost} disabled={saving || !form.title.trim()}
              style={{ width: '100%', padding: '12px', background: saving || !form.title.trim() ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הוסף לוח תוכן'}
            </button>
          </div>
        )}

        {/* תצוגת לוח שבועי */}
        {view === 'calendar' && (
          <div>
            {/* ניווט שבועות */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button onClick={() => setSelectedWeek(w => w - 1)}
                style={{ padding: '8px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Heebo, sans-serif' }}>← שבוע קודם</button>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>
                {selectedWeek === 0 ? 'השבוע' : selectedWeek === 1 ? 'שבוע הבא' : selectedWeek === -1 ? 'שבוע שעבר' : `${weekDays[0].toLocaleDateString('he-IL')} — ${weekDays[6].toLocaleDateString('he-IL')}`}
              </div>
              <button onClick={() => setSelectedWeek(w => w + 1)}
                style={{ padding: '8px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Heebo, sans-serif' }}>שבוע הבא →</button>
            </div>

            {/* גריד שבועי */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {weekDays.map((day, i) => {
                const dayPosts = getPostsForDay(day)
                const isToday = day.toDateString() === new Date().toDateString()
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', border: isToday ? '2px solid #3eb8e5' : '1px solid #e2e8f0', minHeight: '140px' }}>
                    <div style={{ padding: '8px', background: isToday ? '#f0f9ff' : '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{DAYS_HE[day.getDay()]}</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: isToday ? '#3eb8e5' : '#1a3a5c' }}>{day.getDate()}</div>
                    </div>
                    <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {dayPosts.map(post => {
                        const tc = TYPE_CONFIG[post.content_type] || TYPE_CONFIG.post
                        const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
                        return (
                          <div key={post.id} style={{ padding: '4px 6px', borderRadius: '6px', background: sc.bg, border: `1px solid ${tc.color}30`, cursor: 'pointer' }}
                            title={`${post.title}\n${post.scheduled_time?.slice(0,5)}`}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#1a3a5c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tc.icon} {post.title}
                            </div>
                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>{post.scheduled_time?.slice(0,5)} · {sc.label}</div>
                          </div>
                        )
                      })}
                      {dayPosts.length === 0 && (
                        <div style={{ fontSize: '10px', color: '#e2e8f0', textAlign: 'center', paddingTop: '10px' }}>—</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* תצוגת רשימה */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div> :
              posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
                  <div>אין תוכן מתוכנן עדיין</div>
                </div>
              ) : posts.map(post => {
                const tc = TYPE_CONFIG[post.content_type] || TYPE_CONFIG.post
                const sc = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
                return (
                  <div key={post.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid #e2e8f0`, borderRight: `4px solid ${tc.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ fontSize: '24px', flexShrink: 0 }}>{tc.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>{post.title}</div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: sc.bg, color: sc.color }}>{sc.label}</span>
                          </div>
                        </div>
                        {post.caption && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', lineHeight: '1.5', maxHeight: '40px', overflow: 'hidden' }}>{post.caption}</div>}
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span>📅 {new Date(post.scheduled_date).toLocaleDateString('he-IL')} בשעה {post.scheduled_time?.slice(0,5)}</span>
                          <span>{post.platform === 'instagram' ? '📸' : post.platform === 'facebook' ? '👤' : '📸👤'} {post.platform}</span>
                          <span>{tc.label}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {post.status === 'draft' && (
                          <button onClick={() => updateStatus(post.id, 'approved')}
                            style={{ padding: '6px 12px', background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                            ✅ אשר
                          </button>
                        )}
                        {post.status === 'approved' && (
                          <button onClick={() => publishToMake(post)} disabled={publishing === post.id}
                            style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                            {publishing === post.id ? '⏳' : '🚀 פרסם'}
                          </button>
                        )}
                        {post.status !== 'published' && (
                          <button onClick={() => updateStatus(post.id, 'cancelled')}
                            style={{ padding: '6px 10px', background: '#fff', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                            ✕
                          </button>
                        )}
                        <button onClick={() => { if (confirm('למחוק?')) deletePost(post.id) }}
                          style={{ padding: '6px 10px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>🗑</button>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    </AppLayout>
  )
}

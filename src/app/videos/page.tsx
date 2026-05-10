'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['גב', 'צוואר', 'כתף', 'ברך', 'ירך', 'קרסול', 'ליבה', 'מתיחות', 'חיזוק', 'שיקום', 'הידרותרפיה', 'ריצה']

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [cat, search])

  async function load() {
    setLoading(true)
    let q = supabase.from('exercise_videos').select('*').order('title')
    if (cat) q = q.eq('category', cat)
    if (search) q = q.ilike('title', `%${search}%`)
    const { data } = await q
    setVideos(data || [])
    setLoading(false)
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>מאגר סרטוני תרגילים</h1>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{videos.length} סרטונים</div>
        </div>

        <input
          placeholder="🔍 חפש תרגיל..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 14px', marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }}
        />

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setCat('')} style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: !cat ? '700' : '400', background: !cat ? '#1a3a5c' : '#fff', color: !cat ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            הכל
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(cat === c ? '' : c)} style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: cat === c ? '700' : '400', background: cat === c ? '#1a3a5c' : '#fff', color: cat === c ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : videos.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
            <div>אין סרטונים בקטגוריה זו</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '12px' }}>
            {videos.map(v => (
              <div key={v.id} style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ background: '#1a3a5c', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                  🎬
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{v.title}</div>
                  {v.category && <span style={{ padding: '2px 8px', background: '#f0f4f8', borderRadius: '10px', fontSize: '10px', color: '#64748b' }}>{v.category}</span>}
                  {v.duration && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>⏱ {v.duration}</div>}
                  {v.url && (
                    <a href={v.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px', padding: '6px', background: '#1a3a5c', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textAlign: 'center' }}>
                      ▶ צפה
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

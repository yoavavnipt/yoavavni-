'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  title: string
  body?: string
  link?: string
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  message:  '💬',
  payment:  '💰',
  whatsapp: '📲',
  appointment: '📅',
  system:   '🔔',
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()

    // Realtime — כשמגיעה התראה חדשה
    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 30))
          // Push notification בדפדפן
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification((payload.new as Notification).title, {
              body: (payload.new as Notification).body || '',
              icon: '/logo.png',
            })
          }
        })
      .subscribe()

    // בקש הרשאה ל-Push
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { supabase.removeChannel(channel) }
  }, [])

  // סגור בלחיצה מחוץ
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30)
    setNotifications(data || [])
  }

  async function markRead(id: string, link?: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (link) { setOpen(false); router.push(link) }
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'עכשיו'
    if (diff < 3600) return `לפני ${Math.floor(diff/60)} דק'`
    if (diff < 86400) return `לפני ${Math.floor(diff/3600)} שע'`
    return d.toLocaleDateString('he-IL')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: '0', left: '0', background: '#dc2626', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: '0', width: '340px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 1000, marginTop: '8px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>
              🔔 התראות {unread > 0 && <span style={{ background: '#dc2626', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', marginRight: '4px' }}>{unread}</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#3eb8e5', fontWeight: '600', fontFamily: 'Heebo, sans-serif' }}>
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* רשימה */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <div>אין התראות</div>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => markRead(n.id, n.link)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: n.link ? 'pointer' : 'default', background: n.is_read ? '#fff' : '#f0f9ff', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                onMouseEnter={e => { if (n.link) e.currentTarget.style.background = '#e0f2fe' }}
                onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#f0f9ff'}>
                <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.is_read ? '500' : '700', fontSize: '13px', color: '#1a3a5c' }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>{n.body}</div>}
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{formatTime(n.created_at)}</div>
                </div>
                {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3eb8e5', flexShrink: 0, marginTop: '6px' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

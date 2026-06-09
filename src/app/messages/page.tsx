'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Message = {
  id: string
  patient_id: string
  sender_type: 'therapist' | 'patient'
  sender_name: string
  content: string
  is_read: boolean
  created_at: string
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  phone: string
  unread?: number
  last_message?: string
  last_message_time?: string
}

export default function MessagesPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadPatients() }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages(selected.id)
    // Realtime subscription
    const channel = supabase.channel(`messages:${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `patient_id=eq.${selected.id}` },
        payload => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadPatients() {
    setLoading(true)
    const { data: pats } = await supabase.from('patients').select('id,first_name,last_name,phone').eq('status', 'active').or('is_organization.is.null,is_organization.eq.false').order('first_name').limit(100)
    
    // טען הודעות אחרונות לכל מטופל
    const { data: msgs } = await supabase.from('messages').select('patient_id,content,created_at,is_read,sender_type').order('created_at', { ascending: false })

    const msgMap: Record<string, any> = {}
    ;(msgs || []).forEach(m => {
      if (!msgMap[m.patient_id]) {
        msgMap[m.patient_id] = { last_message: m.content, last_message_time: m.created_at, unread: 0 }
      }
      if (!m.is_read && m.sender_type === 'patient') msgMap[m.patient_id].unread++
    })

    const enriched = (pats || []).map(p => ({ ...p, ...msgMap[p.id] }))
    // מיין — קודם מי שיש לו הודעות
    enriched.sort((a, b) => {
      if (a.last_message_time && !b.last_message_time) return -1
      if (!a.last_message_time && b.last_message_time) return 1
      if (a.last_message_time && b.last_message_time) return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      return 0
    })
    setPatients(enriched)
    setLoading(false)
  }

  async function loadMessages(patientId: string) {
    const { data } = await supabase.from('messages').select('*').eq('patient_id', patientId).order('created_at')
    setMessages(data || [])
    // סמן כנקרא
    await supabase.from('messages').update({ is_read: true }).eq('patient_id', patientId).eq('sender_type', 'patient').eq('is_read', false)
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, unread: 0 } : p))
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected || sending) return
    setSending(true)
    const { data } = await supabase.from('messages').insert({
      patient_id: selected.id,
      sender_type: 'therapist',
      sender_name: 'יואב אבני',
      content: newMsg.trim(),
      is_read: false,
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setNewMsg('')
    // עדכן רשימה
    setPatients(prev => prev.map(p => p.id === selected.id ? { ...p, last_message: newMsg.trim(), last_message_time: new Date().toISOString() } : p))
    setSending(false)
  }

  const filtered = patients.filter(p => `${p.first_name} ${p.last_name} ${p.phone}`.includes(search))
  const totalUnread = patients.reduce((s, p) => s + (p.unread || 0), 0)

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: '100vh', direction: 'rtl', overflow: 'hidden' }}>
        {/* רשימת מטופלים */}
        <div style={{ width: '300px', flexShrink: 0, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', margin: 0 }}>
                💬 הודעות
                {totalUnread > 0 && <span style={{ marginRight: '8px', background: '#dc2626', color: '#fff', borderRadius: '20px', padding: '2px 8px', fontSize: '11px' }}>{totalUnread}</span>}
              </h2>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חפש מטופל..."
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div> :
              filtered.map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === p.id ? '#f0f9ff' : '#fff', borderBottom: '1px solid #f8fafc', borderRight: selected?.id === p.id ? '3px solid #3eb8e5' : '3px solid transparent' }}
                  onMouseEnter={e => { if (selected?.id !== p.id) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (selected?.id !== p.id) e.currentTarget.style.background = '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: p.unread ? '700' : '600', fontSize: '13px', color: '#1a3a5c' }}>{p.first_name} {p.last_name}</span>
                        {p.last_message_time && <span style={{ fontSize: '10px', color: '#94a3b8' }}>{formatTime(p.last_message_time)}</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {p.last_message || p.phone}
                        </span>
                        {(p.unread || 0) > 0 && <span style={{ background: '#3eb8e5', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>{p.unread}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* אזור הצ'אט */}
        {selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                {selected.first_name[0]}{selected.last_name[0]}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a3a5c' }}>{selected.first_name} {selected.last_name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{selected.phone}</div>
              </div>
              <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
                <a href={`https://wa.me/972${selected.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer"
                  style={{ padding: '6px 12px', background: '#25d366', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* הודעות */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                  <div>אין הודעות עדיין — שלח את הראשונה!</div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender_type === 'therapist' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: msg.sender_type === 'therapist' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: msg.sender_type === 'therapist' ? '#1a3a5c' : '#fff', color: msg.sender_type === 'therapist' ? '#fff' : '#1a3a5c', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{msg.content}</div>
                    <div style={{ fontSize: '10px', marginTop: '4px', color: msg.sender_type === 'therapist' ? 'rgba(255,255,255,0.6)' : '#94a3b8', textAlign: 'left' }}>{formatTime(msg.created_at)}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* שליחה */}
            <div style={{ padding: '14px 20px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="כתוב הודעה... (Enter לשליחה)"
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', resize: 'none', minHeight: '44px', maxHeight: '120px' }}
                rows={1} />
              <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
                style={{ padding: '10px 20px', background: newMsg.trim() ? '#1a3a5c' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: newMsg.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' }}>
                {sending ? '⏳' : '📤 שלח'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', color: '#94a3b8' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>בחר מטופל להתחלת שיחה</div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

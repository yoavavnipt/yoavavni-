'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Priority = 'high' | 'medium' | 'low'
type Todo = {
  id: string
  therapist_name: string
  title: string
  description?: string
  priority: Priority
  due_date?: string
  completed: boolean
  completed_at?: string
  created_at: string
}

const PRIORITY_CONFIG = {
  high:   { label: 'דחוף',   color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
  medium: { label: 'בינוני', color: '#e8a020', bg: '#fffbeb', icon: '🟡' },
  low:    { label: 'נמוך',   color: '#0b8a5e', bg: '#f0fdf4', icon: '🟢' },
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active')
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, due_date: '', therapist_name: 'יואב' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTodos() }, [])

  async function loadTodos() {
    setLoading(true)
    const { data } = await supabase.from('todo_items').select('*').order('completed').order('priority', { ascending: true }).order('created_at', { ascending: false })
    setTodos(data || [])
    setLoading(false)
  }

  async function addTodo() {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('todo_items').insert({ ...form, completed: false })
    setForm({ title: '', description: '', priority: 'medium', due_date: '', therapist_name: 'יואב' })
    setShowForm(false)
    await loadTodos()
    setSaving(false)
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from('todo_items').update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq('id', id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
  }

  async function deleteTodo(id: string) {
    await supabase.from('todo_items').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const activeCount = todos.filter(t => !t.completed).length
  const doneCount = todos.filter(t => t.completed).length
  const urgentCount = todos.filter(t => !t.completed && t.priority === 'high').length

  function isOverdue(due?: string) {
    if (!due) return false
    return new Date(due) < new Date(new Date().toDateString())
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl', maxWidth: '800px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>✅ משימות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {activeCount} פתוחות · {urgentCount > 0 ? <span style={{ color: '#dc2626', fontWeight: '700' }}>{urgentCount} דחופות</span> : '0 דחופות'} · {doneCount} הושלמו
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {showForm ? '✕ ביטול' : '+ משימה חדשה'}
          </button>
        </div>

        {/* טופס הוספה */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '14px' }}>➕ משימה חדשה</div>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="כותרת המשימה *"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }} />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="תיאור (אופציונלי)"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', marginBottom: '10px', outline: 'none', resize: 'vertical', minHeight: '70px', boxSizing: 'border-box' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>עדיפות</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }}>
                  <option value="high">🔴 דחוף</option>
                  <option value="medium">🟡 בינוני</option>
                  <option value="low">🟢 נמוך</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך יעד</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מטפל</label>
                <input value={form.therapist_name} onChange={e => setForm({ ...form, therapist_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={addTodo} disabled={saving || !form.title.trim()}
              style={{ width: '100%', padding: '12px', background: saving || !form.title.trim() ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הוסף משימה'}
            </button>
          </div>
        )}

        {/* פילטר */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
          {[
            { key: 'active', label: `פתוחות (${activeCount})` },
            { key: 'done',   label: `הושלמו (${doneCount})` },
            { key: 'all',    label: 'הכל' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: filter === f.key ? '700' : '400', background: filter === f.key ? '#1a3a5c' : 'transparent', color: filter === f.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* רשימת משימות */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{filter === 'done' ? '🎉' : '✅'}</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>{filter === 'done' ? 'אין משימות שהושלמו' : 'אין משימות פתוחות!'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(todo => {
              const p = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium
              const overdue = isOverdue(todo.due_date) && !todo.completed
              return (
                <div key={todo.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${overdue ? '#fca5a5' : '#e2e8f0'}`, opacity: todo.completed ? 0.65 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* checkbox */}
                    <button onClick={() => toggleTodo(todo.id, todo.completed)}
                      style={{ width: '24px', height: '24px', borderRadius: '6px', border: `2px solid ${todo.completed ? '#0b8a5e' : '#cbd5e1'}`, background: todo.completed ? '#0b8a5e' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      {todo.completed && <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: p.bg, color: p.color }}>{p.icon} {p.label}</span>
                        {overdue && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: '#fef2f2', color: '#dc2626' }}>⚠️ באיחור</span>}
                      </div>
                      {todo.description && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{todo.description}</div>}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                        {todo.due_date && <span>📅 {new Date(todo.due_date).toLocaleDateString('he-IL')}</span>}
                        {todo.therapist_name && <span>👤 {todo.therapist_name}</span>}
                        {todo.completed && todo.completed_at && <span>✅ הושלם {new Date(todo.completed_at).toLocaleDateString('he-IL')}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteTodo(todo.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '16px', padding: '2px', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

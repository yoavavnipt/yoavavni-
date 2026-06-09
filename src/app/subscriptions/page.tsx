'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Sub = {
  id: string
  patient_id: string
  type: 'card' | 'monthly'
  plan_name: string
  sessions_total?: number
  sessions_used: number
  start_date: string
  end_date?: string
  price: number
  status: 'active' | 'expired' | 'cancelled'
  notes?: string
  created_at: string
  patient?: { first_name: string; last_name: string; phone: string }
}

const PLANS = [
  { name: 'היברידי', type: 'monthly', price: 480 },
  { name: 'היברידי + קבוצת ריצה', type: 'monthly', price: 650 },
  { name: 'היברידי + קבוצת ריצה + 2 טיפולי התאוששות', type: 'monthly', price: 900 },
  { name: 'אימון קבוצתי (2-3 מתאמנים)', type: 'monthly', price: 380 },
  { name: 'כרטיסייה 10 טיפולים', type: 'card', price: 3150, sessions: 10 },
  { name: 'כרטיסייה 5 טיפולים', type: 'card', price: 1650, sessions: 5 },
]

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'active' | 'expired' | 'all'>('active')
  const [patients, setPatients] = useState<any[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [form, setForm] = useState({
    patient_id: '', plan_name: '', type: 'monthly' as 'card' | 'monthly',
    sessions_total: 0, price: 0, start_date: new Date().toISOString().split('T')[0],
    end_date: '', notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('subscriptions')
      .select('*, patient:patients(first_name,last_name,phone)')
      .order('created_at', { ascending: false })
    
    // עדכן סטטוס פגי תוקף
    const today = new Date().toDateString()
    const updated = (data || []).map(s => ({
      ...s,
      status: s.status === 'active' && s.end_date && new Date(s.end_date) < new Date(today) ? 'expired' : s.status
    }))
    setSubs(updated)

    const { data: pats } = await supabase.from('patients').select('id,first_name,last_name,phone').eq('status', 'active').order('first_name')
    setPatients(pats || [])
    setLoading(false)
  }

  function selectPlan(plan: typeof PLANS[0]) {
    setForm(f => ({
      ...f, plan_name: plan.name, type: plan.type as any,
      price: plan.price, sessions_total: plan.sessions || 0,
      end_date: plan.type === 'monthly' ? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] : ''
    }))
  }

  async function addSub() {
    if (!form.patient_id || !form.plan_name) return
    setSaving(true)
    await supabase.from('subscriptions').insert({
      patient_id: form.patient_id,
      type: form.type,
      plan_name: form.plan_name,
      sessions_total: form.type === 'card' ? form.sessions_total : null,
      sessions_used: 0,
      start_date: form.start_date,
      end_date: form.end_date || null,
      price: form.price,
      status: 'active',
      notes: form.notes || null,
    })
    // התראה
    await supabase.from('notifications').insert({
      type: 'system',
      title: 'מנוי/כרטיסייה חדשה',
      body: `${patients.find(p => p.id === form.patient_id)?.first_name} — ${form.plan_name}`,
      link: '/subscriptions'
    })
    setShowForm(false)
    setForm({ patient_id: '', plan_name: '', type: 'monthly', sessions_total: 0, price: 0, start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' })
    await loadData()
    setSaving(false)
  }

  async function useSession(id: string, used: number, total?: number) {
    const newUsed = used + 1
    const newStatus = total && newUsed >= total ? 'expired' : 'active'
    await supabase.from('subscriptions').update({ sessions_used: newUsed, status: newStatus }).eq('id', id)
    if (total && newUsed >= total - 1) {
      await supabase.from('notifications').insert({
        type: 'payment', title: '⚠️ כרטיסייה עומדת להסתיים', body: `נותרו ${total - newUsed} טיפולים`, link: '/subscriptions'
      })
    }
    await loadData()
  }

  async function cancelSub(id: string) {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id)
    await loadData()
  }

  const filtered = subs.filter(s => filter === 'all' ? true : s.status === filter)
  const expiringThisMonth = subs.filter(s => s.status === 'active' && s.end_date && new Date(s.end_date) <= new Date(new Date().setDate(new Date().getDate() + 7)))
  const filteredPatients = patients.filter(p => `${p.first_name} ${p.last_name}`.includes(patientSearch))

  function daysLeft(end?: string) {
    if (!end) return null
    const diff = Math.ceil((new Date(end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🎫 מנויים וכרטיסיות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {subs.filter(s => s.status === 'active').length} פעילים
              {expiringThisMonth.length > 0 && <span style={{ color: '#e8a020', fontWeight: '700' }}> · {expiringThisMonth.length} פגים בשבוע הקרוב</span>}
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {showForm ? '✕ ביטול' : '+ מנוי חדש'}
          </button>
        </div>

        {/* התראות פגי תוקף */}
        {expiringThisMonth.length > 0 && (
          <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>⚠️ פגים בשבוע הקרוב</div>
            {expiringThisMonth.map(s => (
              <div key={s.id} style={{ fontSize: '12px', color: '#92400e', marginBottom: '2px' }}>
                {(s.patient as any)?.first_name} {(s.patient as any)?.last_name} — {s.plan_name} ({daysLeft(s.end_date)} ימים)
              </div>
            ))}
          </div>
        )}

        {/* טופס הוספה */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '14px' }}>➕ מנוי / כרטיסייה חדשה</div>

            {/* בחר מטופל */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מטופל *</label>
              <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="חפש מטופל..."
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box', marginBottom: '6px' }} />
              {patientSearch && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {filteredPatients.slice(0, 8).map(p => (
                    <div key={p.id} onClick={() => { setForm(f => ({ ...f, patient_id: p.id })); setPatientSearch(`${p.first_name} ${p.last_name}`) }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f8fafc', background: form.patient_id === p.id ? '#f0f9ff' : '#fff' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = form.patient_id === p.id ? '#f0f9ff' : '#fff'}>
                      {p.first_name} {p.last_name} · {p.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* תוכניות מוכנות */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>בחר תוכנית</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PLANS.map((plan, i) => (
                  <div key={i} onClick={() => selectPlan(plan)}
                    style={{ padding: '10px 12px', border: `2px solid ${form.plan_name === plan.name ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', background: form.plan_name === plan.name ? '#f0f9ff' : '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a3a5c', marginBottom: '4px' }}>{plan.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>₪{plan.price} · {plan.type === 'monthly' ? 'חודשי' : `${plan.sessions} טיפולים`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך התחלה</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך סיום</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מחיר ₪</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="הערות (אופציונלי)"
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', resize: 'vertical', minHeight: '60px', marginBottom: '12px', boxSizing: 'border-box' }} />
            <button onClick={addSub} disabled={saving || !form.patient_id || !form.plan_name}
              style={{ width: '100%', padding: '12px', background: saving || !form.patient_id || !form.plan_name ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הוסף'}
            </button>
          </div>
        )}

        {/* פילטר */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px' }}>
          {[{ key: 'active', label: `פעילים (${subs.filter(s => s.status === 'active').length})` }, { key: 'expired', label: `פגו תוקף (${subs.filter(s => s.status === 'expired').length})` }, { key: 'all', label: 'הכל' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: filter === f.key ? '700' : '400', background: filter === f.key ? '#1a3a5c' : 'transparent', color: filter === f.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* רשימה */}
        {loading ? <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div> :
          filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎫</div>
              <div>אין מנויים</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(s => {
                const days = daysLeft(s.end_date)
                const isExpiring = days !== null && days <= 7 && days >= 0 && s.status === 'active'
                const sessionsLeft = s.sessions_total ? s.sessions_total - s.sessions_used : null
                return (
                  <div key={s.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${isExpiring ? '#fde68a' : s.status === 'expired' ? '#fca5a5' : '#e2e8f0'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ fontSize: '28px' }}>{s.type === 'card' ? '🎫' : '📅'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>{(s.patient as any)?.first_name} {(s.patient as any)?.last_name}</div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>{s.plan_name}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.status === 'active' ? '#f0fdf4' : s.status === 'expired' ? '#fef2f2' : '#f8fafc', color: s.status === 'active' ? '#0b8a5e' : s.status === 'expired' ? '#dc2626' : '#64748b' }}>
                              {s.status === 'active' ? '✅ פעיל' : s.status === 'expired' ? '❌ פג תוקף' : '⏹ בוטל'}
                            </span>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>₪{s.price.toLocaleString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span>📅 {new Date(s.start_date).toLocaleDateString('he-IL')}{s.end_date ? ` — ${new Date(s.end_date).toLocaleDateString('he-IL')}` : ''}</span>
                          {days !== null && s.status === 'active' && <span style={{ color: isExpiring ? '#e8a020' : '#94a3b8', fontWeight: isExpiring ? '700' : '400' }}>{isExpiring ? `⚠️ ${days} ימים` : `${days} ימים`}</span>}
                          {s.type === 'card' && s.sessions_total && <span style={{ color: sessionsLeft === 0 ? '#dc2626' : sessionsLeft && sessionsLeft <= 2 ? '#e8a020' : '#94a3b8', fontWeight: '600' }}>🎫 {s.sessions_used}/{s.sessions_total} טיפולים</span>}
                          {(s.patient as any)?.phone && <span>📞 {(s.patient as any)?.phone}</span>}
                        </div>
                        {s.type === 'card' && s.sessions_total && (
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: sessionsLeft === 0 ? '#dc2626' : sessionsLeft && sessionsLeft <= 2 ? '#e8a020' : '#0b8a5e', width: `${(s.sessions_used / s.sessions_total) * 100}%`, borderRadius: '4px', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        )}
                        {s.notes && <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>{s.notes}</div>}
                        {s.status === 'active' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {s.type === 'card' && s.sessions_total && (
                              <button onClick={() => useSession(s.id, s.sessions_used, s.sessions_total)}
                                style={{ padding: '6px 14px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                                ✂️ נצל טיפול
                              </button>
                            )}
                            <button onClick={() => cancelSub(s.id)}
                              style={{ padding: '6px 14px', background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                              ביטול
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </AppLayout>
  )
}

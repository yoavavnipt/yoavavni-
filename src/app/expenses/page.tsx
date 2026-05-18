'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  'רכב', 'חשמל', 'ציוד מתכלה', 'שיווק', 'רו"ח',
  'כיבוד', 'קורסים והשתלמויות', 'קבלני משנה', 'טרנזילה',
  'ביטוחים', 'בזק', 'בריכה גילון', 'חוצה צפון',
  'כביש 6', 'מנהרות הכרמל', 'אחריות מקצועית', 'אחר'
]

const PAYMENT_METHODS = ['העברה בנקאית', 'כרטיס אשראי', 'מזומן', 'ביט', 'פייבוקס', 'הוראת קבע']

const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', background: '#fff' } as const
const lbl = { display: 'block' as const, fontSize: '11px', fontWeight: '700' as const, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' as const }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [filterCategory, setFilterCategory] = useState('')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    vat_amount: '',
    payment_method: 'העברה בנקאית',
    supplier: '',
    notes: '',
  })

  useEffect(() => { load() }, [filterMonth, filterCategory])

  async function load() {
    setLoading(true)
    const start = `${filterMonth}-01`
    const end = `${filterMonth}-31`
    let q = supabase.from('expenses').select('*').gte('date', start).lte('date', end).order('date', { ascending: false })
    if (filterCategory) q = q.eq('category', filterCategory)
    const { data } = await q
    setExpenses(data || [])
    setLoading(false)
  }

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  function autoCalcVat(amount: string) {
    const num = parseFloat(amount)
    if (!isNaN(num)) {
      const vat = Math.round((num / 1.18) * 0.18 * 100) / 100
      setForm(p => ({ ...p, amount, vat_amount: vat.toString() }))
    } else {
      set('amount', amount)
    }
  }

  async function save() {
    if (!form.category || !form.amount || !form.date) { alert('יש למלא קטגוריה, סכום ותאריך'); return }
    setSaving(true)
    await supabase.from('expenses').insert([{
      ...form,
      amount: parseFloat(form.amount),
      vat_amount: parseFloat(form.vat_amount || '0'),
    }])
    setSaving(false)
    setShowForm(false)
    setForm({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', vat_amount: '', payment_method: 'העברה בנקאית', supplier: '', notes: '' })
    load()
  }

  async function deleteExpense(id: string) {
    if (!confirm('למחוק הוצאה זו?')) return
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalVat = expenses.reduce((s, e) => s + (e.vat_amount || 0), 0)

  // Group by category
  const byCategory = expenses.reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0)
    return acc
  }, {})

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>💸 ניהול הוצאות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{expenses.length} הוצאות</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
              style={{ ...inp, width: 'auto', fontSize: '12px' }} />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ ...inp, width: 'auto', fontSize: '12px' }}>
              <option value="">כל הקטגוריות</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => setShowForm(true)} style={{ padding: '9px 16px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              + הוצאה חדשה
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'סה"כ הוצאות', value: `₪${totalAmount.toLocaleString()}`, icon: '💸', color: '#dc2626' },
            { label: 'מע"מ מוכר', value: `₪${totalVat.toLocaleString()}`, icon: '🧾', color: '#7c3aed' },
            { label: 'קטגוריות', value: Object.keys(byCategory).length, icon: '📂', color: '#0891b2' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: '10px', padding: '14px', borderRight: `3px solid ${k.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{k.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a3a5c' }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: '700', fontSize: '13px', color: '#1a3a5c', marginBottom: '12px' }}>📊 לפי קטגוריה</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(byCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amt]: any) => (
                <div key={cat} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px' }}>
                  <div style={{ fontWeight: '700', color: '#1a3a5c' }}>{cat}</div>
                  <div style={{ color: '#dc2626', fontWeight: '600' }}>₪{amt.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses list */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : expenses.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💸</div>
              <div>אין הוצאות בתקופה זו</div>
            </div>
          ) : expenses.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < expenses.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>{e.category}</span>
                  {e.supplier && <span style={{ fontSize: '11px', color: '#94a3b8' }}>· {e.supplier}</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {new Date(e.date).toLocaleDateString('he-IL')}
                  {e.description && ` · ${e.description}`}
                  {e.payment_method && ` · ${e.payment_method}`}
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626' }}>₪{(e.amount || 0).toLocaleString()}</div>
                {e.vat_amount > 0 && <div style={{ fontSize: '10px', color: '#94a3b8' }}>מע"מ: ₪{e.vat_amount}</div>}
              </div>
              <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', padding: '4px' }}>🗑</button>
            </div>
          ))}
        </div>

        {/* Modal Form */}
        {showForm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '16px 20px', background: '#1a3a5c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>💸 הוצאה חדשה</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontFamily: 'Heebo, sans-serif' }}>×</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>תאריך *</label>
                    <input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>קטגוריה *</label>
                    <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">בחר...</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>ספק / שם</label>
                  <input style={inp} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="בזק, כביש 6, רו&quot;ח..." />
                </div>
                <div>
                  <label style={lbl}>תיאור</label>
                  <input style={inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="חשבון חודשי, ציוד..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>סכום כולל מע"מ *</label>
                    <input type="number" style={inp} value={form.amount} onChange={e => autoCalcVat(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label style={lbl}>מע"מ מוכר (18%)</label>
                    <input type="number" style={inp} value={form.vat_amount} onChange={e => set('vat_amount', e.target.value)} placeholder="מחושב אוטומטית" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>אמצעי תשלום</label>
                  <select style={inp} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>הערות</label>
                  <input style={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="הערות נוספות..." />
                </div>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                  {saving ? '⏳ שומר...' : '💾 שמור הוצאה'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

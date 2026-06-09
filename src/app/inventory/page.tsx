'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Item = {
  id: string
  name: string
  category: string
  price: number
  cost_price: number
  quantity: number
  min_quantity: number
  supplier: string
  notes: string
  is_active: boolean
}

const INITIAL_ITEMS = [
  { name: 'קינזיוטייפ', category: 'טייפינג', price: 80, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'קובן', category: 'טייפינג', price: 40, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'טייפ ריגידי', category: 'טייפינג', price: 40, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'היפופיקס', category: 'טייפינג', price: 55, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'פריטייפ', category: 'טייפינג', price: 20, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'מגן מרפק טניס אלבו', category: 'מגנים ותמיכות', price: 200, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מגן ברך לגיד פיקה', category: 'מגנים ותמיכות', price: 150, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מגן קרסול', category: 'מגנים ותמיכות', price: 400, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מגן שוק', category: 'מגנים ותמיכות', price: 220, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מגן ברך טבעת סיליקון', category: 'מגנים ותמיכות', price: 300, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מגן ירך', category: 'מגנים ותמיכות', price: 220, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'רצועת מאליגן', category: 'מגנים ותמיכות', price: 120, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מדרס אסטרק', category: 'מדרסים', price: 500, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'מדרס מותאם אישית', category: 'מדרסים', price: 1500, cost_price: 0, quantity: 3, min_quantity: 1, supplier: '' },
  { name: 'סיליקון לצלקת', category: 'טיפול', price: 150, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'אנדורה', category: 'טיפול', price: 85, cost_price: 0, quantity: 5, min_quantity: 2, supplier: '' },
  { name: 'גומיות', category: 'ציוד', price: 100, cost_price: 0, quantity: 10, min_quantity: 3, supplier: '' },
  { name: 'אקדח עיסוי', category: 'ציוד', price: 480, cost_price: 0, quantity: 2, min_quantity: 1, supplier: '' },
  { name: 'מיטת טיפול', category: 'ציוד', price: 750, cost_price: 0, quantity: 1, min_quantity: 1, supplier: '' },
  { name: 'מכשיר חשמל וחימום', category: 'ציוד', price: 240, cost_price: 0, quantity: 2, min_quantity: 1, supplier: '' },
]

const CATEGORIES = ['הכל', 'טייפינג', 'מגנים ותמיכות', 'מדרסים', 'טיפול', 'ציוד', 'כללי']

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'כללי', price: 0, cost_price: 0,
    quantity: 0, min_quantity: 2, supplier: '', notes: ''
  })

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setLoading(true)
    const { data } = await supabase.from('inventory_items').select('*').eq('is_active', true).order('category').order('name')
    setItems(data || [])
    setLoading(false)
  }

  async function initializeItems() {
    setInitializing(true)
    for (const item of INITIAL_ITEMS) {
      await supabase.from('inventory_items').insert({ ...item, is_active: true, notes: '' })
    }
    await loadItems()
    setInitializing(false)
  }

  async function addItem() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('inventory_items').insert({ ...form, is_active: true })
    setForm({ name: '', category: 'כללי', price: 0, cost_price: 0, quantity: 0, min_quantity: 2, supplier: '', notes: '' })
    setShowForm(false)
    await loadItems()
    setSaving(false)
  }

  async function updateQuantity(id: string, delta: number, currentQty: number) {
    const newQty = Math.max(0, currentQty + delta)
    await supabase.from('inventory_items').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('inventory_transactions').insert({ item_id: id, type: delta > 0 ? 'in' : 'out', quantity: Math.abs(delta), notes: delta > 0 ? 'הוספה ידנית' : 'הוצאה ידנית' })
    // התראה אם מתחת למינימום
    const item = items.find(i => i.id === id)
    if (item && newQty <= item.min_quantity && newQty > 0) {
      await supabase.from('notifications').insert({ type: 'system', title: `⚠️ מלאי נמוך: ${item.name}`, body: `נותרו ${newQty} יחידות (מינימום: ${item.min_quantity})`, link: '/inventory' })
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i))
  }

  async function deleteItem(id: string) {
    await supabase.from('inventory_items').update({ is_active: false }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => {
    if (filter !== 'הכל' && i.category !== filter) return false
    if (search && !i.name.includes(search)) return false
    if (showLowOnly && i.quantity > i.min_quantity) return false
    return true
  })

  const lowItems = items.filter(i => i.quantity <= i.min_quantity)
  const totalValue = items.reduce((s, i) => s + i.price * i.quantity, 0)

  function buildOrderList() {
    const low = items.filter(i => i.quantity <= i.min_quantity)
    if (low.length === 0) { alert('אין פריטים שצריכים הזמנה'); return }
    const list = low.map(i => `• ${i.name} — נותרו ${i.quantity} (מינימום ${i.min_quantity})${i.supplier ? ` | ספק: ${i.supplier}` : ''}`).join('\n')
    const text = `רשימת הזמנה — קליניקת יואב אבני\n${new Date().toLocaleDateString('he-IL')}\n\n${list}`
    navigator.clipboard.writeText(text)
    alert('רשימת הזמנה הועתקה ללוח!')
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📦 מלאי</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {items.length} פריטים · שווי: ₪{totalValue.toLocaleString()}
              {lowItems.length > 0 && <span style={{ color: '#dc2626', fontWeight: '700' }}> · {lowItems.length} במלאי נמוך</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {items.length === 0 && (
              <button onClick={initializeItems} disabled={initializing}
                style={{ padding: '10px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {initializing ? '⏳ טוען...' : '🚀 טען מוצרים'}
              </button>
            )}
            {lowItems.length > 0 && (
              <button onClick={buildOrderList}
                style={{ padding: '10px 16px', background: '#e8a020', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                📋 צור רשימת הזמנה
              </button>
            )}
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {showForm ? '✕ ביטול' : '+ פריט חדש'}
            </button>
          </div>
        </div>

        {/* התראת מלאי נמוך */}
        {lowItems.length > 0 && (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #fca5a5' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>⚠️ מלאי נמוך — דרוש הזמנה</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {lowItems.map(i => (
                <span key={i.id} style={{ padding: '3px 10px', background: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#dc2626', border: '1px solid #fca5a5' }}>
                  {i.name} ({i.quantity})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* טופס הוספה */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '14px' }}>➕ פריט חדש</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>שם הפריט *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>קטגוריה</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none' }}>
                  {CATEGORIES.filter(c => c !== 'הכל').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מחיר מכירה ₪</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>כמות</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>מינימום</label>
                <input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: +e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>עלות ₪</label>
                <input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: +e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>ספק</label>
                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={addItem} disabled={saving || !form.name.trim()}
              style={{ width: '100%', padding: '12px', background: saving || !form.name.trim() ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הוסף פריט'}
            </button>
          </div>
        )}

        {/* סינון */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חפש פריט..."
            style={{ padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', width: '180px' }} />
          <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: filter === c ? '700' : '400', background: filter === c ? '#1a3a5c' : 'transparent', color: filter === c ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' }}>
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLowOnly(!showLowOnly)}
            style={{ padding: '8px 14px', background: showLowOnly ? '#fef2f2' : '#fff', color: showLowOnly ? '#dc2626' : '#64748b', border: `1px solid ${showLowOnly ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {showLowOnly ? '⚠️ מלאי נמוך' : '⚠️ הצג נמוך בלבד'}
          </button>
        </div>

        {/* טבלת מלאי */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            {items.length === 0 ? (
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>אין פריטים במלאי</div>
                <button onClick={initializeItems} disabled={initializing}
                  style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                  {initializing ? '⏳ טוען...' : '🚀 טען מוצרים קיימים'}
                </button>
              </div>
            ) : <div>לא נמצאו פריטים</div>}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* כותרת טבלה */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 40px', gap: '8px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
              <span>פריט</span>
              <span>מחיר</span>
              <span>כמות</span>
              <span>שווי</span>
              <span style={{ textAlign: 'center' }}>פעולות</span>
              <span></span>
            </div>
            {filtered.map((item, i) => {
              const isLow = item.quantity <= item.min_quantity
              const isEmpty = item.quantity === 0
              return (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 40px', gap: '8px', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', background: isEmpty ? '#fef2f2' : isLow ? '#fffbeb' : '#fff', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {item.category}
                      {item.supplier && ` · ${item.supplier}`}
                      {isLow && !isEmpty && <span style={{ color: '#e8a020', fontWeight: '700' }}> · מלאי נמוך!</span>}
                      {isEmpty && <span style={{ color: '#dc2626', fontWeight: '700' }}> · נגמר!</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0b8a5e' }}>₪{item.price}</div>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: isEmpty ? '#dc2626' : isLow ? '#e8a020' : '#1a3a5c' }}>{item.quantity}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}> / מינ׳ {item.min_quantity}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>₪{(item.price * item.quantity).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button onClick={() => updateQuantity(item.id, -1, item.quantity)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>−</button>
                    <button onClick={() => updateQuantity(item.id, 1, item.quantity)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b8a5e' }}>+</button>
                    <button onClick={() => { const qty = prompt(`כמות חדשה עבור ${item.name}:`); if (qty && !isNaN(+qty)) updateQuantity(item.id, +qty - item.quantity, item.quantity) }}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✏️</button>
                  </div>
                  <button onClick={() => { if (confirm(`למחוק ${item.name}?`)) deleteItem(item.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '14px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

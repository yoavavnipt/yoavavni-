'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  { id: 'all',        label: 'הכל' },
  { id: 'general',    label: 'כללי' },
  { id: 'braces',     label: 'מגנים וסדים' },
  { id: 'taping',     label: 'טייפינג' },
  { id: 'equipment',  label: 'ציוד' },
  { id: 'insoles',    label: 'מדרסים' },
  { id: 'other',      label: 'אחר' },
]

const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'rtl' as const }

// מוצרים ראשוניים מ-Wix
const INITIAL_PRODUCTS = [
  { name: 'קינזיוטייפ', description: '', price: 80, category: 'taping' },
  { name: 'מגן מרפק טניס אלבו', description: '', price: 200, category: 'braces' },
  { name: 'מגן ברך לגיד הפיקה', description: '', price: 150, category: 'braces' },
  { name: 'מגן קרסול', description: '', price: 400, category: 'braces' },
  { name: 'מגן שוק', description: '', price: 220, category: 'braces' },
  { name: 'קובן', description: '', price: 40, category: 'taping' },
  { name: 'ציוד חבישה וטיפול', description: '', price: 2120, category: 'equipment' },
  { name: 'טייף ריגידי', description: '', price: 40, category: 'taping' },
  { name: 'היפופיקס', description: '', price: 55, category: 'taping' },
  { name: 'רצועות מאליגן', description: '', price: 120, category: 'equipment' },
  { name: 'פריטייף', description: 'פריטייף', price: 20, category: 'taping' },
  { name: 'מיטת טיפול', description: 'מיטת טיפול', price: 750, category: 'equipment' },
  { name: 'מכשיר חשמל וחימום', description: 'מכשיר חשמל וחימום', price: 240, category: 'equipment' },
  { name: 'גומיות', description: '3 גומיות בסט ממותג', price: 100, category: 'equipment' },
  { name: 'ערכת כף יד ואצבעות', description: '', price: 50, category: 'braces' },
  { name: 'מדרגה אירובית', description: '', price: 120, category: 'equipment' },
  { name: 'אקדח עיסוי', description: '', price: 480, category: 'equipment' },
  { name: 'מגן ברך טבעת סיליקון', description: '', price: 300, category: 'braces' },
  { name: 'מדרס אסטרק', description: '', price: 500, category: 'insoles' },
  { name: 'מדרס מותאם אישית', description: '', price: 1500, category: 'insoles' },
  { name: 'סיליקון לצלקות', description: '', price: 150, category: 'other' },
  { name: 'אנדורה', description: '', price: 85, category: 'other' },
  { name: 'ניתוח מדרסים', description: '', price: 150, category: 'insoles' },
  { name: 'מגן ירך', description: '', price: 220, category: 'braces' },
  { name: 'השכרת חגורת גב', description: '', price: 200, category: 'braces' },
  { name: 'ריצה היברידית', description: '', price: 650, category: 'other' },
]

const INITIAL_PACKAGES = [
  { name: 'חבילת 5 טיפולים', sessions: 5, price: 1700 },
  { name: 'חבילת 10 טיפולים', sessions: 10, price: 3300 },
]

export default function ProductsPage() {
  const [tab, setTab] = useState<'products' | 'packages'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')

  // טופס מוצר
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: 'general' })
  const [savingProduct, setSavingProduct] = useState(false)

  // טופס כרטיסייה
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [packageForm, setPackageForm] = useState({ name: '', sessions: '', price: '' })
  const [savingPackage, setSavingPackage] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: p }, { data: k }] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('treatment_packages').select('*').eq('is_active', true).order('sessions'),
    ])

    // אם אין מוצרים — ייבא ראשוניים
    if ((p || []).length === 0) {
      await supabase.from('products').insert(INITIAL_PRODUCTS)
      const { data: p2 } = await supabase.from('products').select('*').eq('is_active', true).order('name')
      setProducts(p2 || [])
    } else {
      setProducts(p || [])
    }

    // אם אין כרטיסיות — ייבא ראשוניות
    if ((k || []).length === 0) {
      await supabase.from('treatment_packages').insert(INITIAL_PACKAGES)
      const { data: k2 } = await supabase.from('treatment_packages').select('*').eq('is_active', true).order('sessions')
      setPackages(k2 || [])
    } else {
      setPackages(k || [])
    }

    setLoading(false)
  }

  // ── מוצרים ──
  function openNewProduct() {
    setEditingProduct(null)
    setProductForm({ name: '', description: '', price: '', category: 'general' })
    setShowProductForm(true)
  }

  function openEditProduct(p: any) {
    setEditingProduct(p)
    setProductForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category || 'general' })
    setShowProductForm(true)
  }

  async function saveProduct() {
    if (!productForm.name || !productForm.price) return
    setSavingProduct(true)
    const data = { name: productForm.name, description: productForm.description, price: Number(productForm.price), category: productForm.category }
    if (editingProduct) {
      await supabase.from('products').update(data).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert([data])
    }
    setSavingProduct(false)
    setShowProductForm(false)
    loadAll()
  }

  async function deleteProduct(id: string) {
    if (!confirm('למחוק מוצר זה?')) return
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    loadAll()
  }

  // ── כרטיסיות ──
  function openNewPackage() {
    setEditingPackage(null)
    setPackageForm({ name: '', sessions: '', price: '' })
    setShowPackageForm(true)
  }

  function openEditPackage(k: any) {
    setEditingPackage(k)
    setPackageForm({ name: k.name, sessions: String(k.sessions), price: String(k.price) })
    setShowPackageForm(true)
  }

  async function savePackage() {
    if (!packageForm.name || !packageForm.sessions || !packageForm.price) return
    setSavingPackage(true)
    const data = { name: packageForm.name, sessions: Number(packageForm.sessions), price: Number(packageForm.price) }
    if (editingPackage) {
      await supabase.from('treatment_packages').update(data).eq('id', editingPackage.id)
    } else {
      await supabase.from('treatment_packages').insert([data])
    }
    setSavingPackage(false)
    setShowPackageForm(false)
    loadAll()
  }

  async function deletePackage(id: string) {
    if (!confirm('למחוק כרטיסייה זו?')) return
    await supabase.from('treatment_packages').update({ is_active: false }).eq('id', id)
    loadAll()
  }

  const filteredProducts = products.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    const matchSearch = search === '' || p.name.includes(search) || p.description?.includes(search)
    return matchCat && matchSearch
  })

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🛒 מוצרים וכרטיסיות</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>ניהול ציוד, מגנים וחבילות טיפולים</p>
          </div>
          <button onClick={tab === 'products' ? openNewProduct : openNewPackage} style={{ padding: '9px 18px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            + {tab === 'products' ? 'מוצר חדש' : 'כרטיסייה חדשה'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', width: 'fit-content' }}>
          {[{ key: 'products', label: '🛍️ מוצרים' }, { key: 'packages', label: '🎫 כרטיסיות טיפולים' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ padding: '9px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? '700' : '400', background: tab === t.key ? '#1a3a5c' : 'transparent', color: tab === t.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>{t.label}</button>
          ))}
        </div>

        {/* ── מוצרים ── */}
        {tab === 'products' && (
          <>
            {/* חיפוש + קטגוריה */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input placeholder="🔍 חפש מוצר..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
              <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategoryFilter(c.id)} style={{ padding: '9px 12px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: categoryFilter === c.id ? '700' : '400', background: categoryFilter === c.id ? '#1a3a5c' : 'transparent', color: categoryFilter === c.id ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>{c.label}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      {['שם מוצר', 'תיאור', 'קטגוריה', 'מחיר', 'פעולות'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1a3a5c' }}>{p.name}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                            {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0b8a5e' }}>₪{p.price.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEditProduct(p)} style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#1e293b', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: '#fff', fontFamily: 'Heebo, sans-serif' }}>✏️ עריכה</button>
                            <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{filteredProducts.length} מוצרים</span>
                  <span>סה"כ ערך מלאי: ₪{filteredProducts.reduce((s, p) => s + p.price, 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── כרטיסיות ── */}
        {tab === 'packages' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
            ) : packages.map(k => (
              <div key={k.id} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '2px solid #e2e8f0', position: 'relative' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎫</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', marginBottom: '6px' }}>{k.name}</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>{k.sessions} טיפולים</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#0b8a5e', marginBottom: '4px' }}>₪{k.price.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>₪{Math.round(k.price / k.sessions).toLocaleString()} לטיפול</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditPackage(k)} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>✏️ עריכה</button>
                  <button onClick={() => deletePackage(k.id)} style={{ padding: '8px 12px', background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🗑️</button>
                </div>
              </div>
            ))}
            {/* כרטיסיית הוספה */}
            <div onClick={openNewPackage} style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '2px dashed #cbd5e1', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>+</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>כרטיסייה חדשה</div>
            </div>
          </div>
        )}

        {/* ── פאנל מוצר ── */}
        {showProductForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowProductForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>{editingProduct ? '✏️ עריכת מוצר' : '+ מוצר חדש'}</div>
                <button onClick={() => setShowProductForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>שם מוצר *</label>
                  <input style={inp} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="שם המוצר" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תיאור</label>
                  <input style={inp} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} placeholder="תיאור קצר" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>מחיר ₪ *</label>
                    <input style={inp} type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>קטגוריה</label>
                    <select style={inp} value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={saveProduct} disabled={savingProduct || !productForm.name || !productForm.price} style={{ width: '100%', padding: '13px', background: (!productForm.name || !productForm.price) ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '4px' }}>
                  {savingProduct ? '⏳ שומר...' : '💾 שמור'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── פאנל כרטיסייה ── */}
        {showPackageForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPackageForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>{editingPackage ? '✏️ עריכת כרטיסייה' : '+ כרטיסייה חדשה'}</div>
                <button onClick={() => setShowPackageForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>שם הכרטיסייה *</label>
                  <input style={inp} value={packageForm.name} onChange={e => setPackageForm(p => ({ ...p, name: e.target.value }))} placeholder="חבילת 10 טיפולים" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>מספר טיפולים *</label>
                    <input style={inp} type="number" value={packageForm.sessions} onChange={e => setPackageForm(p => ({ ...p, sessions: e.target.value }))} placeholder="10" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>מחיר כולל ₪ *</label>
                    <input style={inp} type="number" value={packageForm.price} onChange={e => setPackageForm(p => ({ ...p, price: e.target.value }))} placeholder="3300" />
                  </div>
                </div>
                {packageForm.sessions && packageForm.price && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#065f46', textAlign: 'center' }}>
                    💡 ₪{Math.round(Number(packageForm.price) / Number(packageForm.sessions)).toLocaleString()} לטיפול
                  </div>
                )}
                <button onClick={savePackage} disabled={savingPackage || !packageForm.name || !packageForm.sessions || !packageForm.price} style={{ width: '100%', padding: '13px', background: (!packageForm.name || !packageForm.sessions || !packageForm.price) ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '4px' }}>
                  {savingPackage ? '⏳ שומר...' : '💾 שמור'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  { id: 'equipment',   label: 'ציוד רפואי',     icon: '🏥' },
  { id: 'rent',        label: 'שכירות',           icon: '🏠' },
  { id: 'salary',      label: 'שכר',              icon: '👤' },
  { id: 'supplies',    label: 'חומרים מתכלים',   icon: '📦' },
  { id: 'software',    label: 'תוכנה / מנויים',  icon: '💻' },
  { id: 'marketing',   label: 'שיווק',            icon: '📢' },
  { id: 'accounting',  label: 'הנהלת חשבונות',   icon: '📊' },
  { id: 'insurance',   label: 'ביטוח',            icon: '🛡️' },
  { id: 'transport',   label: 'נסיעות',           icon: '🚗' },
  { id: 'other',       label: 'אחר',              icon: '📁' },
]

const VAT = 0.18

function withoutVAT(amount: number) { return Math.round(amount / (1 + VAT)) }
function vatAmount(amount: number) { return amount - withoutVAT(amount) }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'list' | 'import'>('list')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'other', date: new Date().toISOString().split('T')[0], supplier: '', notes: '' })

  // PDF Import
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [extracted, setExtracted] = useState<any>(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Stats
  const [totalMonth, setTotalMonth] = useState(0)
  const [totalYear, setTotalYear] = useState(0)
  const [showVAT, setShowVAT] = useState(true)

  useEffect(() => { loadExpenses() }, [])

  async function loadExpenses() {
    setLoading(true)
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(100)
    setExpenses(data || [])

    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisYear = `${now.getFullYear()}`
    const month = (data || []).filter(e => e.date?.startsWith(thisMonth)).reduce((s: number, e: any) => s + (e.amount || 0), 0)
    const year = (data || []).filter(e => e.date?.startsWith(thisYear)).reduce((s: number, e: any) => s + (e.amount || 0), 0)
    setTotalMonth(month)
    setTotalYear(year)
    setLoading(false)
  }

  async function saveExpense(data?: any) {
    const toSave = data || form
    if (!toSave.description || !toSave.amount) { alert('יש למלא תיאור וסכום'); return }
    setSaving(true)
    await supabase.from('expenses').insert([{
      description: toSave.description,
      amount: Number(toSave.amount),
      category: toSave.category || 'other',
      date: toSave.date || new Date().toISOString().split('T')[0],
      supplier: toSave.supplier || '',
      notes: toSave.notes || '',
    }])
    setSaving(false)
    setShowForm(false)
    setExtracted(null)
    setForm({ description: '', amount: '', category: 'other', date: new Date().toISOString().split('T')[0], supplier: '', notes: '' })
    loadExpenses()
    setTab('list')
  }

  async function deleteExpense(id: string) {
    if (!confirm('למחוק הוצאה זו?')) return
    await supabase.from('expenses').delete().eq('id', id)
    loadExpenses()
  }

  // PDF → AI extraction
  async function handleFile(file: File) {
    if (!file) return
    setImporting(true)
    setImportError('')
    setExtracted(null)

    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1])
        r.onerror = () => rej(new Error('שגיאה בקריאת הקובץ'))
        r.readAsDataURL(file)
      })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
              },
              {
                type: 'text',
                text: `קרא את החשבונית הזו וחלץ את הפרטים הבאים. ענה אך ורק ב-JSON תקין ללא כל טקסט נוסף, ללא markdown, ללא backticks:
{"description":"תיאור קצר של ההוצאה","amount":0,"supplier":"שם הספק","date":"YYYY-MM-DD","category":"one of: equipment/rent/salary/supplies/software/marketing/accounting/insurance/transport/other","notes":"הערות אם יש"}

אם לא מצאת שדה מסוים, השאר ריק או 0. הסכום צריך להיות המספר הכולל כולל מע"מ.`
              }
            ]
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setExtracted(parsed)
    } catch (err: any) {
      setImportError('לא הצלחנו לקרוא את הקובץ. נסה שוב או הכנס ידנית.')
    }
    setImporting(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') handleFile(file)
    else setImportError('יש להעלות קובץ PDF בלבד')
  }

  function displayAmount(amount: number) {
    return showVAT ? amount : withoutVAT(amount)
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'rtl' as const }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>💸 הוצאות</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>הצג:</span>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setShowVAT(true)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: showVAT ? '700' : '400', background: showVAT ? '#1a3a5c' : 'transparent', color: showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>כולל מע"מ</button>
                <button onClick={() => setShowVAT(false)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: !showVAT ? '700' : '400', background: !showVAT ? '#1a3a5c' : 'transparent', color: !showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>ללא מע"מ</button>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>מע"מ 18%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setTab('import'); setExtracted(null); setImportError('') }} style={{ padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              📄 ייבוא PDF
            </button>
            <button onClick={() => setShowForm(true)} style={{ padding: '9px 18px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              + הוצאה חדשה
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #dc2626', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>הוצאות החודש</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626' }}>₪{displayAmount(totalMonth).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {showVAT ? `לפני מע"מ: ₪${withoutVAT(totalMonth).toLocaleString()}` : `כולל מע"מ: ₪${totalMonth.toLocaleString()}`}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #e8a020', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>הוצאות השנה</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#e8a020' }}>₪{displayAmount(totalYear).toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {showVAT ? `לפני מע"מ: ₪${withoutVAT(totalYear).toLocaleString()}` : `כולל מע"מ: ₪${totalYear.toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', width: 'fit-content' }}>
          {[{ key: 'list', label: '📋 רשימת הוצאות' }, { key: 'import', label: '📄 ייבוא PDF' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ padding: '9px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? '700' : '400', background: tab === t.key ? '#1a3a5c' : 'transparent', color: tab === t.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>{t.label}</button>
          ))}
        </div>

        {/* ── ייבוא PDF ── */}
        {tab === 'import' && (
          <div style={{ maxWidth: '600px' }}>
            {!extracted ? (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${dragging ? '#7c3aed' : '#cbd5e1'}`, borderRadius: '16px', padding: '48px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#f5f3ff' : '#fff', transition: 'all 0.2s', marginBottom: '16px' }}
                >
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  {importing ? (
                    <>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#7c3aed' }}>ה-AI קורא את החשבונית...</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>מחלץ פרטים אוטומטית</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '8px' }}>גרור כאן קובץ PDF של חשבונית</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>או לחץ לבחירת קובץ</div>
                      <div style={{ display: 'inline-block', padding: '10px 24px', background: '#7c3aed', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>בחר קובץ PDF</div>
                    </>
                  )}
                </div>
                {importError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#991b1b', marginBottom: '16px' }}>
                    ⚠️ {importError}
                  </div>
                )}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', fontSize: '12px', color: '#0369a1', lineHeight: '1.7' }}>
                  <strong>איך זה עובד:</strong><br/>
                  1. הורד את החשבונית מהמייל שלך כ-PDF<br/>
                  2. גרור אותה לכאן<br/>
                  3. ה-AI יקרא את הפרטים אוטומטית<br/>
                  4. תאשר ותשמור
                </div>
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2px solid #7c3aed' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '4px' }}>✅ חולצו הפרטים הבאים:</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>בדוק ותקן לפי הצורך לפני השמירה</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תיאור *</label>
                    <input style={inp} value={extracted.description || ''} onChange={e => setExtracted((p: any) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>סכום כולל מע"מ ₪ *</label>
                      <input style={inp} type="number" value={extracted.amount || ''} onChange={e => setExtracted((p: any) => ({ ...p, amount: e.target.value }))} />
                      {extracted.amount > 0 && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          לפני מע"מ: ₪{withoutVAT(Number(extracted.amount)).toLocaleString()} | מע"מ: ₪{vatAmount(Number(extracted.amount)).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תאריך</label>
                      <input style={inp} type="date" value={extracted.date || ''} onChange={e => setExtracted((p: any) => ({ ...p, date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>שם הספק</label>
                    <input style={inp} value={extracted.supplier || ''} onChange={e => setExtracted((p: any) => ({ ...p, supplier: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>קטגוריה</label>
                    <select style={inp} value={extracted.category || 'other'} onChange={e => setExtracted((p: any) => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button onClick={() => { setExtracted(null); setImportError('') }} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                    <button onClick={() => saveExpense(extracted)} disabled={saving} style={{ flex: 2, padding: '12px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      {saving ? '⏳ שומר...' : '💾 שמור הוצאה'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── רשימת הוצאות ── */}
        {tab === 'list' && (
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
            ) : expenses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💸</div>
                <div>אין הוצאות עדיין</div>
                <button onClick={() => setTab('import')} style={{ marginTop: '12px', padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ייבא חשבונית PDF</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['תאריך', 'תיאור', 'ספק', 'קטגוריה', 'סכום', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e, i) => {
                    const cat = CATEGORIES.find(c => c.id === e.category)
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
                        <td style={{ padding: '12px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{e.date ? new Date(e.date).toLocaleDateString('he-IL') : '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1a3a5c' }}>{e.description}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{e.supplier || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#f1f5f9', color: '#475569' }}>
                            {cat?.icon} {cat?.label || e.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#dc2626' }}>₪{displayAmount(e.amount || 0).toLocaleString()}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {showVAT ? `לפני מע"מ: ₪${withoutVAT(e.amount || 0).toLocaleString()}` : `כולל מע"מ: ₪${(e.amount || 0).toLocaleString()}`}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => deleteExpense(e.id)} style={{ padding: '4px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#dc2626', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🗑️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* פאנל הוצאה ידנית */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>+ הוצאה חדשה</div>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תיאור *</label>
                  <input style={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="תיאור ההוצאה" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>סכום כולל מע"מ ₪ *</label>
                    <input style={inp} type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
                    {Number(form.amount) > 0 && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        לפני מע"מ: ₪{withoutVAT(Number(form.amount)).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>תאריך</label>
                    <input style={inp} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>שם הספק</label>
                  <input style={inp} value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="שם הספק / חברה" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>קטגוריה</label>
                  <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <button onClick={() => saveExpense()} disabled={saving} style={{ width: '100%', padding: '13px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '4px' }}>
                  {saving ? '⏳ שומר...' : '💾 שמור'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

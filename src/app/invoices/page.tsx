'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const VAT_RATE = 0.18
const CLINIC = {
  name: 'יואב אבני',
  business: 'קליניקת יואב אבני',
  address: 'תרשיש 8, גילון',
  phone: '054-5953889',
  vat_id: '305111551',
  email: 'yoavavni.pt@gmail.com',
}

const INVOICE_TYPES: Record<string, string> = {
  invoice_receipt: 'חשבונית מס-קבלה',
  invoice: 'חשבונית מס',
  receipt: 'קבלה',
  demand: 'דרישה לתשלום',
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'מזומן',
  credit: 'כרטיס אשראי',
  bit: 'Bit',
  paybox: 'Paybox',
  transfer: 'העברה בנקאית',
  check: 'המחאה',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printInvoice, setPrintInvoice] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState('')
  const [showVatReport, setShowVatReport] = useState(false)
  const [cancelModal, setCancelModal] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    invoice_type: 'invoice_receipt',
    patient_id: '',
    patient_name: '',
    patient_email: '',
    issue_date: new Date().toISOString().split('T')[0],
    service_date: new Date().toISOString().split('T')[0],
    service_description: 'טיפול פיזיותרפיה',
    quantity: 1,
    total_amount: '',
    payment_method: 'credit',
    payment_details: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => { loadInvoices(); loadPatients() }, [])

  async function loadInvoices() {
    setLoading(true)
    const { data } = await supabase.from('invoices').select('*').order('invoice_number', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  async function loadPatients() {
    const { data } = await supabase.from('patients').select('id,first_name,last_name,phone,email').order('last_name').limit(500)
    setPatients(data || [])
  }

  async function getNextInvoiceNumber() {
    const { data } = await supabase.from('invoices').select('invoice_number').order('invoice_number', { ascending: false }).limit(1)
    return data && data.length > 0 ? data[0].invoice_number + 1 : 1260
  }

  async function saveInvoice() {
    if (!form.patient_name || !form.total_amount || !form.service_description) {
      alert('יש למלא שם לקוח, תיאור שירות וסכום'); return
    }
    setSaving(true)
    const total = parseFloat(form.total_amount)
    const isDemand = form.invoice_type === 'demand'
    const priceBeforeVat = isDemand ? total : Math.round((total / (1 + VAT_RATE)) * 100) / 100
    const vatAmount = isDemand ? 0 : Math.round((total - priceBeforeVat) * 100) / 100
    const invoiceNumber = await getNextInvoiceNumber()
    const user = JSON.parse(localStorage.getItem('clinic_user') || '{}')

    const { data, error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      invoice_type: form.invoice_type,
      patient_id: form.patient_id || null,
      patient_name: form.patient_name,
      patient_email: form.patient_email,
      issue_date: form.issue_date,
      service_date: form.service_date,
      service_description: form.service_description,
      quantity: form.quantity,
      price_before_vat: priceBeforeVat,
      vat_amount: vatAmount,
      total_amount: total,
      payment_method: form.invoice_type !== 'invoice' ? form.payment_method : null,
      payment_details: form.payment_details,
      payment_date: form.invoice_type !== 'invoice' ? form.payment_date : null,
      notes: form.notes,
      status: 'issued',
      created_by: user.id || null,
    }).select().single()

    if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }
    setSaving(false); setShowForm(false); resetForm()
    await loadInvoices()
    if (data) setPrintInvoice(data)
  }

  async function cancelInvoice() {
    if (!cancelModal || !cancelReason.trim()) { alert('יש להזין סיבת ביטול'); return }
    await supabase.from('invoices').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason,
    }).eq('id', cancelModal.id)
    setCancelModal(null); setCancelReason(''); await loadInvoices()
  }

  function resetForm() {
    setForm({ invoice_type: 'invoice_receipt', patient_id: '', patient_name: '', patient_email: '', issue_date: new Date().toISOString().split('T')[0], service_date: new Date().toISOString().split('T')[0], service_description: 'טיפול פיזיותרפיה', quantity: 1, total_amount: '', payment_method: 'credit', payment_details: '', payment_date: new Date().toISOString().split('T')[0], notes: '' })
  }

  function selectPatient(p: any) {
    setForm(prev => ({ ...prev, patient_id: p.id, patient_name: `${p.first_name} ${p.last_name}`, patient_email: p.email || '' }))
  }

  function printDoc() {
    const content = printRef.current
    if (!content) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${INVOICE_TYPES[printInvoice?.invoice_type]} ${printInvoice?.invoice_number}</title>
    <style>* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, sans-serif; direction: rtl; color: #1a1a1a; } @page { margin: 15mm; } @media print { .no-print { display: none; } }</style>
    </head><body>${content.innerHTML}</body></html>`)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  function exportVatReport() {
    const month = filterMonth || new Date().toISOString().slice(0,7)
    const relevant = invoices.filter(i => i.issue_date?.startsWith(month) && i.status === 'issued' && i.invoice_type !== 'demand' && i.invoice_type !== 'receipt')
    const total = relevant.reduce((s, i) => s + (i.total_amount || 0), 0)
    const vat = relevant.reduce((s, i) => s + (i.vat_amount || 0), 0)
    const beforeVat = relevant.reduce((s, i) => s + (i.price_before_vat || 0), 0)
    alert(`דוח מע"מ לחודש ${month}:\nמספר עסקאות: ${relevant.length}\nסה"כ לפני מע"מ: ₪${beforeVat.toFixed(2)}\nמע"מ לתשלום: ₪${vat.toFixed(2)}\nסה"כ עם מע"מ: ₪${total.toFixed(2)}`)
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = !searchTerm || inv.patient_name?.includes(searchTerm) || inv.invoice_number?.toString().includes(searchTerm)
    const matchType = filterType === 'all' || inv.invoice_type === filterType
    const matchMonth = !filterMonth || inv.issue_date?.startsWith(filterMonth)
    return matchSearch && matchType && matchMonth
  })

  const totalRevenue = invoices.filter(i => i.status === 'issued' && i.invoice_type !== 'demand').reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalVat = invoices.filter(i => i.status === 'issued' && i.invoice_type !== 'demand').reduce((s, i) => s + (i.vat_amount || 0), 0)

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', direction: 'rtl' as const, boxSizing: 'border-box' as const }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🧾 חשבוניות ומסמכים</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>מספור רץ · מע"מ 18% · שמירה 7 שנים</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportVatReport} style={{ padding: '9px 14px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>📊 דוח מע"מ</button>
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 18px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {showForm ? '✕ ביטול' : '+ מסמך חדש'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'סה"כ מסמכים', value: invoices.filter(i => i.status === 'issued').length, icon: '🧾', color: '#1a3a5c' },
            { label: 'סה"כ הכנסות', value: `₪${totalRevenue.toLocaleString()}`, icon: '💰', color: '#065f46' },
            { label: 'מע"מ לדיווח', value: `₪${totalVat.toLocaleString()}`, icon: '📋', color: '#92400e' },
            { label: 'בוטלו', value: invoices.filter(i => i.status === 'cancelled').length, icon: '❌', color: '#dc2626' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', marginBottom: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '16px' }}>מסמך חדש</h3>

            {/* סוג */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>סוג מסמך</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(INVOICE_TYPES).map(([key, label]) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, invoice_type: key }))}
                    style={{ padding: '8px 14px', border: `2px solid ${form.invoice_type === key ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '8px', background: form.invoice_type === key ? '#1a3a5c' : '#fff', color: form.invoice_type === key ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* לקוח */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>לקוח *</label>
              <input value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value, patient_id: '' }))} placeholder="הקלד שם..." style={inp}/>
              {form.patient_name.length > 1 && !form.patient_id && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '120px', overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 }}>
                  {patients.filter(p => `${p.first_name} ${p.last_name}`.includes(form.patient_name)).slice(0,6).map(p => (
                    <div key={p.id} onClick={() => selectPatient(p)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      {p.first_name} {p.last_name} · {p.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>דוא"ל</label>
                <input value={form.patient_email} onChange={e => setForm(p => ({ ...p, patient_email: e.target.value }))} placeholder="email@example.com" style={{ ...inp, direction: 'ltr' as const }}/>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך הנפקה</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} style={inp}/>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך שירות</label>
                <input type="date" value={form.service_date} onChange={e => setForm(p => ({ ...p, service_date: e.target.value }))} style={inp}/>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תיאור שירות *</label>
              <input value={form.service_description} onChange={e => setForm(p => ({ ...p, service_description: e.target.value }))} placeholder="טיפול פיזיותרפיה מתאריך..." style={inp}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>כמות</label>
                <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} min="1" style={inp}/>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>סכום כולל מע"מ ₪ *</label>
                <input type="number" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} placeholder="330.00" style={{ ...inp, direction: 'ltr' as const }}/>
              </div>
              <div>
                {form.total_amount && form.invoice_type !== 'demand' && (
                  <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: '#0369a1', marginTop: '19px', lineHeight: '1.6' }}>
                    <div>לפני מע"מ: ₪{(parseFloat(form.total_amount) / 1.18).toFixed(2)}</div>
                    <div>מע"מ 18%: ₪{(parseFloat(form.total_amount) - parseFloat(form.total_amount) / 1.18).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* תשלום */}
            {(form.invoice_type === 'invoice_receipt' || form.invoice_type === 'receipt') && (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>💳 פרטי תשלום</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>אמצעי תשלום</label>
                    <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} style={inp}>
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>פרטים</label>
                    <input value={form.payment_details} onChange={e => setForm(p => ({ ...p, payment_details: e.target.value }))} placeholder="4 ספרות אחרונות..." style={inp}/>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך תשלום</label>
                    <input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} style={inp}/>
                  </div>
                </div>
              </div>
            )}

            <button onClick={saveInvoice} disabled={saving} style={{ width: '100%', padding: '13px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              {saving ? '⏳ שומר...' : '✅ הנפק מסמך'}
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 חפש שם / מספר..." style={{ ...inp, maxWidth: '220px' }}/>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp, maxWidth: '180px' }}>
            <option value="all">כל הסוגים</option>
            {Object.entries(INVOICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, maxWidth: '160px' }}/>
          {filterMonth && <button onClick={() => setFilterMonth('')} style={{ padding: '9px 12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>נקה סינון</button>}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['מספר', 'סוג', 'לקוח', 'תאריך', 'שירות', 'לפני מע"מ', 'מע"מ', 'סה"כ', 'סטטוס', 'פעולות'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: inv.status === 'cancelled' ? 0.5 : 1 }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '800', color: '#1a3a5c' }}>
                      #{inv.invoice_number}
                      {inv.status === 'cancelled' && <div style={{ fontSize: '9px', color: '#dc2626', fontWeight: '600' }}>בוטל</div>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 7px', background: '#dbeafe', color: '#1e40af', borderRadius: '5px', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>{INVOICE_TYPES[inv.invoice_type]}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600' }}>{inv.patient_name}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(inv.issue_date).toLocaleDateString('he-IL')}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.service_description}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>₪{Number(inv.price_before_vat).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>₪{Number(inv.vat_amount).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '800', color: '#065f46' }}>₪{Number(inv.total_amount).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 7px', background: inv.status === 'cancelled' ? '#fee2e2' : '#d1fae5', color: inv.status === 'cancelled' ? '#dc2626' : '#065f46', borderRadius: '5px', fontSize: '10px', fontWeight: '600' }}>
                        {inv.status === 'cancelled' ? 'בוטל' : 'הופק'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setPrintInvoice(inv)} style={{ padding: '5px 8px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🖨️</button>
                        {inv.status !== 'cancelled' && (
                          <button onClick={() => setCancelModal(inv)} style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>אין מסמכים</div>}
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', maxWidth: '400px', width: '100%', direction: 'rtl' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', marginBottom: '8px' }}>❌ ביטול מסמך #{cancelModal.invoice_number}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>ביטול הינו בלתי הפיך. המסמך יסומן כמבוטל ולא יימחק.</div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>סיבת ביטול *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="הזן סיבת ביטול..." style={{ ...inp, minHeight: '80px', resize: 'vertical' as const, marginBottom: '14px' }}/>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setCancelModal(null); setCancelReason('') }} style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', fontSize: '13px' }}>ביטול</button>
                <button onClick={cancelInvoice} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>אשר ביטול</button>
              </div>
            </div>
          </div>
        )}

        {/* Print Modal */}
        {printInvoice && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a3a5c' }}>{INVOICE_TYPES[printInvoice.invoice_type]} #{printInvoice.invoice_number}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={printDoc} style={{ padding: '8px 16px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🖨️ הדפס / PDF</button>
                  <button onClick={() => setPrintInvoice(null)} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>✕ סגור</button>
                </div>
              </div>

              <div ref={printRef} style={{ padding: '48px', direction: 'rtl', fontFamily: 'Arial, sans-serif', fontSize: '13px', lineHeight: '1.6' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '3px solid #1a3a5c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/logo-full.png" alt="לוגו קליניקת יואב אבני" style={{ height: '80px', width: 'auto' }} />
                    <div style={{ width: '90px', height: '90px', border: '3px solid #1a3a5c', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8px' }}>
                      <div style={{ fontSize: '9px', fontWeight: '700', color: '#1a3a5c', lineHeight: '1.3' }}>מסמך ממוחשב</div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#1a3a5c', margin: '2px 0' }}>מאושר</div>
                      <div style={{ fontSize: '8px', color: '#1a3a5c', lineHeight: '1.3' }}>חתום דיגיטלית</div>
                      <div style={{ width: '60px', height: '1px', background: '#1a3a5c', margin: '3px 0' }}/>
                      <div style={{ fontSize: '8px', color: '#1a3a5c' }}>YOAVAVNI</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left', fontSize: '12px', color: '#374151' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c', marginBottom: '2px' }}>{CLINIC.name}</div>
                    <div>{CLINIC.address}</div>
                    <div>טלפון: {CLINIC.phone}</div>
                    <div>ע.מ: {CLINIC.vat_id}</div>
                    <div>{CLINIC.email}</div>
                  </div>
                </div>

                {/* Cancelled watermark */}
                {printInvoice.status === 'cancelled' && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-30deg)', fontSize: '72px', fontWeight: '900', color: 'rgba(220,38,38,0.12)', pointerEvents: 'none', userSelect: 'none' }}>מבוטל</div>
                )}

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1a3a5c', margin: 0 }}>
                    {INVOICE_TYPES[printInvoice.invoice_type]} מספר {printInvoice.invoice_number} מקור
                  </h1>
                  {printInvoice.status === 'cancelled' && <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '14px', marginTop: '4px' }}>⚠️ מסמך זה בוטל — {printInvoice.cancel_reason}</div>}
                </div>

                {/* Client & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '14px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <div>לכבוד: <strong>{printInvoice.patient_name}</strong></div>
                    {printInvoice.patient_email && <div style={{ color: '#64748b', fontSize: '12px' }}>דוא"ל: {printInvoice.patient_email}</div>}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div>תאריך: <strong>{new Date(printInvoice.issue_date).toLocaleDateString('he-IL')}</strong></div>
                    {printInvoice.service_date && printInvoice.service_date !== printInvoice.issue_date && (
                      <div style={{ color: '#64748b', fontSize: '12px' }}>תאריך שירות: {new Date(printInvoice.service_date).toLocaleDateString('he-IL')}</div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: '#fff' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px' }}>שם פריט</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px' }}>מחיר יחידה</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px' }}>כמות</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px' }}>סך שורה לפני מע"מ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px' }}>{printInvoice.service_description}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>₪{Number(printInvoice.price_before_vat).toFixed(2)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{printInvoice.quantity}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'left' }}>₪{Number(printInvoice.price_before_vat).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                  <div style={{ width: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b' }}>סה"כ</span>
                      <strong>₪{Number(printInvoice.price_before_vat).toFixed(2)}</strong>
                    </div>
                    {printInvoice.invoice_type !== 'demand' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b' }}>מע"מ 18%</span>
                        <strong>₪{Number(printInvoice.vat_amount).toFixed(2)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#1a3a5c', borderRadius: '6px', marginTop: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px' }}>סה"כ לתשלום</span>
                      <span style={{ fontWeight: '900', color: '#3eb8e5', fontSize: '16px' }}>₪{Number(printInvoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                {(printInvoice.invoice_type === 'invoice_receipt' || printInvoice.invoice_type === 'receipt') && printInvoice.payment_method && (
                  <div style={{ marginBottom: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>סוג תשלום</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>פרטים</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>סכום</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 14px' }}>{PAYMENT_METHODS[printInvoice.payment_method]}</td>
                          <td style={{ padding: '8px 14px', color: '#64748b' }}>
                            {printInvoice.payment_date && new Date(printInvoice.payment_date).toLocaleDateString('he-IL')}
                            {printInvoice.payment_details && ` · ${printInvoice.payment_details}`}
                          </td>
                          <td style={{ padding: '8px 14px', fontWeight: '700', textAlign: 'left' }}>₪{Number(printInvoice.total_amount).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ padding: '8px 14px', fontWeight: '700', color: '#065f46', borderTop: '2px solid #e2e8f0', fontSize: '13px' }}>
                      סה"כ שהתקבל: ₪{Number(printInvoice.total_amount).toFixed(2)}
                    </div>
                  </div>
                )}

                {printInvoice.notes && (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#64748b' }}>
                    הערות: {printInvoice.notes}
                  </div>
                )}

                {/* Footer */}
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '14px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                  הופק על ידי מערכת YOAVAVNI · {CLINIC.business} · {CLINIC.address} · {CLINIC.phone} · ע.מ {CLINIC.vat_id}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

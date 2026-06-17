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
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'מזומן',
  credit: 'כרטיס אשראי',
  bit: 'Bit',
  paybox: 'Paybox',
  transfer: 'העברה בנקאית',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printInvoice, setPrintInvoice] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
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

  useEffect(() => {
    loadInvoices()
    loadPatients()
  }, [])

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

  function calcAmounts(total: number) {
    const priceBeforeVat = Math.round((total / (1 + VAT_RATE)) * 100) / 100
    const vatAmount = Math.round((total - priceBeforeVat) * 100) / 100
    return { priceBeforeVat, vatAmount }
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
    const { priceBeforeVat, vatAmount } = calcAmounts(total)
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
      payment_method: form.payment_method,
      payment_details: form.payment_details,
      payment_date: form.payment_date,
      notes: form.notes,
      created_by: user.id || null,
    }).select().single()

    if (error) { alert('שגיאה: ' + error.message); setSaving(false); return }

    setSaving(false)
    setShowForm(false)
    resetForm()
    await loadInvoices()
    if (data) setPrintInvoice(data)
  }

  function resetForm() {
    setForm({
      invoice_type: 'invoice_receipt', patient_id: '', patient_name: '', patient_email: '',
      issue_date: new Date().toISOString().split('T')[0], service_date: new Date().toISOString().split('T')[0],
      service_description: 'טיפול פיזיותרפיה', quantity: 1, total_amount: '',
      payment_method: 'credit', payment_details: '', payment_date: new Date().toISOString().split('T')[0], notes: '',
    })
  }

  function selectPatient(p: any) {
    setForm(prev => ({ ...prev, patient_id: p.id, patient_name: `${p.first_name} ${p.last_name}`, patient_email: p.email || '' }))
  }

  function printDoc() {
    const content = printRef.current
    if (!content) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>חשבונית ${printInvoice?.invoice_number}</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; background: #fff; color: #1a1a1a; }
      @media print { body { margin: 0; } }
    </style></head><body>${content.innerHTML}</body></html>`)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  const filteredInvoices = invoices.filter(inv =>
    inv.patient_name?.includes(searchTerm) ||
    inv.invoice_number?.toString().includes(searchTerm) ||
    inv.service_description?.includes(searchTerm)
  )

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', direction: 'rtl' as const, boxSizing: 'border-box' as const }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', direction: 'rtl' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🧾 חשבוניות ומסמכים</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>הנפקת חשבוניות מס, קבלות וחשבוניות מס-קבלה</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
            {showForm ? '✕ ביטול' : '+ חשבונית חדשה'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '2px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '18px' }}>מסמך חדש</h3>

            {/* סוג מסמך */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>סוג מסמך</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Object.entries(INVOICE_TYPES).map(([key, label]) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, invoice_type: key }))}
                    style={{ flex: 1, padding: '9px', border: `2px solid ${form.invoice_type === key ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '8px', background: form.invoice_type === key ? '#1a3a5c' : '#fff', color: form.invoice_type === key ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              {/* חיפוש מטופל */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>לקוח *</label>
                <input value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value, patient_id: '' }))} placeholder="הקלד שם או בחר מהרשימה..." style={inp}/>
                {form.patient_name.length > 1 && !form.patient_id && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', maxHeight: '140px', overflowY: 'auto', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {patients.filter(p => `${p.first_name} ${p.last_name}`.includes(form.patient_name)).slice(0,8).map(p => (
                      <div key={p.id} onClick={() => selectPatient(p)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                        {p.first_name} {p.last_name} — {p.phone}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>דוא"ל לקוח</label>
                <input value={form.patient_email} onChange={e => setForm(p => ({ ...p, patient_email: e.target.value }))} placeholder="email@example.com" style={{ ...inp, direction: 'ltr' as const }}/>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תאריך הנפקה</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} style={inp}/>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>תיאור שירות *</label>
              <input value={form.service_description} onChange={e => setForm(p => ({ ...p, service_description: e.target.value }))} placeholder="טיפול פיזיותרפיה מתאריך..." style={inp}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>כמות</label>
                <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} min="1" style={inp}/>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>סכום לתשלום כולל מע"מ ₪ *</label>
                <input type="number" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} placeholder="330.00" style={{ ...inp, direction: 'ltr' as const }}/>
              </div>
              <div>
                {form.total_amount && (
                  <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: '#0369a1', marginTop: '19px' }}>
                    <div>לפני מע"מ: ₪{(parseFloat(form.total_amount) / 1.18).toFixed(2)}</div>
                    <div>מע"מ 18%: ₪{(parseFloat(form.total_amount) - parseFloat(form.total_amount) / 1.18).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* תשלום */}
            {(form.invoice_type === 'invoice_receipt' || form.invoice_type === 'receipt') && (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>פרטי תשלום</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>אמצעי תשלום</label>
                    <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} style={inp}>
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>פרטים (4 ספרות אחרונות וכו')</label>
                    <input value={form.payment_details} onChange={e => setForm(p => ({ ...p, payment_details: e.target.value }))} placeholder="4 ספרות אחרונות" style={inp}/>
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

        {/* Search */}
        <div style={{ marginBottom: '14px' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="🔍 חפש לפי שם, מספר חשבונית..." style={{ ...inp, maxWidth: '400px' }}/>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'סה"כ מסמכים', value: invoices.length, color: '#1a3a5c' },
            { label: 'חשבוניות מס-קבלה', value: invoices.filter(i => i.invoice_type === 'invoice_receipt').length, color: '#0369a1' },
            { label: 'סה"כ הכנסות', value: `₪${invoices.reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString()}`, color: '#065f46' },
            { label: 'מע"מ לדיווח', value: `₪${invoices.reduce((s, i) => s + (i.vat_amount || 0), 0).toLocaleString()}`, color: '#92400e' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Invoices list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>טוען...</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['מספר', 'סוג', 'לקוח', 'תאריך', 'שירות', 'סכום', 'מע"מ', 'סה"כ', 'פעולות'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '800', color: '#1a3a5c' }}>#{inv.invoice_number}</td>
                    <td style={{ padding: '10px 14px', fontSize: '11px' }}><span style={{ padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontWeight: '600' }}>{INVOICE_TYPES[inv.invoice_type]}</span></td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '600' }}>{inv.patient_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>{new Date(inv.issue_date).toLocaleDateString('he-IL')}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.service_description}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>₪{inv.price_before_vat}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>₪{inv.vat_amount}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '800', color: '#065f46' }}>₪{inv.total_amount}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => setPrintInvoice(inv)} style={{ padding: '5px 10px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🖨️ הדפס</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Modal */}
        {printInvoice && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#1a3a5c' }}>תצוגה מקדימה — {INVOICE_TYPES[printInvoice.invoice_type]} #{printInvoice.invoice_number}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={printDoc} style={{ padding: '8px 16px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>🖨️ הדפס / PDF</button>
                  <button onClick={() => setPrintInvoice(null)} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>✕ סגור</button>
                </div>
              </div>

              {/* Invoice Template */}
              <div ref={printRef} style={{ padding: '40px', direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', paddingBottom: '20px', borderBottom: '3px solid #1a3a5c' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a3a5c', letterSpacing: '-1px' }}>
                      <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>פיזיותרפיה | שיקום | אורתופדיה | פציעות ספורט</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c' }}>{CLINIC.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{CLINIC.address}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>טלפון: {CLINIC.phone}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>ע.מ: {CLINIC.vat_id}</div>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1a3a5c', margin: 0 }}>
                    {INVOICE_TYPES[printInvoice.invoice_type]} מספר {printInvoice.invoice_number} מקור
                  </h1>
                </div>

                {/* Client & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>לכבוד: <strong>{printInvoice.patient_name}</strong></div>
                    {printInvoice.patient_email && <div style={{ fontSize: '12px', color: '#64748b' }}>דוא"ל: {printInvoice.patient_email}</div>}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>תאריך: <strong>{new Date(printInvoice.issue_date).toLocaleDateString('he-IL')}</strong></div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ background: '#1a3a5c', color: '#fff' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: '700' }}>שם פריט</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>מחיר יחידה</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: '700' }}>כמות</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700' }}>סך שורה לפני מע"מ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>{printInvoice.service_description}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px' }}>₪{printInvoice.price_before_vat}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px' }}>{printInvoice.quantity}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'left', fontSize: '13px' }}>₪{printInvoice.price_before_vat}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                  <div style={{ width: '260px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>סה"כ</span>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>₪{printInvoice.price_before_vat}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>מע"מ 18%</span>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>₪{printInvoice.vat_amount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', background: '#1a3a5c', marginTop: '4px', paddingRight: '10px', paddingLeft: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>סה"כ לתשלום</span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#3eb8e5' }}>₪{printInvoice.total_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                {(printInvoice.invoice_type === 'invoice_receipt' || printInvoice.invoice_type === 'receipt') && printInvoice.payment_method && (
                  <div style={{ marginBottom: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>סוג תשלום</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>פרטים</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>סכום</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 14px', fontSize: '13px' }}>{PAYMENT_METHODS[printInvoice.payment_method]}</td>
                          <td style={{ padding: '8px 14px', fontSize: '13px', color: '#64748b' }}>
                            {printInvoice.payment_date && new Date(printInvoice.payment_date).toLocaleDateString('he-IL')} {printInvoice.payment_details}
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '700', textAlign: 'left' }}>₪{printInvoice.total_amount}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '700', color: '#065f46', borderTop: '2px solid #e2e8f0' }}>
                      סה"כ שהתקבל: ₪{printInvoice.total_amount}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                  הופק על ידי מערכת YOAVAVNI · {CLINIC.business} · {CLINIC.address} · {CLINIC.phone}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

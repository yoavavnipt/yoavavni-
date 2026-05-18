'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

const MONTH_NAMES_HE: Record<string, string> = {
  '01': 'ינואר', '02': 'פברואר', '03': 'מרץ', '04': 'אפריל',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוגוסט',
  '09': 'ספטמבר', '10': 'אוקטובר', '11': 'נובמבר', '12': 'דצמבר'
}

export default function ReportsPDFPage() {
  const [reportType, setReportType] = useState<'income' | 'expenses' | 'combined'>('income')
  const [startMonth, setStartMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [endMonth, setEndMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)

  function getPeriodLabel(start: string, end: string) {
    const [sy, sm] = start.split('-')
    const [ey, em] = end.split('-')
    if (start === end) return `${MONTH_NAMES_HE[sm]} ${sy}`
    return `${MONTH_NAMES_HE[sm]} ${sy} - ${MONTH_NAMES_HE[em]} ${ey}`
  }

  async function generateReport() {
    setLoading(true)
    const start = `${startMonth}-01`
    const end = `${endMonth}-31`
    const today = new Date().toLocaleDateString('he-IL')

    let incomeData: any = null
    let expensesData: any = null

    if (reportType === 'income' || reportType === 'combined') {
      const { data: billing } = await supabase
        .from('billing_records')
        .select('*, patient:patients(first_name,last_name)')
        .eq('status', 'paid')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at')

      const total = (billing || []).reduce((s, b) => s + (b.amount || 0), 0)
      const byPayment: Record<string, number> = {}
      ;(billing || []).forEach(b => {
        const m = b.payment_method || 'לא צוין'
        byPayment[m] = (byPayment[m] || 0) + (b.amount || 0)
      })

      incomeData = {
        total_incl_vat: total,
        payment_breakdown: byPayment,
        records: (billing || []).map(b => ({
          date: new Date(b.created_at).toLocaleDateString('he-IL'),
          patient: `${b.patient?.first_name || ''} ${b.patient?.last_name || ''}`.trim(),
          service: b.description || 'טיפול',
          payment_method: b.payment_method || '',
          amount: b.amount || 0,
          status_he: 'שולם',
        }))
      }
    }

    if (reportType === 'expenses' || reportType === 'combined') {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date')

      const total = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
      const totalVat = (expenses || []).reduce((s, e) => s + (e.vat_amount || 0), 0)
      const byCategory: Record<string, number> = {}
      ;(expenses || []).forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0)
      })

      expensesData = {
        total,
        total_vat: totalVat,
        by_category: byCategory,
        expenses: (expenses || []).map(e => ({
          date: new Date(e.date).toLocaleDateString('he-IL'),
          category: e.category,
          supplier: e.supplier || '',
          description: e.description || '',
          payment_method: e.payment_method || '',
          amount: e.amount || 0,
          vat_amount: e.vat_amount || 0,
        }))
      }
    }

    const period = getPeriodLabel(startMonth, endMonth)
    const html = buildReportHTML({ reportType, period, today, incomeData, expensesData })

    // Open in new window for print/save as PDF
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
    }

    setLoading(false)
  }

  function buildReportHTML({ reportType, period, today, incomeData, expensesData }: any) {
    const logo = `<img src="https://yoavavni-9dy3.vercel.app/logo-transparent.png" style="height:65px;object-fit:contain;">`
    const businessId = CLINIC.businessNum
    const businessName = 'יואב אבני'

    let incomeSection = ''
    let expensesSection = ''

    if (incomeData) {
      const total = incomeData.total_incl_vat
      const vat_excl = Math.round(total / 1.18 * 100) / 100
      const vat_amt = Math.round((total - vat_excl) * 100) / 100

      const payRows = Object.entries(incomeData.payment_breakdown || {})
        .sort((a: any, b: any) => b[1] - a[1])
        .map(([m, a]: any) => `<tr><td>${m}</td><td style="font-weight:600;color:#0b8a5e">₪${a.toLocaleString('he-IL', {minimumFractionDigits:2})}</td><td>${Math.round(a/total*100)}%</td></tr>`).join('')

      const recRows = incomeData.records.map((r: any, i: number) =>
        `<tr style="background:${i%2===0?'#fff':'#f8fafc'}"><td>${r.date}</td><td>${r.patient}</td><td>${r.service}</td><td>${r.payment_method}</td><td style="font-weight:600">₪${r.amount.toLocaleString()}</td><td style="color:#0b8a5e">${r.status_he}</td></tr>`
      ).join('')

      incomeSection = `
        <div class="section-title" style="color:#0b8a5e;border-color:#0b8a5e">סיכום הכנסות</div>
        <table class="summary-table">
          <thead><tr><th>תיאור</th><th>סכום</th></tr></thead>
          <tbody>
            <tr><td>סה"כ הכנסות כולל מע"מ (18%)</td><td style="font-weight:600">₪${total.toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
            <tr><td>סה"כ הכנסות ללא מע"מ</td><td>₪${vat_excl.toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
            <tr class="total-row" style="background:#f0fdf4!important"><td>סה"כ מע"מ שנגבה</td><td style="color:#0b8a5e">₪${vat_amt.toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
          </tbody>
        </table>
        ${payRows ? `<div class="section-title" style="color:#0b8a5e;border-color:#0b8a5e">פילוח לפי אמצעי תשלום</div><table class="summary-table" style="width:55%"><thead><tr><th>אמצעי תשלום</th><th>סכום</th><th>אחוז</th></tr></thead><tbody>${payRows}</tbody></table>` : ''}
        ${recRows ? `<div class="section-title" style="color:#0b8a5e;border-color:#0b8a5e">פירוט חיובים</div><table class="full-table"><thead><tr><th>תאריך</th><th>מטופל</th><th>שירות</th><th>אמצעי תשלום</th><th>סכום</th><th>סטטוס</th></tr></thead><tbody>${recRows}</tbody></table>` : '<p style="color:#94a3b8;font-size:11px">אין חיובים בתקופה זו</p>'}
      `
    }

    if (expensesData) {
      const catRows = Object.entries(expensesData.by_category || {})
        .sort((a: any, b: any) => b[1] - a[1])
        .map(([c, a]: any) => `<tr><td>${c}</td><td style="font-weight:600;color:#dc2626">₪${a.toLocaleString('he-IL',{minimumFractionDigits:2})}</td><td>${Math.round(a/expensesData.total*100)}%</td></tr>`).join('')

      const expRows = expensesData.expenses.map((e: any, i: number) =>
        `<tr style="background:${i%2===0?'#fff':'#f8fafc'}"><td>${e.date}</td><td>${e.category}</td><td>${e.supplier}</td><td>${e.description}</td><td>${e.payment_method}</td><td style="font-weight:600;color:#dc2626">₪${e.amount.toLocaleString()}</td><td style="color:#7c3aed">₪${e.vat_amount.toLocaleString()}</td></tr>`
      ).join('')

      expensesSection = `
        ${reportType === 'combined' ? '<div style="border-top:2px solid #e2e8f0;margin:20px 0"></div>' : ''}
        <div class="section-title" style="color:#dc2626;border-color:#dc2626">סיכום הוצאות</div>
        <table class="summary-table">
          <thead><tr><th>תיאור</th><th>סכום</th></tr></thead>
          <tbody>
            <tr><td>סה"כ הוצאות כולל מע"מ</td><td style="font-weight:600;color:#dc2626">₪${expensesData.total.toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
            <tr><td>סה"כ הוצאות ללא מע"מ</td><td>₪${(expensesData.total-expensesData.total_vat).toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
            <tr class="total-row" style="background:#fef2f2!important"><td>סה"כ מע"מ מוכר</td><td style="color:#7c3aed">₪${expensesData.total_vat.toLocaleString('he-IL',{minimumFractionDigits:2})}</td></tr>
          </tbody>
        </table>
        ${catRows ? `<div class="section-title" style="color:#dc2626;border-color:#dc2626">פילוח לפי קטגוריה</div><table class="summary-table" style="width:60%"><thead><tr><th>קטגוריה</th><th>סכום</th><th>אחוז</th></tr></thead><tbody>${catRows}</tbody></table>` : ''}
        ${expRows ? `<div class="section-title" style="color:#dc2626;border-color:#dc2626">פירוט הוצאות</div><table class="full-table"><thead><tr><th>תאריך</th><th>קטגוריה</th><th>ספק</th><th>תיאור</th><th>תשלום</th><th>סכום</th><th>מע"מ</th></tr></thead><tbody>${expRows}</tbody></table>` : '<p style="color:#94a3b8;font-size:11px">אין הוצאות בתקופה זו</p>'}
      `
    }

    const titleMap = { income: 'דוח פירוט הכנסות', expenses: 'דוח פירוט הוצאות', combined: 'דוח הכנסות והוצאות' }

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;direction:rtl;background:#fff;color:#1e293b;font-size:11px}
.page{padding:24px 28px;max-width:820px;margin:0 auto;background:#fff}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #1a3a5c}
.report-title h1{font-size:20px;font-weight:700;color:#1a3a5c}
.report-title p{font-size:10px;color:#94a3b8;margin-top:4px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap}
.info-item{display:flex;gap:5px;font-size:10px}
.info-label{font-weight:700;color:#64748b}
.section-title{font-size:13px;font-weight:700;color:#1a3a5c;margin-bottom:8px;margin-top:4px;border-right:4px solid #3eb8e5;padding-right:8px;padding-top:2px;padding-bottom:2px}
table{border-collapse:collapse;margin-bottom:16px}
th{background:#1a3a5c;color:#fff;padding:7px 10px;text-align:right;font-size:10px}
td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px;text-align:right}
.summary-table{width:60%}
.summary-table tr:nth-child(even) td{background:#f8fafc}
.total-row td{font-weight:700;border-top:1px solid #e2e8f0;font-size:11px}
.full-table{width:100%}
.full-table th{font-size:9px;padding:5px 7px}
.full-table td{font-size:9px;padding:4px 7px}
.footer{border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;color:#94a3b8;font-size:8px;margin-top:12px}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
<div class="header">
  <div class="report-title">
    <h1>${titleMap[reportType as keyof typeof titleMap]}</h1>
    <p>הופק: ${today}</p>
  </div>
  ${logo}
</div>
<div class="info-box">
  <div class="info-item"><span class="info-label">שם העסק:</span><span>${businessName}</span></div>
  <div class="info-item"><span class="info-label">מספר עוסק:</span><span>${businessId}</span></div>
  <div class="info-item"><span class="info-label">תקופה:</span><span>${period}</span></div>
</div>
${incomeSection}
${expensesSection}
<div class="footer">קליניקת יואב אבני | תרשיש 8, גילון | 054-5953889 | yoav-avni-clinic.com | מספר עוסק ${businessId}</div>
</div>
</body>
</html>`
  }

  const inp = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', background: '#fff' } as const

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>📄 הפקת דוחות PDF</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>בחר סוג דוח ותקופה</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '560px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          {/* Report type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' as const }}>סוג דוח</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {[
                { key: 'income', label: 'הכנסות', icon: '💰', color: '#0b8a5e' },
                { key: 'expenses', label: 'הוצאות', icon: '💸', color: '#dc2626' },
                { key: 'combined', label: 'משולב', icon: '📊', color: '#1a3a5c' },
              ].map(t => (
                <button key={t.key} onClick={() => setReportType(t.key as any)} style={{
                  padding: '14px 10px', border: `2px solid ${reportType === t.key ? t.color : '#e2e8f0'}`,
                  borderRadius: '10px', background: reportType === t.key ? `${t.color}10` : '#fff',
                  cursor: 'pointer', fontFamily: 'Heebo, sans-serif', textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{t.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: reportType === t.key ? '700' : '400', color: reportType === t.key ? t.color : '#64748b' }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' as const }}>תקופה</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>מ-</div>
                <input type="month" value={startMonth} onChange={e => setStartMonth(e.target.value)} style={inp} />
              </div>
              <div style={{ color: '#94a3b8', marginTop: '14px' }}>—</div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px' }}>עד</div>
                <input type="month" value={endMonth} onChange={e => setEndMonth(e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button onClick={generateReport} disabled={loading} style={{
            width: '100%', padding: '14px', background: loading ? '#94a3b8' : '#1a3a5c',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Heebo, sans-serif', boxShadow: '0 4px 14px rgba(26,58,92,0.25)',
          }}>
            {loading ? '⏳ מכין דוח...' : '📄 הפק דוח PDF'}
          </button>

          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px' }}>
            הדוח ייפתח בחלון חדש — לחץ Ctrl+P לשמירה כ-PDF
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

import { NextRequest, NextResponse } from 'next/server'

const VAT = 0.18

function withoutVAT(amount: number) { return Math.round(amount / (1 + VAT)) }
function vatAmount(amount: number) { return amount - withoutVAT(amount) }

export async function POST(req: NextRequest) {
  try {
    const { patient, billing, type } = await req.json()
    // type: 'receipt' = חשבונית קבלה, 'invoice' = חשבונית עסקה

    const docTitle = type === 'receipt' ? 'חשבונית קבלה' : 'חשבונית עסקה'
    const date = new Date().toLocaleDateString('he-IL')
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`
    const amount = billing.amount || 0
    const amountNoVat = withoutVAT(amount)
    const vat = vatAmount(amount)

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; direction: rtl; color: #1a3a5c; margin: 0; padding: 0; background: #f8fafc; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; }
  .header { background: linear-gradient(135deg, #1a3a5c, #1e4a7a); padding: 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 28px; }
  .header h1 span { color: #3eb8e5; }
  .header p { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; }
  .badge { display: inline-block; background: rgba(62,184,229,0.2); color: #3eb8e5; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 12px; }
  .body { padding: 32px; }
  .doc-type { font-size: 22px; font-weight: 800; color: #1a3a5c; margin-bottom: 4px; }
  .doc-meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; color: #64748b; }
  .section { background: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .section h3 { margin: 0 0 12px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .total-box { background: #1a3a5c; color: #fff; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
  .total-box .label { font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
  .total-box .amount { font-size: 36px; font-weight: 900; }
  .vat-row { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.7); }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .paid { background: #d1fae5; color: #065f46; }
  .pending { background: #fef3c7; color: #92400e; }
  .footer { text-align: center; padding: 24px; background: #f8fafc; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1><span>YOAV</span>AVNI</h1>
    <p>קליניקת יואב אבני | פיזיותרפיה ושיקום</p>
    <div class="badge">${docTitle}</div>
  </div>
  <div class="body">
    <div class="doc-type">${docTitle}</div>
    <div class="doc-meta">
      <span>מספר: ${invoiceNum}</span>
      <span>תאריך: ${date}</span>
    </div>

    <div class="section">
      <h3>פרטי מטופל</h3>
      <div class="row"><span>שם</span><span><strong>${patient.first_name} ${patient.last_name}</strong></span></div>
      ${patient.phone ? `<div class="row"><span>טלפון</span><span>${patient.phone}</span></div>` : ''}
      ${patient.email ? `<div class="row"><span>אימייל</span><span>${patient.email}</span></div>` : ''}
    </div>

    <div class="section">
      <h3>פרטי שירות</h3>
      <div class="row"><span>תיאור</span><span><strong>${billing.description || 'טיפול פיזיותרפיה'}</strong></span></div>
      <div class="row"><span>אמצעי תשלום</span><span>${billing.payment_method || 'לא צוין'}</span></div>
      <div class="row"><span>סטטוס</span><span><span class="status-badge ${billing.status === 'paid' ? 'paid' : 'pending'}">${billing.status === 'paid' ? '✅ שולם' : '⏳ ממתין'}</span></span></div>
    </div>

    <div class="total-box">
      <div class="label">סה"כ לתשלום</div>
      <div class="amount">₪${amount.toLocaleString()}</div>
      <div class="vat-row">
        <span>לפני מע"מ (18%): ₪${amountNoVat.toLocaleString()}</span>
        <span>מע"מ: ₪${vat.toLocaleString()}</span>
      </div>
    </div>

    <div style="font-size:12px; color:#94a3b8; text-align:center;">
      עוסק מורשה מס' 305111551 | רישיון PT 10-163580
    </div>
  </div>
  <div class="footer">
    📍 תרשיש 8, גילון &nbsp;|&nbsp; 📞 054-5953889 &nbsp;|&nbsp; 🌐 yoav-avni-clinic.com
  </div>
</div>
</body>
</html>`

    const emailTo = patient.email
    if (!emailTo) {
      return NextResponse.json({ error: 'אין כתובת מייל למטופל' }, { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'קליניקת יואב אבני <onboarding@resend.dev>',
        to: [emailTo],
        subject: `${docTitle} - קליניקת יואב אבני`,
        html,
      }),
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

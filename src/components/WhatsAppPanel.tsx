'use client'
import { useState } from 'react'
import { MESSAGE_TEMPLATES, MessageParams } from '@/lib/whatsapp-messages'

interface Props {
  patient: any
  appointments?: any[]
}

export default function WhatsAppPanel({ patient, appointments }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customMsg, setCustomMsg] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [amount, setAmount] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [showPanel, setShowPanel] = useState(false)

  // Get next appointment if available
  const nextAppt = appointments?.find(a => a.date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled')

  function generateMessage(templateId: string) {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId)
    if (!template) return ''

    const params: MessageParams = {
      patientName: `${patient.first_name} ${patient.last_name}`,
      date: date || (nextAppt ? new Date(nextAppt.date).toLocaleDateString('he-IL') : ''),
      time: time || (nextAppt ? nextAppt.time?.slice(0, 5) : ''),
      serviceType: serviceType || nextAppt?.service?.name_he || '',
      invoiceAmount: amount ? Number(amount) : undefined,
      city: patient.city || '',
      therapistName: 'יואב אבני',
    }

    return template.getMessage(params)
  }

  function sendWhatsApp(msg: string) {
    const phone = patient.phone?.replace(/^0/, '').replace(/-/g, '')
    if (!phone) { alert('אין מספר טלפון למטופל'); return }
    const url = `https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  function handleSelect(id: string) {
    setSelected(id)
    setCustomMsg(generateMessage(id))
  }

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', background: '#25d366', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '12px',
          fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
        }}
      >
        💬 WhatsApp
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', background: '#25d366', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px' }}>💬 שליחת WhatsApp</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              {patient.first_name} {patient.last_name} · {patient.phone}
            </div>
          </div>
          <button onClick={() => setShowPanel(false)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            fontSize: '18px', fontFamily: 'Heebo, sans-serif',
          }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
          {/* Template buttons */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              בחר תבנית הודעה
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {MESSAGE_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  style={{
                    padding: '10px 12px', border: `2px solid ${selected === t.id ? '#25d366' : '#e2e8f0'}`,
                    borderRadius: '8px', background: selected === t.id ? '#f0fdf4' : '#fff',
                    cursor: 'pointer', textAlign: 'right', fontFamily: 'Heebo, sans-serif',
                    fontSize: '12px', fontWeight: selected === t.id ? '700' : '400',
                    color: '#1e293b', transition: 'all 0.1s',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          {selected && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>תאריך</label>
                <input type="date" value={date} onChange={e => { setDate(e.target.value); setCustomMsg(generateMessage(selected)) }}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>שעה</label>
                <input type="time" value={time} onChange={e => { setTime(e.target.value); setCustomMsg(generateMessage(selected)) }}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
              </div>
              {selected === 'payment_request' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>סכום ₪</label>
                  <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setCustomMsg(generateMessage(selected)) }}
                    placeholder="350"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'Heebo, sans-serif', outline: 'none' }} />
                </div>
              )}
            </div>
          )}

          {/* Message preview + edit */}
          {selected && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                תצוגה מקדימה — ניתן לערוך
              </div>
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                style={{
                  width: '100%', minHeight: '200px', padding: '12px',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '13px', lineHeight: '1.6', resize: 'vertical',
                  fontFamily: 'Heebo, sans-serif', outline: 'none',
                  background: '#f8fffe',
                }}
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowPanel(false)} style={{
            padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px',
            background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
          }}>
            ביטול
          </button>
          <button
            onClick={() => customMsg && sendWhatsApp(customMsg)}
            disabled={!customMsg}
            style={{
              flex: 1, padding: '10px', background: customMsg ? '#25d366' : '#94a3b8',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '800', cursor: customMsg ? 'pointer' : 'not-allowed',
              fontFamily: 'Heebo, sans-serif',
            }}
          >
            📤 שלח WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

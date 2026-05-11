'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, CLINIC } from '@/lib/supabase'

interface RiskPatient {
  id: string
  first_name: string
  last_name: string
  phone: string
  lastApptDate: string | null
  daysSince: number
  hasUpcoming: boolean
  hasDebt: boolean
  cancellations: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

function calcRisk(p: RiskPatient): { score: number; level: 'low' | 'medium' | 'high' } {
  let score = 0
  if (p.daysSince > 60) score += 40
  else if (p.daysSince > 30) score += 20
  else if (p.daysSince > 14) score += 10
  if (!p.hasUpcoming) score += 25
  if (p.hasDebt) score += 20
  if (p.cancellations >= 3) score += 15
  else if (p.cancellations >= 2) score += 8

  const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
  return { score, level }
}

function buildWAMessage(name: string): string {
  return `מה שלומך ${name} 😊\n\nאנחנו רואים שלא היית בקליניקה לאחרונה. איך אתה מרגיש?\n\nנשמח לעזור לקדם אותך בתהליך — מקווים שהכל בסדר, אם יש קושי שצריך לדבר עליו נשמח לעזור.\n\n${CLINIC.name}\n📞 ${CLINIC.phone}`
}

export default function PredictivePage() {
  const [patients, setPatients] = useState<RiskPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all')
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Get all active patients
    const { data: activePatients } = await supabase
      .from('patients')
      .select('id,first_name,last_name,phone')
      .eq('status', 'active')

    if (!activePatients) { setLoading(false); return }

    // Get last appointment per patient
    const { data: lastAppts } = await supabase
      .from('appointments')
      .select('patient_id,date')
      .lte('date', today)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    // Get upcoming appointments
    const { data: upcomingAppts } = await supabase
      .from('appointments')
      .select('patient_id')
      .gte('date', today)
      .neq('status', 'cancelled')

    // Get debts
    const { data: debts } = await supabase
      .from('billing_records')
      .select('patient_id')
      .eq('status', 'pending')

    // Get cancellations (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const { data: cancels } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('status', 'cancelled')
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])

    // Build maps
    const lastApptMap: Record<string, string> = {}
    ;(lastAppts || []).forEach(a => {
      if (!lastApptMap[a.patient_id]) lastApptMap[a.patient_id] = a.date
    })

    const upcomingSet = new Set((upcomingAppts || []).map(a => a.patient_id))
    const debtSet = new Set((debts || []).map(d => d.patient_id))
    const cancelMap: Record<string, number> = {}
    ;(cancels || []).forEach(c => { cancelMap[c.patient_id] = (cancelMap[c.patient_id] || 0) + 1 })

    // Calculate risk for each patient
    const result: RiskPatient[] = activePatients.map(p => {
      const lastDate = lastApptMap[p.id] || null
      const daysSince = lastDate
        ? Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const partial: RiskPatient = {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        lastApptDate: lastDate,
        daysSince,
        hasUpcoming: upcomingSet.has(p.id),
        hasDebt: debtSet.has(p.id),
        cancellations: cancelMap[p.id] || 0,
        riskScore: 0,
        riskLevel: 'low',
      }

      const { score, level } = calcRisk(partial)
      return { ...partial, riskScore: score, riskLevel: level }
    })

    // Sort by risk score
    result.sort((a, b) => b.riskScore - a.riskScore)

    // Only show patients with some risk
    setPatients(result.filter(p => p.riskScore > 0 && !p.hasUpcoming))
    setLoading(false)
  }

  function sendWA(patient: RiskPatient) {
    const phone = patient.phone?.replace(/^0/, '').replace(/-/g, '')
    const msg = buildWAMessage(patient.first_name)
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    setSentTo(p => new Set(Array.from(p).concat(patient.id)))
  }

  const filtered = patients.filter(p => {
    if (filter === 'high') return p.riskLevel === 'high'
    if (filter === 'medium') return p.riskLevel === 'medium' || p.riskLevel === 'high'
    return true
  })

  const highCount = patients.filter(p => p.riskLevel === 'high').length
  const medCount = patients.filter(p => p.riskLevel === 'medium').length

  const riskConfig = {
    high:   { label: 'סיכון גבוה',   bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
    medium: { label: 'מעקב',         bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    low:    { label: 'בסדר',         bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🎯 מטופלים בסיכון לנשירה</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            מטופלים פעילים ללא תור קרוב — מסודרים לפי רמת סיכון
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', borderRight: '3px solid #dc2626', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>{highCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>סיכון גבוה</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', borderRight: '3px solid #f59e0b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{medCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>מעקב</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', borderRight: '3px solid #1a3a5c', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>{patients.length}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>סה"כ ללא תור</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '16px', width: 'fit-content' }}>
          {[
            { key: 'all', label: 'הכל' },
            { key: 'high', label: '🔴 סיכון גבוה' },
            { key: 'medium', label: '🟡 מעקב ומעלה' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '12px',
              fontWeight: filter === f.key ? '700' : '400',
              background: filter === f.key ? '#1a3a5c' : 'transparent',
              color: filter === f.key ? '#fff' : '#64748b',
              fontFamily: 'Heebo, sans-serif',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>מחשב סיכונים...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a5c' }}>כל המטופלים בסדר!</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>אין מטופלים בסיכון לנשירה</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {filtered.map((p, i) => {
              const rc = riskConfig[p.riskLevel]
              const isSent = sentTo.has(p.id)
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: isSent ? '#f8fff8' : '#fff',
                }}>
                  {/* Risk indicator */}
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rc.dot, flexShrink: 0 }} />

                  {/* Patient info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>
                      {p.first_name} {p.last_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {p.lastApptDate ? (
                        <span>טיפול אחרון: {new Date(p.lastApptDate).toLocaleDateString('he-IL')} ({p.daysSince} ימים)</span>
                      ) : (
                        <span>אין תורים קודמים</span>
                      )}
                      {p.hasDebt && <span style={{ color: '#dc2626' }}>• חוב פתוח</span>}
                      {p.cancellations > 0 && <span style={{ color: '#f59e0b' }}>• {p.cancellations} ביטולים</span>}
                    </div>
                  </div>

                  {/* Risk badge */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    background: rc.bg, color: rc.color, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {rc.label}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => sendWA(p)} style={{
                      padding: '6px 12px',
                      background: isSent ? '#d1fae5' : '#25d366',
                      color: isSent ? '#065f46' : '#fff',
                      border: 'none', borderRadius: '8px', fontSize: '12px',
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                      {isSent ? '✅ נשלח' : '💬 שלח WA'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', fontSize: '11px', color: '#64748b' }}>
          <div style={{ fontWeight: '700', marginBottom: '8px' }}>איך מחושב הציון:</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>⏱ 30+ יום ללא תור → +20</span>
            <span>⏱ 60+ יום ללא תור → +40</span>
            <span>❌ אין תור עתידי → +25</span>
            <span>💸 חוב פתוח → +20</span>
            <span>🚫 2+ ביטולים → +8</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

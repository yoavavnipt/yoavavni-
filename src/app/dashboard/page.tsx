'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase, APPOINTMENT_STATUS } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const VAT = 0.18
function withoutVAT(n: number) { return Math.round(n / (1 + VAT)) }

// ===== COMPLIANCE WIDGET =====

const TASK_ICONS: Record<string, string> = {
  backup: '💾',
  data_retention: '🗄️',
  tax_token: '🔑',
}

const TASK_COLORS: Record<string, { bg: string; border: string; text: string; btn: string }> = {
  overdue: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', btn: '#dc2626' },
  soon:    { bg: '#fef9c3', border: '#fde047', text: '#854d0e', btn: '#ca8a04' },
  ok:      { bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46', btn: '#16a34a' },
}

function ComplianceWidget() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('compliance_tasks')
      .select('*')
      .order('due_date')
    setTasks(data || [])
    setLoading(false)
  }

  function getStatus(task: any) {
    const today = new Date()
    const due = new Date(task.due_date)
    const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return { status: 'overdue', daysLeft, label: `באיחור של ${Math.abs(daysLeft)} ימים` }
    if (daysLeft <= 14) return { status: 'soon', daysLeft, label: `${daysLeft} ימים נותרו` }
    return { status: 'ok', daysLeft, label: `${daysLeft} ימים נותרו` }
  }

  async function completeTask(task: any) {
    setCompleting(task.id)
    const user = JSON.parse(localStorage.getItem('clinic_user') || '{}')

    // חישוב תאריך הבא
    const intervalDays = task.task_type === 'backup' ? 30 : task.task_type === 'data_retention' ? 180 : 90
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + intervalDays)

    await supabase.from('compliance_tasks').update({
      completed_at: new Date().toISOString(),
      completed_by: user.name || 'מנהל',
      due_date: nextDue.toISOString().split('T')[0],
      next_due_date: nextDue.toISOString().split('T')[0],
    }).eq('id', task.id)

    await loadTasks()
    setCompleting(null)
  }

  async function triggerBackup() {
    // ייצוא חשבוניות לCSV
    const { data: invoices } = await supabase.from('invoices').select('*').order('invoice_number')
    const { data: patients } = await supabase.from('patients').select('id,first_name,last_name,phone,email,funding_type,created_at').order('last_name')

    if (invoices && invoices.length > 0) {
      const headers = Object.keys(invoices[0]).join(',')
      const rows = invoices.map(inv => Object.values(inv).map(v => `"${v || ''}"`).join(',')).join('\n')
      const csv = `${headers}\n${rows}`
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `חשבוניות_גיבוי_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }

    if (patients && patients.length > 0) {
      const headers = Object.keys(patients[0]).join(',')
      const rows = patients.map((p: any) => Object.values(p).map(v => `"${v || ''}"`).join(',')).join('\n')
      const csv = `${headers}\n${rows}`
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `מטופלים_גיבוי_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  if (loading) return null

  const alertTasks = tasks.filter(t => {
    const { status } = getStatus(t)
    return status === 'overdue' || status === 'soon'
  })

  if (alertTasks.length === 0 && tasks.length === 0) return null

  return (
    <div style={{ marginBottom: '20px', direction: 'rtl' }}>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c', marginBottom: '10px' }}>
        🛡️ ציות ורגולציה
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map(task => {
          const { status, label } = getStatus(task)
          const colors = TASK_COLORS[status]
          const isExpanded = expanded === task.id

          return (
            <div key={task.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : task.id)}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{TASK_ICONS[task.task_type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: colors.text }}>{task.title}</div>
                  <div style={{ fontSize: '11px', color: colors.text, opacity: 0.8, marginTop: '2px' }}>
                    {label} · תאריך יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: colors.text, opacity: 0.6 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '12px', color: colors.text, lineHeight: '1.6', marginTop: '10px', marginBottom: '12px' }}>
                    {task.description}
                  </div>

                  {task.completed_at && (
                    <div style={{ fontSize: '11px', color: colors.text, opacity: 0.7, marginBottom: '10px' }}>
                      בוצע לאחרונה: {new Date(task.completed_at).toLocaleDateString('he-IL')} על ידי {task.completed_by}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {task.task_type === 'backup' && (
                      <button onClick={triggerBackup}
                        style={{ padding: '8px 14px', background: colors.btn, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                        💾 הורד גיבוי עכשיו
                      </button>
                    )}
                    {task.task_type === 'tax_token' && (
                      <a href="https://www.gov.il/he/service/request-assignment-number-for-tax-invoice" target="_blank" rel="noreferrer"
                        style={{ padding: '8px 14px', background: colors.btn, color: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                        🔑 כנס לאתר רשות המסים
                      </a>
                    )}
                    {task.task_type === 'data_retention' && (
                      <a href="https://supabase.com/dashboard/project/oawbtyhxenfynqinerck" target="_blank" rel="noreferrer"
                        style={{ padding: '8px 14px', background: colors.btn, color: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                        🗄️ בדוק Supabase
                      </a>
                    )}
                    <button onClick={() => completeTask(task)} disabled={completing === task.id}
                      style={{ padding: '8px 14px', background: '#fff', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                      {completing === task.id ? '⏳...' : '✅ סמן כבוצע'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ===== GLOBAL SEARCH =====
function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from('patients').select('id,first_name,last_name,phone,diagnosis').or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`).limit(6)
      setResults(data || []); setOpen(true)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div style={{ position: 'relative' }}>
      <input placeholder="🔍 חפש מטופל..." value={query} onChange={e => setQuery(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', width: '220px', fontFamily: 'Heebo, sans-serif' }} />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#fff', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 100, marginTop: '4px' }}>
          {results.map(p => (
            <div key={p.id} onClick={() => { router.push(`/patients/${p.id}`); setQuery(''); setOpen(false) }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontWeight: '600' }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone} {p.diagnosis ? `· ${p.diagnosis}` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== DAILY BRIEFING =====
function DailyBriefing({ appointments }: { appointments: any[] }) {
  const [show, setShow] = useState(false)
  const [briefing, setBriefing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem('briefing_shown')
    if (lastShown !== today && appointments.length > 0) {
      loadBriefing()
    }
  }, [appointments])

  async function loadBriefing() {
    setLoading(true)
    try {
      const patientIds = appointments.map(a => a.patient_id).filter(Boolean)
      if (patientIds.length === 0) { setLoading(false); return }
      const { data: patients } = await supabase.from('patients').select('id,first_name,last_name,diagnosis,allergies,medications,medical_history').in('id', patientIds)
      const { data: pending } = await supabase.from('billing_records').select('patient_id,amount').eq('status', 'pending').in('patient_id', patientIds)
      const alerts: { type: string; icon: string; color: string; text: string }[] = []
      const debtMap: Record<string, number> = {}
      ;(pending || []).forEach(b => { debtMap[b.patient_id] = (debtMap[b.patient_id] || 0) + b.amount })
      appointments.forEach(appt => {
        const patient = patients?.find(p => p.id === appt.patient_id)
        if (!patient) return
        const name = `${patient.first_name} ${patient.last_name}`
        const time = appt.time?.slice(0, 5)
        if (debtMap[appt.patient_id]) alerts.push({ type: 'payment', icon: '💳', color: '#dc2626', text: `${name} (${time}) — חוב פתוח: ₪${debtMap[appt.patient_id].toLocaleString()}` })
        if (patient.allergies) alerts.push({ type: 'medical', icon: '⚠️', color: '#e8a020', text: `${name} (${time}) — אלרגיה: ${patient.allergies}` })
        if (patient.medications) alerts.push({ type: 'medical', icon: '💊', color: '#7c3aed', text: `${name} (${time}) — תרופות: ${patient.medications}` })
        if (patient.diagnosis) alerts.push({ type: 'clinical', icon: '🏥', color: '#1a3a5c', text: `${name} (${time}) — ${patient.diagnosis}` })
      })
      if (alerts.length > 0) {
        setBriefing({ alerts, count: appointments.length, date: new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }) })
        setShow(true)
        localStorage.setItem('briefing_shown', new Date().toDateString())
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function dismiss() { setShow(false); setDismissed(true) }
  if (!show || dismissed || !briefing) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', direction: 'rtl', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🌅</div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c', margin: 0 }}>בוקר טוב, יואב!</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{briefing.date} · {briefing.count} תורים היום</p>
          </div>
          <button onClick={dismiss} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>🚨 דגשים חשובים להיום</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefing.alerts.map((alert: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', borderRadius: '10px', background: '#f8fafc', border: `1px solid ${alert.color}20` }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{alert.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{alert.text}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={dismiss} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
          הבנתי, מתחיל את היום! 💪
        </button>
      </div>
    </div>
  )
}

// ===== MAIN DASHBOARD =====
export default function DashboardPage() {
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, monthIncome: 0, pending: 0 })
  const [appointments, setAppointments] = useState<any[]>([])
  const [debtors, setDebtors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showVAT, setShowVAT] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const [
        { count: patients },
        { count: todayAppts },
        { data: billing },
        { count: pending },
        { data: appts },
        { data: billingPending },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active').or('is_organization.is.null,is_organization.eq.false'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
        supabase.from('billing_records').select('amount').eq('status', 'paid').gte('created_at', startMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*, patient:patients(first_name,last_name,phone), service:service_types(name_he,icon,color)').eq('date', today).order('time').limit(15),
        supabase.from('billing_records').select('amount,patient_id,patient:patients(first_name,last_name,phone),description,created_at').eq('status','pending').order('created_at', { ascending: false }),
      ])
      const monthIncome = billing?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0
      setStats({ patients: patients || 0, todayAppts: todayAppts || 0, monthIncome, pending: pending || 0 })
      setAppointments(appts || [])
      const debtMap: Record<string, any> = {}
      ;(billingPending || []).forEach(b => {
        const pid = b.patient_id
        if (!debtMap[pid]) debtMap[pid] = { name: `${(b.patient as any)?.first_name} ${(b.patient as any)?.last_name}`, phone: (b.patient as any)?.phone, total: 0, count: 0 }
        debtMap[pid].total += (b.amount || 0)
        debtMap[pid].count++
      })
      setDebtors(Object.values(debtMap).sort((a, b) => b.total - a.total).slice(0, 8))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const quickActions = [
    { icon: '👤', label: 'מטופל חדש', href: '/patients/new', color: '#1a3a5c' },
    { icon: '📅', label: 'תור חדש',   href: '/calendar/new', color: '#3eb8e5' },
    { icon: '📋', label: 'SOAP חדש',  href: '/records/new',  color: '#7c3aed' },
    { icon: '💳', label: 'שלח תשלום', href: '/billing',      color: '#0b8a5e' },
  ]

  const displayIncome = showVAT ? stats.monthIncome : withoutVAT(stats.monthIncome)

  if (loading) return <AppLayout><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>טוען...</div></AppLayout>

  return (
    <AppLayout>
      <DailyBriefing appointments={appointments} />
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>ראשי</h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>הכנסות:</span>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <button onClick={() => setShowVAT(true)} style={{ padding: '4px 8px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: showVAT ? '700' : '400', background: showVAT ? '#1a3a5c' : 'transparent', color: showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>כולל מע"מ</button>
                  <button onClick={() => setShowVAT(false)} style={{ padding: '4px 8px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: !showVAT ? '700' : '400', background: !showVAT ? '#1a3a5c' : 'transparent', color: !showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>ללא מע"מ</button>
                </div>
              </div>
              <GlobalSearch />
            </div>
          </div>
        </div>

        {/* ===== COMPLIANCE WIDGET ===== */}
        <ComplianceWidget />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
          <Link href="/patients?filter=active" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #1e4a7a', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>{stats.patients}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>מטופלים פעילים</div>
            </div>
          </Link>
          <Link href="/calendar" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #3eb8e5', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>{stats.todayAppts}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>תורים היום</div>
            </div>
          </Link>
          <Link href="/billing" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #0b8a5e', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>₪{displayIncome.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>הכנסה החודש</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{showVAT ? `ללא מע"מ: ₪${withoutVAT(stats.monthIncome).toLocaleString()}` : `כולל מע"מ: ₪${stats.monthIncome.toLocaleString()}`}</div>
            </div>
          </Link>
          <Link href="/calendar?filter=pending" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', borderRight: '3px solid #e8a020', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>⏳</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a3a5c' }}>{stats.pending}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ממתינים לאישור</div>
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} style={{ background: '#fff', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'block', color: '#1e293b' }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{a.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '600' }}>{a.label}</div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#1a3a5c' }}>📅 תורים היום</div>
              <Link href="/calendar" style={{ fontSize: '12px', color: '#3eb8e5', fontWeight: '600' }}>הצג הכל ←</Link>
            </div>
            {appointments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div><div>אין תורים להיום</div></div>
            ) : appointments.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < appointments.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ fontWeight: '700', color: '#1a3a5c', fontSize: '14px', minWidth: '52px' }}>{a.time?.slice(0, 5)}</div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: a.service?.color ? `${a.service.color}20` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{a.service?.icon || '🏥'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/patients/${a.patient_id}`} style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c', textDecoration: 'none' }}>{a.patient?.first_name} {a.patient?.last_name}</Link>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{a.service?.name_he || 'טיפול'}{a.patient?.phone && <a href={`https://wa.me/972${a.patient.phone.replace(/^0/, '').replace(/-/g, '')}`} target="_blank" rel="noreferrer" style={{ marginRight: '8px', color: '#25d366', fontWeight: '600' }}>WA</a>}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626' }}>💸 חובות פתוחים</div>
              <Link href="/billing?filter=pending" style={{ fontSize: '12px', color: '#3eb8e5', fontWeight: '600' }}>הצג הכל ←</Link>
            </div>
            {debtors.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div><div>אין חובות פתוחים</div></div>
            ) : debtors.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < debtors.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{d.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.count} חיובים פתוחים</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>₪{(showVAT ? d.total : withoutVAT(d.total)).toLocaleString()}</div>
                </div>
                {d.phone && <a href={`https://wa.me/972${d.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '5px 10px', background: '#25d366', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>💬 WA</a>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = APPOINTMENT_STATUS[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
}

'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const FUNDER_TYPES = [
  { id: 'private',   label: 'פרטי',         icon: '💳' },
  { id: 'hmo',       label: 'קופת חולים',   icon: '🏥' },
  { id: 'insurance', label: 'ביטוח',         icon: '🛡️' },
  { id: 'team',      label: 'קבוצה',         icon: '⚽' },
]

const MESSAGE_TEMPLATES = [
  {
    id: 'running', icon: '🏃', label: 'קהילת ריצה',
    text: `שלום {שם} 😊\n\nאנחנו רוצים לשתף אותך בפרויקט חדש ומרגש שאנחנו מקיימים בקליניקה — קבוצת ריצה מקצועית בליווי פיזיותרפיסט!\n\n🏃 תוכנית ריצה מותאמת אישית\n📊 מעקב עומסים למניעת פציעות\n🏥 ליווי רפואי מלא\n\nמעוניין לשמוע עוד?\n👉 https://yoavavni-9dy3.vercel.app/running\n\nקליניקת יואב אבני`,
  },
  {
    id: 'insoles', icon: '👟', label: 'מדרסים',
    text: `שלום {שם} 😊\n\nרצינו לעדכן אותך — בקליניקה יש עכשיו שירות חדש: מדרסים אורטופדיים בהתאמה אישית עם סורק דיגיטלי מתקדם!\n\n📡 סריקה דיגיטלית עם Albert 2 Pro\n🏥 ליווי פיזיותרפיסט מוסמך\n💳 ניתן לקבל החזר מקופ"ח / ביטוח\n\nלפרטים נוספים:\n👉 https://yoavavni-9dy3.vercel.app/insoles\n\nקליניקת יואב אבני`,
  },
  {
    id: 'return', icon: '💙', label: 'החזרה לטיפול',
    text: `שלום {שם} 😊\n\nהיה לנו כיף לעבוד איתך! רצינו לבדוק — האם הכל בסדר? איך אתה מרגיש?\n\nאם יש משהו שמפריע או שפשוט רצית לעשות check-up — אנחנו כאן.\n\n📅 לתיאום תור:\nhttps://yoavavni-9dy3.vercel.app/portal\n\nקליניקת יואב אבני`,
  },
  {
    id: 'custom', icon: '✏️', label: 'הודעה מותאמת',
    text: `שלום {שם} 😊\n\n`,
  },
]

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'lead' | 'inactive'>('all')
  const [tab, setTab] = useState<'patients' | 'archive'>('patients')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [archiving, setArchiving] = useState(false)

  const [funderPanel, setFunderPanel] = useState<any>(null)
  const [funderType, setFunderType] = useState('')
  const [funderName, setFunderName] = useState('')
  const [funderNames, setFunderNames] = useState<string[]>([])
  const [newFunderName, setNewFunderName] = useState('')
  const [showAddNew, setShowAddNew] = useState(false)
  const [savingFunder, setSavingFunder] = useState(false)

  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'active' | 'inactive'>('inactive')
  const [broadcastPatients, setBroadcastPatients] = useState<any[]>([])
  const [broadcastSelected, setBroadcastSelected] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('running')
  const [customMessage, setCustomMessage] = useState('')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [broadcastSearch, setBroadcastSearch] = useState('')

  useEffect(() => { load() }, [search, filter, tab])
  useEffect(() => { loadFunderNames() }, [])
  useEffect(() => { if (showBroadcast) loadBroadcastPatients() }, [showBroadcast, broadcastFilter])

  async function load() {
    setLoading(true)
    setSelected([])
    const savedUser = localStorage.getItem('clinic_user')
    const currentUser = savedUser ? JSON.parse(savedUser) : null
    let q = supabase.from('patients').select('*').order('first_name')
    if (tab === 'archive') {
      q = q.eq('is_archived', true)
    } else {
      q = q.or('is_archived.is.null,is_archived.eq.false')
      if (filter !== 'all') q = q.eq('status', filter)
    }
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,id_number.ilike.%${search}%`)
    if (currentUser?.role === 'therapist') {
      const { data: myAppts } = await supabase.from('appointments').select('patient_id').eq('notes', currentUser.name).or(`notes.ilike.%${currentUser.name}%`)
      const { data: myRecords } = await supabase.from('treatment_records').select('patient_id').eq('therapist_name', currentUser.name)
      const patientIds = Array.from(new Set([...(myAppts || []).map((a: any) => a.patient_id), ...(myRecords || []).map((r: any) => r.patient_id)]))
      if (patientIds.length > 0) { q = q.in('id', patientIds) } else { setPatients([]); setLoading(false); return }
    }
    const { data } = await q
    setPatients(data || [])
    setLoading(false)
  }

  async function loadFunderNames() {
    const { data } = await supabase.from('patients').select('funder_name').not('funder_name', 'is', null).neq('funder_name', '')
    const names = Array.from(new Set((data || []).map((p: any) => p.funder_name).filter(Boolean))) as string[]
    setFunderNames(names.sort())
  }

  async function loadBroadcastPatients() {
    setBroadcastLoading(true)
    let q = supabase.from('patients').select('id,first_name,last_name,phone,status,diagnosis').or('is_archived.is.null,is_archived.eq.false').order('first_name')
    if (broadcastFilter !== 'all') q = q.eq('status', broadcastFilter)
    const { data } = await q
    setBroadcastPatients(data || [])
    // ברירת מחדל — ללא סימון
    setBroadcastSelected([])
    setBroadcastLoading(false)
  }

  const filteredBroadcastPatients = broadcastPatients.filter(p =>
    broadcastSearch === '' ||
    `${p.first_name} ${p.last_name}`.includes(broadcastSearch) ||
    p.phone?.includes(broadcastSearch)
  )

  function selectAllBroadcast() {
    setBroadcastSelected(filteredBroadcastPatients.filter(p => p.phone).map(p => p.id))
  }

  function clearAllBroadcast() {
    setBroadcastSelected([])
  }

  function getMessageForPatient(patient: any) {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)
    const text = selectedTemplate === 'custom' ? customMessage : template?.text || ''
    return text.replace('{שם}', patient.first_name || `${patient.first_name} ${patient.last_name}`)
  }

  function openWA(patient: any) {
    const phone = patient.phone?.replace(/^0/, '').replace(/-/g, '')
    const msg = encodeURIComponent(getMessageForPatient(patient))
    window.open(`https://wa.me/972${phone}?text=${msg}`, '_blank')
  }

  function sendAll() {
    const toSend = broadcastPatients.filter(p => broadcastSelected.includes(p.id) && p.phone)
    setSentCount(0)
    toSend.forEach((p, i) => {
      setTimeout(() => { openWA(p); setSentCount(c => c + 1) }, i * 1500)
    })
  }

  function openFunderPanel(p: any) {
    setFunderPanel(p); setFunderType(p.funder_type || ''); setFunderName(p.funder_name || ''); setNewFunderName(''); setShowAddNew(false)
  }

  async function saveFunder() {
    if (!funderPanel) return
    setSavingFunder(true)
    const finalName = showAddNew ? newFunderName : funderName
    await supabase.from('patients').update({ funder_type: funderType, funder_name: finalName }).eq('id', funderPanel.id)
    setSavingFunder(false)
    setFunderPanel(null)
    if (showAddNew && newFunderName && !funderNames.includes(newFunderName)) setFunderNames(prev => [...prev, newFunderName].sort())
    load()
  }

  function toggleSelect(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function toggleAll() { setSelected(prev => prev.length === patients.length ? [] : patients.map(p => p.id)) }
  function toggleBroadcast(id: string) { setBroadcastSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  async function archiveSelected() {
    if (selected.length === 0) return
    if (!confirm(tab === 'archive' ? `להחזיר ${selected.length} מטופלים?` : `להעביר ${selected.length} לארכיון?`)) return
    setArchiving(true)
    await supabase.from('patients').update({ is_archived: tab !== 'archive' }).in('id', selected)
    setArchiving(false)
    load()
  }

  async function archiveOne(id: string, toArchive: boolean) {
    await supabase.from('patients').update({ is_archived: toArchive }).eq('id', id)
    load()
  }

  const filterTabs = [
    { key: 'all', label: 'הכל' }, { key: 'active', label: 'פעיל' },
    { key: 'lead', label: 'ליד' }, { key: 'inactive', label: 'לא פעיל' },
  ]

  const currentTemplate = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>{tab === 'archive' ? '📦 ארכיון מטופלים' : 'מטופלים'}</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{patients.length} נמצאו</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selected.length > 0 && (
              <button onClick={archiveSelected} disabled={archiving} style={{ padding: '9px 16px', background: tab === 'archive' ? '#0b8a5e' : '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {archiving ? '⏳...' : tab === 'archive' ? `↩️ החזר (${selected.length})` : `📦 ארכיון (${selected.length})`}
              </button>
            )}
            <button onClick={() => { setShowBroadcast(true); setBroadcastSearch(''); setBroadcastSelected([]) }} style={{ padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
              📢 רשימת תפוצה
            </button>
            {tab === 'patients' && (
              <Link href="/patients/new" style={{ padding: '9px 18px', background: '#1a3a5c', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                + מטופל חדש
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0', marginBottom: '14px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', width: 'fit-content' }}>
          {[{ key: 'patients', label: '👥 מטופלים' }, { key: 'archive', label: '📦 ארכיון' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{ padding: '9px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t.key ? '700' : '400', background: tab === t.key ? '#1a3a5c' : 'transparent', color: tab === t.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input placeholder="🔍 חפש שם, טלפון, ת.ז..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
          {tab === 'patients' && (
            <div style={{ display: 'flex', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {filterTabs.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key as any)} style={{ padding: '9px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: filter === t.key ? '700' : '400', background: filter === t.key ? '#1a3a5c' : 'transparent', color: filter === t.key ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
          ) : patients.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{tab === 'archive' ? '📦' : '👥'}</div>
              <div>{tab === 'archive' ? 'אין מטופלים בארכיון' : 'לא נמצאו מטופלים'}</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '10px 14px', width: '36px' }}>
                      <input type="checkbox" checked={selected.length === patients.length && patients.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                    </th>
                    {['שם', 'טלפון', 'קופ"ח', 'אבחנה', 'גורם מממן', 'סטטוס', 'פעולות'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', background: selected.includes(p.id) ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafcff' }}>
                      <td style={{ padding: '12px 14px' }}><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer' }} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link href={`/patients/${p.id}`} style={{ fontWeight: '600', color: '#1a3a5c', textDecoration: 'none' }}>{p.first_name} {p.last_name}</Link>
                        {p.id_number && <div style={{ fontSize: '11px', color: '#94a3b8' }}>ת.ז. {p.id_number}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <a href={`tel:${p.phone}`} style={{ color: '#1a3a5c', fontWeight: '500' }}>{p.phone}</a>
                        {p.phone && <a href={`https://wa.me/972${p.phone.replace(/^0/, '').replace(/-/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '11px', color: '#25d366', fontWeight: '600', marginTop: '1px' }}>WhatsApp</a>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{p.hmo || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.diagnosis || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => openFunderPanel(p)} style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: p.funder_type ? '#f0f9ff' : '#f8fafc', color: p.funder_type ? '#0369a1' : '#94a3b8', fontSize: '12px', fontWeight: p.funder_type ? '600' : '400', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                          {p.funder_type ? `${FUNDER_TYPES.find(f => f.id === p.funder_type)?.icon || ''} ${p.funder_name || FUNDER_TYPES.find(f => f.id === p.funder_type)?.label || p.funder_type}` : '+ הוסף'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link href={`/patients/${p.id}`} style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#1e293b', fontSize: '12px', fontWeight: '500' }}>פרופיל</Link>
                          {tab === 'patients' ? (
                            <>
                              <Link href={`/calendar/new?patient=${p.id}`} style={{ padding: '5px 10px', background: '#3eb8e5', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: '500' }}>+ תור</Link>
                              <button onClick={() => archiveOne(p.id, true)} style={{ padding: '5px 10px', background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>📦</button>
                            </>
                          ) : (
                            <button onClick={() => archiveOne(p.id, false)} style={{ padding: '5px 10px', background: '#d1fae5', border: 'none', borderRadius: '6px', color: '#065f46', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>↩️ החזר</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* פאנל גורם מממן */}
        {funderPanel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={() => setFunderPanel(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)', direction: 'rtl' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div><div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c' }}>💰 גורם מממן</div><div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{funderPanel.first_name} {funderPanel.last_name}</div></div>
                <button onClick={() => setFunderPanel(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>סוג מממן</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {FUNDER_TYPES.map(f => (
                    <button key={f.id} onClick={() => { setFunderType(f.id); setFunderName(''); setShowAddNew(false) }} style={{ padding: '10px', border: `2px solid ${funderType === f.id ? '#1a3a5c' : '#e2e8f0'}`, borderRadius: '10px', background: funderType === f.id ? '#1a3a5c' : '#fff', color: funderType === f.id ? '#fff' : '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{f.icon}</span> {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {funderType && funderType !== 'private' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>{funderType === 'team' ? 'שם הקבוצה' : funderType === 'hmo' ? 'שם קופת החולים' : 'שם חברת הביטוח'}</div>
                  {funderNames.length > 0 && !showAddNew && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                      {funderNames.map(name => (
                        <div key={name} onClick={() => setFunderName(name)} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', background: funderName === name ? '#f0f9ff' : '#fff', color: funderName === name ? '#0369a1' : '#374151', fontWeight: funderName === name ? '600' : '400', borderBottom: '1px solid #f8fafc' }}>
                          {funderName === name ? '✓ ' : ''}{name}
                        </div>
                      ))}
                    </div>
                  )}
                  {!showAddNew ? (
                    <button onClick={() => setShowAddNew(true)} style={{ width: '100%', padding: '9px', border: '1.5px dashed #cbd5e1', borderRadius: '8px', background: 'transparent', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>+ הוסף שם חדש</button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input autoFocus placeholder="הכנס שם חדש..." value={newFunderName} onChange={e => setNewFunderName(e.target.value)} style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #1a3a5c', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', outline: 'none', direction: 'rtl' }} />
                      <button onClick={() => setShowAddNew(false)} style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                    </div>
                  )}
                </div>
              )}
              <button onClick={saveFunder} disabled={savingFunder || !funderType} style={{ width: '100%', padding: '13px', background: !funderType ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: !funderType ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                {savingFunder ? '⏳ שומר...' : '💾 שמור'}
              </button>
            </div>
          </div>
        )}

        {/* פאנל רשימת תפוצה */}
        {showBroadcast && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowBroadcast(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>

              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a5c' }}>📢 רשימת תפוצה</div><div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>שליחת הודעות WhatsApp לקבוצת מטופלים</div></div>
                <button onClick={() => setShowBroadcast(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>

                {/* צד שמאל — תבנית */}
                <div style={{ padding: '20px', borderLeft: '1px solid #f1f5f9', overflowY: 'auto' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px' }}>בחר תבנית הודעה</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {MESSAGE_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{ padding: '10px 14px', border: `2px solid ${selectedTemplate === t.id ? '#7c3aed' : '#e2e8f0'}`, borderRadius: '10px', background: selectedTemplate === t.id ? '#f5f3ff' : '#fff', color: selectedTemplate === t.id ? '#7c3aed' : '#374151', fontSize: '13px', fontWeight: selectedTemplate === t.id ? '700' : '400', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', textAlign: 'right' as const, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                  {selectedTemplate === 'custom' ? (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>תוכן ההודעה</div>
                      <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="כתוב כאן... השתמש ב-{שם} להוסיף שם אישי"
                        style={{ width: '100%', minHeight: '160px', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', resize: 'vertical', outline: 'none' }} />
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>תצוגה מקדימה</div>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', direction: 'rtl' }}>
                        {currentTemplate?.text.replace('{שם}', 'ישראל')}
                      </div>
                    </div>
                  )}
                </div>

                {/* צד ימין — מטופלים */}
                <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>נבחרו: {broadcastSelected.length}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[{ key: 'inactive', label: 'לא פעיל' }, { key: 'active', label: 'פעיל' }, { key: 'all', label: 'הכל' }].map(f => (
                        <button key={f.key} onClick={() => setBroadcastFilter(f.key as any)} style={{ padding: '5px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: broadcastFilter === f.key ? '700' : '400', background: broadcastFilter === f.key ? '#1a3a5c' : '#f1f5f9', color: broadcastFilter === f.key ? '#fff' : '#64748b', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>{f.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* כפתורי סמן/בטל הכל + חיפוש */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      placeholder="🔍 חפש שם או טלפון..."
                      value={broadcastSearch}
                      onChange={e => setBroadcastSearch(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}
                    />
                    <button onClick={selectAllBroadcast} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', color: '#1a3a5c', whiteSpace: 'nowrap' }}>סמן הכל</button>
                    <button onClick={clearAllBroadcast} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', color: '#dc2626', whiteSpace: 'nowrap' }}>בטל הכל</button>
                  </div>

                  <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    {broadcastLoading ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div>
                    ) : (
                      <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                        {filteredBroadcastPatients.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>לא נמצאו מטופלים</div>
                        ) : filteredBroadcastPatients.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid #f8fafc', background: broadcastSelected.includes(p.id) ? '#f5f3ff' : '#fff' }}>
                            <input type="checkbox" checked={broadcastSelected.includes(p.id)} onChange={() => toggleBroadcast(p.id)} style={{ cursor: 'pointer' }} disabled={!p.phone} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: p.phone ? '#1a3a5c' : '#94a3b8' }}>{p.first_name} {p.last_name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone || 'אין טלפון'}</div>
                            </div>
                            {p.phone && (
                              <button onClick={() => openWA(p)} style={{ padding: '4px 10px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>שלח</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    {sentCount > 0 && (
                      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#0b8a5e', fontWeight: '600', textAlign: 'center' }}>✅ נשלחו {sentCount} הודעות</div>
                    )}
                    <button onClick={sendAll} disabled={broadcastSelected.length === 0} style={{ width: '100%', padding: '13px', background: broadcastSelected.length === 0 ? '#94a3b8' : '#25d366', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: broadcastSelected.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif', boxShadow: broadcastSelected.length > 0 ? '0 4px 14px rgba(37,211,102,0.35)' : 'none' }}>
                      📲 שלח לנבחרים ({broadcastSelected.length})
                    </button>
                    <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>WhatsApp ייפתח בנפרד לכל מטופל</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: 'פעיל',     bg: '#d1fae5', color: '#065f46' },
    lead:     { label: 'ליד',      bg: '#fef3c7', color: '#92400e' },
    inactive: { label: 'לא פעיל', bg: '#f1f5f9', color: '#475569' },
  }
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

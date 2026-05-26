'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const inp = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', outline:'none', fontFamily:'Heebo, sans-serif', background:'#fff' } as const
const lbl = { display:'block' as const, fontSize:'11px', fontWeight:'700' as const, color:'#64748b', marginBottom:'4px', textTransform:'uppercase' as const }

const VAT = 0.18
function withoutVAT(n: number) { return Math.round(n / (1 + VAT)) }
function vatAmount(n: number) { return n - withoutVAT(n) }

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [athletes, setAthletes] = useState<any[]>([])
  const [billing, setBilling] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAddAthlete, setShowAddAthlete] = useState(false)
  const [allPatients, setAllPatients] = useState<any[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showVAT, setShowVAT] = useState(true)
  const [form, setForm] = useState({ name: '', type: 'sport', payment_type: 'full', monthly_cap: '', contact_name: '', contact_phone: '', contact_email: '', notes: '' })

  useEffect(() => { loadOrgs() }, [])

  async function loadOrgs() {
    setLoading(true)
    const { data } = await supabase.from('organizations').select('*').eq('is_active', true).order('name')
    setOrgs(data || [])
    setLoading(false)
  }

  async function selectOrg(org: any) {
    setSelected(org)
    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from('patients').select('*').eq('organization_id', org.id),
      supabase.from('billing_records').select('*, patient:patients(first_name,last_name)').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(30),
    ])
    setAthletes(a || [])
    setBilling(b || [])
  }

  async function saveOrg() {
    if (!form.name) { alert('יש להזין שם ארגון'); return }
    setSaving(true)
    await supabase.from('organizations').insert([{ ...form, monthly_cap: Number(form.monthly_cap) || 0 }])
    setSaving(false); setShowForm(false)
    setForm({ name: '', type: 'sport', payment_type: 'full', monthly_cap: '', contact_name: '', contact_phone: '', contact_email: '', notes: '' })
    loadOrgs()
  }

  async function linkAthlete(patientId: string) {
    await supabase.from('patients').update({ organization_id: selected.id }).eq('id', patientId)
    setShowAddAthlete(false); selectOrg(selected)
  }

  async function unlinkAthlete(patientId: string) {
    if (!confirm('להסיר ספורטאי מהארגון?')) return
    await supabase.from('patients').update({ organization_id: null }).eq('id', patientId)
    selectOrg(selected)
  }

  async function loadAllPatients() {
    const { data } = await supabase.from('patients').select('id,first_name,last_name').is('organization_id', null).order('first_name')
    setAllPatients(data || [])
  }

  const totalPaid = billing.filter(b => b.status === 'paid').reduce((s, b) => s + (b.amount || 0), 0)
  const totalPending = billing.filter(b => b.status === 'pending').reduce((s, b) => s + (b.amount || 0), 0)
  const filteredPatients = allPatients.filter(p => `${p.first_name} ${p.last_name}`.includes(patientSearch))

  function displayAmount(n: number) { return showVAT ? n : withoutVAT(n) }

  return (
    <AppLayout>
      <div style={{ padding: '20px 24px' }} className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c' }}>🏆 ארגונים וקבוצות</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>הצג מחירים:</span>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setShowVAT(true)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: showVAT ? '700' : '400', background: showVAT ? '#1a3a5c' : 'transparent', color: showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>כולל מע"מ</button>
                <button onClick={() => setShowVAT(false)} style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: !showVAT ? '700' : '400', background: !showVAT ? '#1a3a5c' : 'transparent', color: !showVAT ? '#fff' : '#64748b', fontFamily: 'Heebo, sans-serif' }}>ללא מע"מ</button>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>מע"מ 18%</span>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '9px 18px', background: '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>+ ארגון חדש</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>
          <div>
            {loading ? <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>טוען...</div> : orgs.map(org => (
              <div key={org.id} onClick={() => selectOrg(org)} style={{ background: selected?.id === org.id ? '#1a3a5c' : '#fff', color: selected?.id === org.id ? '#fff' : '#1a3a5c', borderRadius: '10px', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>{org.name}</div>
                <div style={{ fontSize: '11px', color: selected?.id === org.id ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: '3px' }}>
                  {org.payment_type === 'partial' ? `תשלום חלקי — עד ₪${org.monthly_cap}/חודש` : 'תשלום מלא'}
                </div>
              </div>
            ))}
          </div>

          {selected ? (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #1a3a5c, #1e4a7a)', borderRadius: '14px', padding: '20px', marginBottom: '16px', color: '#fff' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>🏆 {selected.name}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {selected.payment_type === 'partial' ? `תשלום חלקי — עד ₪${selected.monthly_cap} לחודש לספורטאי` : 'תשלום מלא על ידי הארגון'}
                </div>
                {selected.contact_phone && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>📞 {selected.contact_name} · {selected.contact_phone}</div>}
                <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{athletes.length}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>ספורטאים</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#3eb8e5' }}>₪{displayAmount(totalPaid).toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>שולם ({showVAT ? `ללא מע"מ: ₪${withoutVAT(totalPaid).toLocaleString()}` : `כולל: ₪${totalPaid.toLocaleString()}`})</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24' }}>₪{displayAmount(totalPending).toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>ממתין ({showVAT ? `ללא מע"מ: ₪${withoutVAT(totalPending).toLocaleString()}` : `כולל: ₪${totalPending.toLocaleString()}`})</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>👥 ספורטאים ({athletes.length})</div>
                  <button onClick={() => { setShowAddAthlete(true); loadAllPatients() }} style={{ padding: '6px 12px', background: '#3eb8e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>+ הוסף ספורטאי</button>
                </div>
                {athletes.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>אין ספורטאים משויכים עדיין</div>
                ) : athletes.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: '36px', height: '36px', background: '#1a3a5c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>
                      {a.first_name?.[0]}{a.last_name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link href={`/patients/${a.id}`} style={{ fontWeight: '600', fontSize: '13px', color: '#1a3a5c', textDecoration: 'none' }}>{a.first_name} {a.last_name}</Link>
                      {a.diagnosis && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{a.diagnosis}</div>}
                    </div>
                    {a.phone && <a href={`https://wa.me/972${a.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: '#25d366', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}>💬 WA</a>}
                    <button onClick={() => unlinkAthlete(a.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>הסר</button>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>💰 חיובים לארגון</div>
                  <Link href={`/billing/new?org=${selected.id}`} style={{ padding: '6px 12px', background: '#0b8a5e', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>+ חיוב חדש</Link>
                </div>
                {billing.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>אין חיובים עדיין</div>
                ) : billing.map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < billing.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{b.description || 'טיפול'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(b.created_at).toLocaleDateString('he-IL')} · {b.patient?.first_name} {b.patient?.last_name}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a3a5c' }}>₪{displayAmount(b.amount || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{showVAT ? `ללא מע"מ: ₪${withoutVAT(b.amount||0).toLocaleString()}` : `כולל מע"מ: ₪${(b.amount||0).toLocaleString()}`}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: b.status === 'paid' ? '#d1fae5' : '#fef3c7', color: b.status === 'paid' ? '#065f46' : '#92400e' }}>{b.status === 'paid' ? 'שולם' : 'ממתין'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94a3b8', fontSize: '14px' }}>בחר ארגון מהרשימה</div>
          )}
        </div>

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', direction: 'rtl' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '20px' }}>+ ארגון חדש</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={lbl}>שם הארגון *</label><input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="מכבי עירוני רמת גן..."/></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={lbl}>סוג</label><select style={inp} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option value="sport">קבוצת ספורט</option><option value="association">עמותה</option><option value="company">חברה</option><option value="other">אחר</option></select></div>
                  <div><label style={lbl}>סוג תשלום</label><select style={inp} value={form.payment_type} onChange={e => setForm(p => ({ ...p, payment_type: e.target.value }))}><option value="full">מלא</option><option value="partial">חלקי</option></select></div>
                </div>
                {form.payment_type === 'partial' && <div><label style={lbl}>תקרה חודשית לספורטאי ₪</label><input type="number" style={inp} value={form.monthly_cap} onChange={e => setForm(p => ({ ...p, monthly_cap: e.target.value }))} placeholder="1500"/></div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={lbl}>איש קשר</label><input style={inp} value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}/></div>
                  <div><label style={lbl}>טלפון</label><input style={inp} value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}/></div>
                </div>
                <div><label style={lbl}>אימייל</label><input style={inp} value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}/></div>
                <div><label style={lbl}>הערות</label><input style={inp} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}/></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>ביטול</button>
                  <button onClick={saveOrg} disabled={saving} style={{ flex: 2, padding: '11px', background: saving ? '#94a3b8' : '#1a3a5c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>{saving ? '⏳ שומר...' : '💾 שמור'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddAthlete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddAthlete(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', direction: 'rtl' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a3a5c', marginBottom: '16px' }}>הוסף ספורטאי ל{selected?.name}</div>
              <input placeholder="🔍 חפש מטופל..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ ...inp, marginBottom: '8px' }} />
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filteredPatients.slice(0, 10).map(p => (
                  <div key={p.id} onClick={() => linkAthlete(p.id)} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', fontSize: '13px', fontWeight: '500' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    {p.first_name} {p.last_name}
                  </div>
                ))}
                {filteredPatients.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>לא נמצאו מטופלים</div>}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>* מוצגים רק מטופלים שאינם משויכים לארגון</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

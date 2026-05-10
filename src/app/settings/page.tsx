'use client'
import AppLayout from '@/components/layout/AppLayout'
import { CLINIC, SERVICES } from '@/lib/supabase'

export default function SettingsPage() {
  return (
    <AppLayout>
      <div style={{ padding: '20px 24px', maxWidth: '700px' }} className="fade-in">
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a3a5c', marginBottom: '20px' }}>הגדרות</h1>

        {/* Clinic info */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>🏥 פרטי הקליניקה</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['שם', CLINIC.name],
              ['כתובת', CLINIC.address],
              ['טלפון', CLINIC.phone],
              ['עוסק מורשה', CLINIC.businessNum],
              ['רישיון PT', CLINIC.ptLicense],
              ['אימייל', CLINIC.email],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>🏃 שירותים ומחירים</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SERVICES.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{s.name_he}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0b8a5e' }}>₪{s.price}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.duration} דק'</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>
            לשינוי מחירים — ערוך את src/lib/supabase.ts או עדכן בטבלת service_types בSupabase
          </p>
        </div>

        {/* System info */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '14px', color: '#1a3a5c', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>⚙️ מערכת</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              ['גרסה', 'YOAVAVNI v2.0'],
              ['Next.js', '14.2.29 (אבטחה מלאה)'],
              ['מסד נתונים', 'Supabase PostgreSQL'],
              ['פריסה', 'Vercel'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: '600' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

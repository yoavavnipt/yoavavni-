'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { section: 'ראשי', items: [
    { href: '/dashboard', icon: '📊', label: 'לוח בקרה' },
    { href: '/patients',  icon: '👥', label: 'מטופלים' },
    { href: '/calendar',  icon: '📅', label: 'יומן תורים' },
  ]},
  { section: 'רפואי', items: [
    { href: '/records',   icon: '📋', label: 'רשומות SOAP' },
    { href: '/billing',   icon: '💰', label: 'חיוב וקבלות' },
    { href: '/videos',    icon: '🎬', label: 'מאגר סרטונים' },
  ]},
  { section: 'תקשורת', items: [
    { href: '/whatsapp',   icon: '💬', label: 'הודעות WhatsApp' },
    { href: '/templates',  icon: '✏️',  label: 'עריכת תבניות' },
  ]},
  { section: 'ניהול', items: [
    { href: '/reports',   icon: '📈', label: 'דוחות' },
    { href: '/settings',  icon: '⚙️',  label: 'הגדרות' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: '210px', flexShrink: 0,
      background: '#1a3a5c',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
          קליניקת יואב אבני
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(section => (
          <div key={section.section}>
            <div style={{
              padding: '12px 16px 4px',
              fontSize: '10px', fontWeight: '700',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              {section.section}
            </div>
            {section.items.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '9px 16px',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: active ? 'rgba(62,184,229,0.15)' : 'transparent',
                  borderRight: active ? '3px solid #3eb8e5' : '3px solid transparent',
                  fontWeight: active ? '600' : '400',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Quick action */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/patients/new" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '9px', background: '#3eb8e5', borderRadius: '8px',
          color: '#fff', fontSize: '12px', fontWeight: '700', textDecoration: 'none'
        }}>
          + מטופל חדש
        </Link>
      </div>

      {/* User */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{
          width: '32px', height: '32px',
          background: '#3eb8e5', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '800', color: '#fff', flexShrink: 0
        }}>
          יא
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>יואב אבני PT</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>בעלים</div>
        </div>
      </div>
    </div>
  )
}

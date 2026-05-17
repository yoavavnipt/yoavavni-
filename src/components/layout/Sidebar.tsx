'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem('clinic_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const isAdmin = user?.role === 'admin'
  const isTherapist = user?.role === 'therapist'
  const isSecretary = user?.role === 'secretary'

  const NAV = [
    { section: 'ראשי', items: [
      { href: '/dashboard', icon: '📊', label: 'ראשי', show: true },
      { href: '/patients',  icon: '👥', label: 'מטופלים',   show: true },
      { href: '/calendar',  icon: '📅', label: 'יומן תורים', show: true },
    ]},
    { section: 'רפואי', items: [
      { href: '/records',   icon: '📋', label: 'רשומות SOAP', show: true },
      { href: '/slots',     icon: '🕐', label: 'שעות פתוחות', show: true },
      { href: '/billing',   icon: '💰', label: 'חיוב וקבלות', show: isAdmin || isSecretary },
      { href: '/videos',    icon: '🎬', label: 'מאגר סרטונים', show: true },
    ]},
    { section: 'תקשורת', items: [
      { href: '/whatsapp',  icon: '💬', label: 'הודעות WhatsApp', show: true },
      { href: '/templates', icon: '✏️',  label: 'עריכת תבניות',   show: isAdmin },
    ]},
    { section: 'ניהול', items: [
      { href: '/reports',    icon: '📈', label: 'דוחות',         show: isAdmin },
      { href: '/predictive', icon: '🎯', label: 'סיכון נשירה',   show: isAdmin },
      { href: '/admin',      icon: '👤', label: 'משתמשים',       show: isAdmin },
      { href: '/settings',   icon: '⚙️',  label: 'הגדרות',        show: isAdmin },
    ]},
  ]

  function logout() {
    localStorage.removeItem('clinic_user')
    document.cookie = 'clinic_user=; path=/; max-age=0'
    window.location.href = '/login'
  }

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
        {NAV.map(section => {
          const visibleItems = section.items.filter(i => i.show)
          if (visibleItems.length === 0) return null
          return (
            <div key={section.section}>
              <div style={{
                padding: '12px 16px 4px',
                fontSize: '10px', fontWeight: '700',
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '0.08em'
              }}>
                {section.section}
              </div>
              {visibleItems.map(item => {
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
          )
        })}
      </nav>

      {/* Quick action */}
      {(isAdmin || isSecretary) && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link href="/patients/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px', background: '#3eb8e5', borderRadius: '8px',
            color: '#fff', fontSize: '12px', fontWeight: '700', textDecoration: 'none'
          }}>
            + מטופל חדש
          </Link>
        </div>
      )}

      {/* User + Logout */}
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
          {user?.name?.[0] || 'י'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'משתמש'}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
            {user?.role === 'admin' ? 'מנהל' : user?.role === 'therapist' ? 'מטפל' : 'מזכירה'}
          </div>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.6)',
          width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer',
          fontSize: '14px', flexShrink: 0,
        }} title="יציאה">
          🚪
        </button>
      </div>
    </div>
  )
}

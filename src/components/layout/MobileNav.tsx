'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MOBILE_NAV = [
  { href: '/dashboard', icon: '📊', label: 'בקרה' },
  { href: '/patients',  icon: '👥', label: 'מטופלים' },
  { href: '/calendar',  icon: '📅', label: 'יומן' },
  { href: '/records',   icon: '📋', label: 'SOAP' },
  { href: '/whatsapp',  icon: '💬', label: 'הודעות' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: '1px solid #e2e8f0',
      display: 'flex', padding: '4px 0 8px',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
    }}>
      {MOBILE_NAV.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '2px', padding: '6px 4px',
            textDecoration: 'none',
            color: active ? '#1a3a5c' : '#94a3b8',
          }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: active ? '700' : '400' }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

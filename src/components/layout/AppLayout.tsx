'use client'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import NotificationBell from './NotificationBell'
import AIAssistant from './AIAssistant'
import { useEffect, useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? '70px' : '0', position: 'relative' }}>
        {/* פעמון התראות */}
        <div style={{ position: 'fixed', top: '12px', left: '16px', zIndex: 500 }}>
          <NotificationBell />
        </div>
        {children}
      </main>
      {isMobile && <MobileNav />}
      <AIAssistant />
    </div>
  )
}

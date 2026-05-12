'use client'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
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
      <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? '70px' : '0' }}>
        {children}
      </main>
      {isMobile && <MobileNav />}
    </div>
  )
}

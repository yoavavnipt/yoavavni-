'use client'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, paddingBottom: '70px' }}>
        {children}
      </main>
      <MobileNav />
    </div>
  )
}

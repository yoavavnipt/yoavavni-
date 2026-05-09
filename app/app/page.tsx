export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a3a5c'
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a3a5c' }}>
          <span style={{ color: '#3eb8e5' }}>YOAV</span>AVNI
        </div>
        <div style={{ color: '#64748b', marginTop: '8px' }}>
          קליניקת יואב אבני ✅
        </div>
      </div>
    </div>
  )
}

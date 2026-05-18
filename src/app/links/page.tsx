import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'קליניקת יואב אבני',
  description: 'פיזיותרפיה · שיקום · אורתופדיה · פציעות ספורט',
}

export default function LinksPage() {
  return (
    <html dir="rtl" lang="he">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Heebo', sans-serif;
            direction: rtl;
            min-height: 100vh;
            background: linear-gradient(160deg, #0d1f35 0%, #1a3a5c 40%, #0d2d4a 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px 60px;
            overflow-x: hidden;
          }
          body::before {
            content: '';
            position: fixed;
            top: -200px; right: -200px;
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(62,184,229,0.12) 0%, transparent 70%);
            pointer-events: none;
          }
          .container { width: 100%; max-width: 420px; }
          .logo-wrap { text-align: center; margin-bottom: 32px; }
          .logo-wrap img { height: 90px; object-fit: contain; filter: brightness(0) invert(1); }
          .tagline { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 8px; }
          .card {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 20px 22px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
          }
          .card:hover { transform: translateY(-2px); border-color: rgba(62,184,229,0.4); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
          .card:active { transform: scale(0.98); }
          .card-primary {
            background: linear-gradient(135deg, #3eb8e5 0%, #2a9cc8 100%);
            border-color: transparent;
            box-shadow: 0 8px 24px rgba(62,184,229,0.35);
          }
          .card-primary:hover { box-shadow: 0 12px 32px rgba(62,184,229,0.5); }
          .card-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
          .card-text { flex: 1; }
          .card-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 3px; }
          .card-sub { font-size: 12px; color: rgba(255,255,255,0.5); }
          .card-primary .card-sub { color: rgba(255,255,255,0.7); }
          .card-arrow { font-size: 18px; color: rgba(255,255,255,0.3); flex-shrink: 0; }
          .section-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1.5px; margin: 20px 0 10px; padding-right: 4px; }
          .info-row { display: flex; gap: 10px; margin-top: 24px; }
          .info-chip { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 10px; text-align: center; text-decoration: none; }
          .info-chip-icon { font-size: 20px; margin-bottom: 4px; }
          .info-chip-text { font-size: 10px; color: rgba(255,255,255,0.5); }
          .info-chip-value { font-size: 11px; color: #fff; font-weight: 600; margin-top: 2px; }
          .footer { margin-top: 32px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.2); line-height: 1.8; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="logo-wrap">
            <img src="/logo-transparent.png" alt="קליניקת יואב אבני" />
            <div className="tagline">פיזיותרפיה · שיקום · אורתופדיה · פציעות ספורט</div>
          </div>

          <a className="card card-primary" href="/portal">
            <div className="card-icon" style={{background:'rgba(255,255,255,0.2)'}}>📅</div>
            <div className="card-text">
              <div className="card-title">קבע תור עכשיו</div>
              <div className="card-sub">כניסה לפורטל המטופלים</div>
            </div>
            <div className="card-arrow">←</div>
          </a>

          <div className="section-label">שירותים</div>

          <a className="card" href="/running">
            <div className="card-icon" style={{background:'rgba(124,58,237,0.25)'}}>🏃</div>
            <div className="card-text">
              <div className="card-title">קהילת הריצה</div>
              <div className="card-sub">תוכנית ריצה מקצועית תחת פיקוח PT</div>
            </div>
            <div className="card-arrow">←</div>
          </a>

          <a className="card" href="https://www.yoav-avni-clinic.com">
            <div className="card-icon" style={{background:'rgba(62,184,229,0.2)'}}>🌐</div>
            <div className="card-text">
              <div className="card-title">האתר שלנו</div>
              <div className="card-sub">מידע על הקליניקה והשירותים</div>
            </div>
            <div className="card-arrow">←</div>
          </a>

          <div className="section-label">צרו קשר</div>

          <a className="card" href="https://wa.me/972545953889">
            <div className="card-icon" style={{background:'rgba(37,211,102,0.2)'}}>💬</div>
            <div className="card-text">
              <div className="card-title">WhatsApp</div>
              <div className="card-sub">שאלות, ביטולים, מידע</div>
            </div>
            <div className="card-arrow">←</div>
          </a>

          <div className="info-row">
            <a className="info-chip" href="tel:0545953889">
              <div className="info-chip-icon">📞</div>
              <div className="info-chip-text">טלפון</div>
              <div className="info-chip-value">054-5953889</div>
            </a>
            <div className="info-chip">
              <div className="info-chip-icon">📍</div>
              <div className="info-chip-text">כתובת</div>
              <div className="info-chip-value">תרשיש 8, גילון</div>
            </div>
          </div>

          <div className="footer">
            קליניקת יואב אבני · עוסק מורשה 305111551<br/>
            רישיון פיזיותרפיה 10-163580
          </div>
        </div>
      </body>
    </html>
  )
}

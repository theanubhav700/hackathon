export default function Footer({ darkMode = true }) {
  const textMuted  = darkMode ? 'rgba(255,255,255,0.4)'  : 'rgba(0,0,0,0.45)';
  const textLink   = darkMode ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.55)';
  const headColor  = darkMode ? '#fff'                   : '#111';
  const bg         = darkMode ? 'rgba(0,0,0,0.4)'        : 'rgba(0,0,0,0.04)';
  const borderClr  = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const techBg     = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const techBorder = darkMode ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const dotColor   = darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';
  const copyColor  = darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
  const statusText = darkMode ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.4)';

  return (
    <footer style={{
      borderTop: `1px solid ${borderClr}`,
      background: bg,
      padding: '60px 40px 30px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap', marginBottom: 50 }}>

          {/* Brand */}
          <div style={{ flex: '2 1 280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44,
                background: 'linear-gradient(135deg,#ff2222,#cc0000)',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22,
                boxShadow: '0 0 24px rgba(255,34,34,0.4)',
              }}>🚑</div>
              <div>
                <div style={{ color: headColor, fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>SMART AMBULANCE</div>
                <div style={{ color: '#ff3333', fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>EMERGENCY RESPONSE SYSTEM</div>
              </div>
            </div>
            <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.8, maxWidth: 320, margin: '0 0 20px' }}>
              A complete web-based ambulance management system connecting customers, drivers and admins in real-time for faster emergency response.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['React', 'Express', 'MongoDB', 'Socket.io', 'Leaflet'].map((tech) => (
                <span key={tech} style={{
                  fontSize: 11, fontWeight: 600, color: textMuted,
                  background: techBg, border: `1px solid ${techBorder}`,
                  padding: '3px 10px', borderRadius: 4,
                }}>{tech}</span>
              ))}
            </div>
          </div>

          {/* Portals */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{
              color: headColor, fontSize: 13, fontWeight: 700,
              letterSpacing: 1, marginBottom: 18, textTransform: 'uppercase',
            }}>Portals</h4>
            {[
              { label: '👤 Customer Portal', href: '/login/customer' },
              { label: '🚑 Driver Panel',     href: '/driver/dashboard' },
              { label: '🖥️ Admin Dashboard', href: '/admin/dashboard' },
              { label: '🔐 Login',            href: '/login' },
            ].map((link) => (
              <a key={link.label} href={link.href} style={{
                display: 'block', color: textLink, fontSize: 13,
                textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = '#ff3333'}
                onMouseLeave={e => e.target.style.color = textLink}
              >{link.label}</a>
            ))}
          </div>

          {/* Features */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{
              color: headColor, fontSize: 13, fontWeight: 700,
              letterSpacing: 1, marginBottom: 18, textTransform: 'uppercase',
            }}>Features</h4>
            {[
              'Live Map Tracking',
              'Multi-Route Engine',
              'Real-time Updates',
              'Activity Logs',
              'Admin Analytics',
            ].map((f) => (
              <div key={f} style={{
                color: dotColor, fontSize: 13, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff3333', display: 'inline-block' }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${borderClr}`,
          paddingTop: 24,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ color: copyColor, fontSize: 13 }}>
            © 2026 ResQ Emergency Response System — Built for Hackathon
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00cc66', display: 'inline-block', boxShadow: '0 0 8px #00cc66' }} />
            <span style={{ color: statusText, fontSize: 12 }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

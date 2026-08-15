import { motion } from 'framer-motion';

const portals = [
  {
    icon: '👤', title: 'Customer Portal', desc: 'Book ambulance, track live, view history',
    color: '#ff3333', glow: 'rgba(255,51,51,0.3)',
    gradient: 'linear-gradient(135deg,#ff2222,#cc0000)',
    href: '/login/customer',
    features: ['📍 GPS location detection', '🚑 Nearby ambulances', '📡 Live tracking'],
  },
  {
    icon: '🚑', title: 'Driver Panel', desc: 'Respond to emergencies, navigate & complete trips',
    color: '#ff8800', glow: 'rgba(255,136,0,0.3)',
    gradient: 'linear-gradient(135deg,#ff8800,#cc5500)',
    href: '/login/driver',
    features: ['🔔 Instant alerts', '🗺️ Navigation', '🏥 Best route'],
  },
  {
    icon: '🖥️', title: 'Admin Dashboard', desc: 'Monitor, manage and control the full system',
    color: '#3399ff', glow: 'rgba(51,153,255,0.3)',
    gradient: 'linear-gradient(135deg,#3399ff,#0055cc)',
    href: '/login/admin',
    features: ['📊 Live overview', '📋 Activity logs', '🚨 Emergencies'],
  },
];

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#05050f',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', overflow: 'hidden', position: 'relative',
    }}>
      {/* BG glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,51,51,0.06),transparent 70%)', pointerEvents: 'none' }} />
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#ff2222,#cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 28px rgba(255,34,34,0.45)' }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff3333', fontSize: 10, fontWeight: 700, letterSpacing: 3 }}>EMERGENCY RESPONSE</div>
          </div>
        </a>
      </motion.div>

      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: 52, position: 'relative', zIndex: 1 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(26px,4vw,40px)', margin: '0 0 12px', letterSpacing: -0.5 }}>
          Choose Your Portal
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, margin: 0 }}>
          Select how you want to access ResQ
        </p>
      </motion.div>

      {/* 3 Cards */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap',
        justifyContent: 'center', maxWidth: 1000, width: '100%',
        position: 'relative', zIndex: 1,
      }}>
        {portals.map((portal, i) => (
          <motion.a
            key={portal.href}
            href={portal.href}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
            style={{
              flex: '1 1 280px', maxWidth: 300,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${portal.color}22`,
              borderRadius: 22, padding: '32px 28px',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}
            whileHover={{
              y: -6,
              borderColor: `${portal.color}55`,
              boxShadow: `0 24px 60px ${portal.glow}`,
              backgroundColor: `${portal.color}08`,
            }}
          >
            {/* BG glow blob */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle,${portal.color}12,transparent 70%)`, pointerEvents: 'none' }} />

            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: `${portal.color}18`, border: `2px solid ${portal.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, marginBottom: 20,
            }}>{portal.icon}</div>

            {/* Title */}
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 19, marginBottom: 8 }}>{portal.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>{portal.desc}</div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(to right,${portal.color}33,transparent)`, marginBottom: 20 }} />

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {portal.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: portal.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '13px', borderRadius: 12,
              background: portal.gradient,
              color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
              boxShadow: `0 6px 20px ${portal.glow}`,
            }}>
              Login →
            </div>
          </motion.a>
        ))}
      </div>

      {/* Back link */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ marginTop: 44, position: 'relative', zIndex: 1 }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>← Back to Home</a>
      </motion.div>
    </div>
  );
}

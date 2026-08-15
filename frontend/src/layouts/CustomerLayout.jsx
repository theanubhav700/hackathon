import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const navItems = [
  { icon: '👤', label: 'Profile',        path: '/customer/profile' },
  { icon: '🎫', label: 'My Tickets',     path: '/customer/tickets' },
  { icon: '🚑', label: 'Book Ambulance', path: '/customer/book' },
];

export default function CustomerLayout({ children }) {
  const location = useLocation();

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#05050f',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
    }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          gap: 12, overflow: 'hidden',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#ff2222,#cc0000)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 16px rgba(255,34,34,0.4)',
          }}>🚑</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#ff3333', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>CUSTOMER</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path ||
              (item.path === '/customer/book' && location.pathname === '/customer');
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: '11px 12px',
                  borderRadius: 10, marginBottom: 4,
                  textDecoration: 'none',
                  background: active ? 'rgba(255,51,51,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(255,51,51,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <span style={{
                  color: active ? '#ff3333' : 'rgba(255,255,255,0.6)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}>{item.label}</span>
                {active && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%', background: '#ff3333',
                    boxShadow: '0 0 6px #ff3333',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 10px 20px' }}>
          <Link to="/login" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 12px', borderRadius: 10,
            textDecoration: 'none',
            background: 'rgba(255,51,51,0.06)',
            border: '1px solid rgba(255,51,51,0.15)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span style={{ color: 'rgba(255,100,100,0.7)', fontSize: 13, fontWeight: 500 }}>Logout</span>
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
const navItems = [
  { icon: '📊', label: 'Dashboard',            path: '/admin/dashboard' },
  { icon: '🚨', label: 'All Requests',          path: '/admin/emergencies' },
  { icon: '🚑', label: 'Ambulance Mgmt',       path: '/admin/ambulances' },
  { icon: '👨‍✈️', label: 'Driver Mgmt',          path: '/admin/drivers' },
  { icon: '👤', label: 'Customer Mgmt',        path: '/admin/customers' },
  { icon: '📋', label: 'Activity Logs',        path: '/admin/logs' },
  { icon: '📈', label: 'Analytics',            path: '/admin/analytics' },
];

export default function AdminLayout({ children }) {
  const location  = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('resq_token');
    localStorage.removeItem('resq_user');
    navigate('/login/admin');
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#05050f',
      fontFamily: "'Inter','Segoe UI',system-ui,'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif",
    }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#3399ff,#0055cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 16px rgba(51,153,255,0.4)',
          }}>🖥️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>ResQ</div>
            <div style={{ color: '#3399ff', fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>ADMIN PANEL</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center',
                gap: 11, padding: '10px 12px',
                borderRadius: 10, marginBottom: 3,
                textDecoration: 'none',
                background: active ? 'rgba(51,153,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(51,153,255,0.25)' : '1px solid transparent',
                transition: 'all 0.2s', overflow: 'hidden', whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                <span style={{
                  color: active ? '#3399ff' : 'rgba(255,255,255,0.55)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                }}>{item.label}</span>
                {active && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3399ff', boxShadow: '0 0 6px #3399ff' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '0 8px 16px' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.15)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>🚪</span>
            <span style={{ color: 'rgba(255,100,100,0.7)', fontSize: 13, fontWeight: 500 }}>Logout</span>
          </button>
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

import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── small helpers ──────────────────────────────────────────────
function badge(text, color) {
  const palette = {
    green:  { bg: 'rgba(0,210,110,0.12)',  border: 'rgba(0,210,110,0.3)',  fg: '#00d26e' },
    blue:   { bg: 'rgba(51,153,255,0.12)', border: 'rgba(51,153,255,0.3)', fg: '#3399ff' },
    red:    { bg: 'rgba(255,60,60,0.12)',  border: 'rgba(255,60,60,0.3)',  fg: '#ff5555' },
    yellow: { bg: 'rgba(255,200,0,0.12)',  border: 'rgba(255,200,0,0.3)',  fg: '#ffc800' },
  };
  const c = palette[color] || palette.blue;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.fg,
      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
    }}>{text}</span>
  );
}

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = name ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360 : 200;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},60%,35%)`,
      border: `2px solid hsl(${hue},60%,50%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
    }}>{initials}</div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────
function CustomerModal({ customer, onClose }) {
  if (!customer) return null;

  const joined = new Date(customer.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
      <span style={{ color: value ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13,
        fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0e0e1f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Avatar name={customer.fullName} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>{customer.fullName}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{customer.email}</div>
          </div>
          {badge('Customer', 'blue')}
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', borderRadius: 8, width: 30, height: 30,
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 28px 28px' }}>
          {/* Contact */}
          <div style={{ color: '#3399ff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', margin: '20px 0 4px' }}>Contact Info</div>
          {row('Mobile', customer.mobile)}
          {row('Email', customer.email)}
          {row('Joined', joined)}

          {/* Medical */}
          <div style={{ color: '#3399ff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', margin: '20px 0 4px' }}>Medical Info</div>
          {row('Age', customer.age ? `${customer.age} years` : null)}
          {row('Gender', customer.gender)}
          {row('Blood Group', customer.bloodGroup)}

          {/* Emergency */}
          <div style={{ color: '#3399ff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', margin: '20px 0 4px' }}>Emergency Contact</div>
          {row('Name', customer.ecName)}
          {row('Number', customer.ecNumber)}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('resq_token');
    axios.get(`${API_BASE}/admin/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.data.success) setCustomers(res.data.customers);
        else setError(res.data.message || 'Failed to load customers');
      })
      .catch(err => {
        const msg = err.response?.data?.message;
        setError(msg || 'Could not reach server. Is the backend running?');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.bloodGroup?.toLowerCase().includes(q)
    );
  });

  const joined = (iso) => new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const colStyle = {
    color: 'rgba(255,255,255,0.35)', fontSize: 11,
    fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
  };

  const cellStyle = {
    color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500,
  };

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>
          👤 Customer Management
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          All registered customers and their details
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Customers', value: customers.length, icon: '👥', color: '#3399ff' },
          { label: 'With Blood Group', value: customers.filter(c => c.bloodGroup).length, icon: '🩸', color: '#ff4d6d' },
          { label: 'With Emergency Contact', value: customers.filter(c => c.ecName).length, icon: '🆘', color: '#00d26e' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, fontSize: 18,
              background: `${s.color}18`, border: `1px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.icon}</div>
            <div>
              <div style={{ color: s.color, fontWeight: 800, fontSize: 22 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '11px 16px',
        }}>
          <span>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, mobile or blood group..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 14, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 16, padding: 0,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.6fr 1fr 0.8fr 0.8fr 1fr 0.5fr',
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Name', 'Email', 'Mobile', 'Blood', 'Gender', 'Joined', ''].map(h => (
            <span key={h} style={colStyle}>{h}</span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            Loading customers...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ color: '#ff5555', fontSize: 14 }}>{error}</div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              {search ? 'No customers match your search.' : 'No customers registered yet.'}
            </div>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.map((c, i) => (
          <div key={c._id} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.6fr 1fr 0.8fr 0.8fr 1fr 0.5fr',
            padding: '14px 24px', alignItems: 'center',
            borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.15s',
            cursor: 'default',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Name + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={c.fullName} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{c.fullName}</span>
            </div>

            {/* Email */}
            <span style={{ ...cellStyle, fontSize: 12 }}>{c.email}</span>

            {/* Mobile */}
            <span style={cellStyle}>{c.mobile || '—'}</span>

            {/* Blood group */}
            <span>{c.bloodGroup ? badge(c.bloodGroup, 'red') : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>—</span>}</span>

            {/* Gender */}
            <span style={{ ...cellStyle, fontSize: 12 }}>{c.gender || '—'}</span>

            {/* Joined */}
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{joined(c.createdAt)}</span>

            {/* View button */}
            <button onClick={() => setSelected(c)} style={{
              background: 'rgba(51,153,255,0.1)', border: '1px solid rgba(51,153,255,0.25)',
              color: '#3399ff', borderRadius: 8, padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(51,153,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(51,153,255,0.1)'}
            >View</button>
          </div>
        ))}
      </div>

      {/* Result count */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12, textAlign: 'right' }}>
          Showing {filtered.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Detail modal */}
      <CustomerModal customer={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}

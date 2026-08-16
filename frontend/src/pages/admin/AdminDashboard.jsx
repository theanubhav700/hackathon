import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const SITUATION_CONFIG = {
  critical: { color: '#ff3333', bg: 'rgba(255,51,51,0.12)',  border: 'rgba(255,51,51,0.4)',  label: '🔴 CRITICAL',  pulse: true  },
  serious:  { color: '#ff8800', bg: 'rgba(255,136,0,0.12)', border: 'rgba(255,136,0,0.4)',  label: '🟠 SERIOUS',   pulse: true  },
  stable:   { color: '#ffcc00', bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.3)',  label: '🟡 STABLE',    pulse: false },
  normal:   { color: '#00cc66', bg: 'rgba(0,204,102,0.12)', border: 'rgba(0,204,102,0.3)',  label: '🟢 NORMAL',    pulse: false },
};

const VITAL_CONFIG = [
  { field: 'heartRate', label: 'Heart Rate',     unit: 'bpm',  color: '#ff4466', icon: '❤️',  normal: '60–100'       },
  { field: 'spo2',      label: 'SpO₂',           unit: '%',    color: '#3399ff', icon: '💉',  normal: '95–100'       },
  { field: 'bp',        label: 'Blood Pressure', unit: 'mmHg', color: '#aa44ff', icon: '🩺',  normal: '90/60–120/80' },
  { field: 'temp',      label: 'Temperature',    unit: '°C',   color: '#ff8800', icon: '🌡️', normal: '36.1–37.2'   },
];

// ── ECG Canvas ─────────────────────────────────────────────
function ECGMonitor({ data, situation }) {
  const canvasRef = useRef(null);
  const cfg = SITUATION_CONFIG[situation] || SITUATION_CONFIG.stable;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, W, H);

    // Major grid
    ctx.strokeStyle = 'rgba(0,204,102,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    // Minor grid
    ctx.strokeStyle = 'rgba(0,204,102,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 10) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 6)  { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    if (data.length < 2) return;

    const mid    = H * 0.55;
    const max    = Math.max(...data.map(Math.abs), 0.5);
    const scaleY = (H * 0.42) / max;
    const stepX  = W / (data.length - 1);

    // Glow
    ctx.beginPath();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth   = 6;
    ctx.globalAlpha = 0.15;
    data.forEach((v, i) => { const x=i*stepX; const y=mid-v*scaleY; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();

    // Main line
    ctx.beginPath();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth   = 2;
    ctx.globalAlpha = 1;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur  = 10;
    data.forEach((v, i) => { const x=i*stepX; const y=mid-v*scaleY; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();

    // Tip dot
    const lx = (data.length-1)*stepX;
    const ly = mid - data[data.length-1]*scaleY;
    ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2);
    ctx.fillStyle='#fff'; ctx.shadowColor=cfg.color; ctx.shadowBlur=16; ctx.globalAlpha=0.9;
    ctx.fill();
    ctx.globalAlpha=1; ctx.shadowBlur=0;
  }, [data, situation, cfg.color]);

  return (
    <canvas ref={canvasRef} width={1200} height={160}
      style={{ width:'100%', height:160, borderRadius:10, display:'block' }} />
  );
}

// ── Main Component ──────────────────────────────────────────
export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem('resq_user') || '{}');
  const token = localStorage.getItem('resq_token');

  const [counts,     setCounts]     = useState({ customers: null, ambulances: null, drivers: null });
  const [socketConn, setSocketConn] = useState(false);

  // ── ER state ───────────────────────────────────────────
  const [erInputId,    setErInputId]    = useState('');
  const [erBookingId,  setErBookingId]  = useState('');
  const [erConnected,  setErConnected]  = useState(false);
  const [erSocketConn, setErSocketConn] = useState(false);
  const [telemetry,    setTelemetry]    = useState(null);
  const [ecgData,      setEcgData]      = useState(Array(120).fill(0));
  const [alerts,       setAlerts]       = useState([]);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const erSocketRef = useRef(null);

  const addAlert = useCallback((msg, color = '#ff8800') => {
    const a = { id: Date.now(), msg, color, time: new Date().toLocaleTimeString() };
    setAlerts(prev => [a, ...prev].slice(0, 10));
  }, []);

  // ── Admin + ER socket setup ────────────────────────────
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      axios.get(`${API_BASE}/admin/customers`,  { headers }),
      axios.get(`${API_BASE}/admin/ambulances`, { headers }),
      axios.get(`${API_BASE}/admin/drivers`,    { headers }),
    ]).then(([cust, amb, drv]) => {
      setCounts({
        customers:  cust.status==='fulfilled' && cust.value.data.success ? cust.value.data.count  : 'N/A',
        ambulances: amb.status ==='fulfilled' && amb.value.data.success  ? amb.value.data.count   : 'N/A',
        drivers:    drv.status ==='fulfilled' && drv.value.data.success  ? drv.value.data.count   : 'N/A',
      });
    });

    // Admin socket (live monitor dot)
    const adminSocket = io(SOCKET_URL, { transports: ['websocket','polling'] });
    adminSocket.on('connect',    () => setSocketConn(true));
    adminSocket.on('disconnect', () => setSocketConn(false));
    adminSocket.on('connect',    () => adminSocket.emit('admin:join'));

    // ER socket (separate connection)
    const erSocket = io(SOCKET_URL, { transports: ['websocket','polling'] });
    erSocketRef.current = erSocket;
    erSocket.on('connect',    () => setErSocketConn(true));
    erSocket.on('disconnect', () => setErSocketConn(false));

    erSocket.on('er:telemetry_snapshot', (data) => {
      setTelemetry(data);
      setLastUpdated(new Date());
      addAlert('📡 Telemetry snapshot received', '#3399ff');
    });
    erSocket.on('er:vitals_update', (data) => {
      setTelemetry(data);
      setLastUpdated(new Date());
      const cfg = SITUATION_CONFIG[data.situation];
      if (data.situation === 'critical')     addAlert('🚨 CRITICAL — Immediate attention required!', '#ff3333');
      else if (data.situation === 'serious') addAlert('⚠️ SERIOUS — Patient condition worsening',   '#ff8800');
      else                                   addAlert(`✅ Vitals updated — ${cfg?.label || data.situation}`, '#00cc66');
    });
    erSocket.on('er:ecg_point', ({ value }) => {
      setEcgData(prev => [...prev.slice(1), value]);
    });

    return () => { adminSocket.disconnect(); erSocket.disconnect(); };
  }, []);

  const handleErJoin = () => {
    const id = erInputId.trim();
    if (!id) return;
    setErBookingId(id);
    erSocketRef.current?.emit('er:join', { bookingId: id, hospitalName: 'Admin ER Monitor' });
    setErConnected(true);
  };

  const handleErDisconnect = () => {
    setErConnected(false);
    setTelemetry(null);
    setEcgData(Array(120).fill(0));
    setAlerts([]);
    setErBookingId('');
    setErInputId('');
  };

  const fmt  = (val) => (val === null ? '…' : String(val));
  const sit  = SITUATION_CONFIG[telemetry?.situation] || SITUATION_CONFIG.stable;
  const vitals = telemetry?.vitals || {};

  const stats = [
    { icon: '👤',  label: 'Total Customers',  value: fmt(counts.customers),  color: '#aa44ff', sub: 'Registered users'   },
    { icon: '👨‍✈️', label: 'Total Drivers',    value: fmt(counts.drivers),    color: '#ffaa00', sub: 'Active on platform'  },
    { icon: '🚑',  label: 'Total Ambulances', value: fmt(counts.ambulances), color: '#3399ff', sub: 'Fleet size'           },
    { icon: '⭐',  label: 'Avg Rating',        value: '4.3',                  color: '#00cc66', sub: 'Out of 5.0', stars: true },
  ];

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ color:'#fff', fontWeight:900, fontSize:26, margin:'0 0 5px' }}>📊 Dashboard</h1>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, margin:0 }}>
              Welcome back, <span style={{ color:'#3399ff', fontWeight:700 }}>{admin.fullName || 'Admin'}</span>
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <motion.div
              animate={socketConn ? { opacity:[0.5,1,0.5] } : {}}
              transition={{ duration:1.2, repeat:Infinity }}
              style={{ width:8, height:8, borderRadius:'50%', background: socketConn ? '#00cc66' : '#ff3333' }}
            />
            <span style={{ color: socketConn ? '#00cc66' : '#ff5555', fontSize:12, fontWeight:700 }}>
              {socketConn ? 'Live Monitor' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:32 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:i*0.08, type:'spring', stiffness:180, damping:18 }}
            style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}28`, borderRadius:20, padding:'28px 26px', position:'relative', overflow:'hidden' }}
          >
            <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:s.color, opacity:0.07, filter:'blur(24px)', pointerEvents:'none' }} />
            <div style={{ width:48, height:48, borderRadius:14, marginBottom:18, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{s.icon}</div>
            <div style={{ color:s.color, fontWeight:900, fontSize:s.stars?32:36, marginBottom:6, lineHeight:1, opacity:s.value==='…'?0.3:1, transition:'opacity 0.4s', display:'flex', alignItems:'center', gap:6 }}>
              {s.value}
              {s.stars && <span style={{ fontSize:20, color:'#ffcc00', letterSpacing:-1 }}>★★★★<span style={{ opacity:0.35 }}>★</span></span>}
            </div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:4 }}>{s.label}</div>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginBottom:28 }} />

      {/* ── ER Monitor Section ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <h2 style={{ color:'#fff', fontWeight:900, fontSize:20, margin:'0 0 3px' }}>🏥 ER Patient Monitor</h2>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:0 }}>Live vitals & ECG from ambulance</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <motion.div
              animate={erSocketConn ? { opacity:[0.5,1,0.5] } : {}}
              transition={{ duration:1.2, repeat:Infinity }}
              style={{ width:7, height:7, borderRadius:'50%', background: erSocketConn ? '#00cc66' : '#ff5555' }}
            />
            <span style={{ color: erSocketConn ? '#00cc66' : '#ff5555', fontSize:11, fontWeight:700 }}>
              {erSocketConn ? 'Socket Connected' : 'Offline'}
            </span>
          </div>
        </div>

        {!erConnected ? (
          /* ── Connect panel ── */
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'28px 32px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ fontSize:32 }}>📡</div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:4 }}>Connect to Patient Telemetry</div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>Enter Booking ID to receive live vitals & ECG from the ambulance</div>
            </div>
            <div style={{ display:'flex', gap:10, flexShrink:0 }}>
              <input
                value={erInputId}
                onChange={e => setErInputId(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleErJoin()}
                placeholder="Booking ID (e.g. BK-1234567890)"
                style={{
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)',
                  borderRadius:10, padding:'11px 14px', color:'#fff', fontSize:13,
                  fontFamily:'inherit', outline:'none', width:240,
                }}
              />
              <button onClick={handleErJoin} style={{
                padding:'11px 22px', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#3399ff,#0055cc)',
                color:'#fff', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                boxShadow:'0 4px 16px rgba(51,153,255,0.35)',
              }}>
                Connect
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Patient header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:17 }}>
                  👤 {telemetry?.patientName || 'Awaiting patient data...'}
                </div>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:3 }}>
                  Booking: <span style={{ color:'#fff', fontFamily:'monospace' }}>{erBookingId}</span>
                  {telemetry?.driverName && (
                    <span style={{ marginLeft:12 }}>🚑 Driver: <span style={{ color:'#ff8800' }}>{telemetry.driverName}</span></span>
                  )}
                  {lastUpdated && (
                    <span style={{ marginLeft:12, color:'rgba(255,255,255,0.2)' }}>
                      Last update: {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {telemetry?.situation && (
                  <motion.div
                    animate={sit.pulse ? { scale:[1,1.04,1], boxShadow:[`0 0 0px ${sit.color}`,`0 0 18px ${sit.color}`,`0 0 0px ${sit.color}`] } : {}}
                    transition={{ duration:1.2, repeat:Infinity }}
                    style={{ background:sit.bg, border:`2px solid ${sit.border}`, borderRadius:14, padding:'8px 18px', color:sit.color, fontWeight:900, fontSize:13 }}
                  >
                    {sit.label}
                  </motion.div>
                )}
                <button onClick={handleErDisconnect} style={{
                  padding:'8px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.1)',
                  background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)',
                  fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                }}>
                  Disconnect
                </button>
              </div>
            </div>

            {/* Vitals grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
              {VITAL_CONFIG.map(v => {
                const val = vitals[v.field];
                return (
                  <motion.div key={v.field}
                    animate={val && telemetry?.situation==='critical' ? { borderColor:['rgba(255,51,51,0.2)','rgba(255,51,51,0.6)','rgba(255,51,51,0.2)'] } : {}}
                    transition={{ duration:1, repeat:Infinity }}
                    style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${v.color}22`, borderRadius:14, padding:'18px 16px', textAlign:'center' }}
                  >
                    <div style={{ fontSize:22, marginBottom:7 }}>{v.icon}</div>
                    <div style={{ color:val?v.color:'rgba(255,255,255,0.15)', fontWeight:900, fontSize:28, lineHeight:1, marginBottom:4 }}>
                      {val || '—'}
                    </div>
                    <div style={{ color:v.color, fontSize:11, fontWeight:700, marginBottom:2 }}>{v.unit}</div>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{v.label}</div>
                    <div style={{ color:'rgba(255,255,255,0.15)', fontSize:10, marginTop:4 }}>Normal: {v.normal}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* ECG */}
            <div style={{ background:'#020810', border:'1px solid rgba(0,204,102,0.25)', borderRadius:16, padding:'18px 22px', marginBottom:16, boxShadow:'0 0 30px rgba(0,204,102,0.06)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#00cc66', fontWeight:800, fontSize:14, letterSpacing:0.5 }}>LIVE ECG MONITOR</span>
                  {telemetry?.situation && (
                    <div style={{ background:`${sit.color}22`, border:`1px solid ${sit.color}55`, borderRadius:6, padding:'2px 10px', color:sit.color, fontSize:11, fontWeight:700 }}>
                      {sit.label}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <motion.div animate={{ opacity:[1,0.2,1] }} transition={{ duration:0.8, repeat:Infinity }}
                    style={{ width:7, height:7, borderRadius:'50%', background:'#00cc66', boxShadow:'0 0 6px #00cc66' }} />
                  <span style={{ color:'#00cc66', fontSize:11, fontWeight:700 }}>STREAMING</span>
                  <span style={{ color:'rgba(255,255,255,0.15)', fontSize:11, marginLeft:8 }}>25mm/s</span>
                </div>
              </div>
              <ECGMonitor data={ecgData} situation={telemetry?.situation || 'stable'} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <span style={{ color:'rgba(0,204,102,0.3)', fontSize:10, fontFamily:'monospace' }}>I   II   III   aVR   aVL   aVF</span>
                <span style={{ color:'rgba(255,255,255,0.15)', fontSize:10 }}>Real-time waveform from ambulance</span>
              </div>
            </div>

            {/* Alert log + ER Actions */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:14 }}>

              {/* Alert log */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px' }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:12, marginBottom:12, textTransform:'uppercase', letterSpacing:0.8 }}>
                  🔔 Alert Log
                </div>
                <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                  <AnimatePresence>
                    {alerts.length === 0 ? (
                      <div style={{ color:'rgba(255,255,255,0.12)', fontSize:12, textAlign:'center', padding:'24px 0', fontStyle:'italic' }}>
                        No alerts yet — waiting for vitals push from ambulance
                      </div>
                    ) : alerts.map(a => (
                      <motion.div key={a.id}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                        style={{ display:'flex', gap:10, alignItems:'flex-start', background:`${a.color}08`, border:`1px solid ${a.color}20`, borderRadius:8, padding:'7px 10px' }}
                      >
                        <span style={{ color:'rgba(255,255,255,0.25)', fontSize:10, flexShrink:0, marginTop:1, fontFamily:'monospace' }}>{a.time}</span>
                        <span style={{ color:a.color, fontSize:12 }}>{a.msg}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* ER Actions */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:12, marginBottom:4, textTransform:'uppercase', letterSpacing:0.8 }}>
                  ER Actions
                </div>
                {[
                  { label:'🩺 Prepare Trauma Bay', color:'#ff3333', bg:'rgba(255,51,51,0.1)',   border:'rgba(255,51,51,0.3)'   },
                  { label:'🩸 Order Blood Bank',   color:'#ff8800', bg:'rgba(255,136,0,0.1)',  border:'rgba(255,136,0,0.3)'   },
                  { label:'💉 ICU Standby',         color:'#aa44ff', bg:'rgba(170,68,255,0.1)', border:'rgba(170,68,255,0.3)'  },
                  { label:'📞 Alert Surgeon',       color:'#3399ff', bg:'rgba(51,153,255,0.1)', border:'rgba(51,153,255,0.3)'  },
                ].map(btn => (
                  <button key={btn.label}
                    onClick={() => addAlert(`${btn.label} — Action triggered`, btn.color)}
                    style={{
                      padding:'10px 14px', borderRadius:10, cursor:'pointer',
                      background:btn.bg, border:`1px solid ${btn.border}`,
                      color:btn.color, fontWeight:700, fontSize:12,
                      fontFamily:'inherit', textAlign:'left', transition:'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity='1'}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

    </AdminLayout>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 20px' }}>
      <div style={{ fontSize:40, marginBottom:14, opacity:0.4 }}>{icon}</div>
      <p style={{ color:'rgba(255,255,255,0.25)', fontSize:14, margin:0, lineHeight:1.6 }}>{text}</p>
    </div>
  );
}

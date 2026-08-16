import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

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
  { field: 'heartRate', label: 'Heart Rate',     unit: 'bpm',  color: '#ff4466', icon: '❤️',  normal: '60–100'    },
  { field: 'spo2',      label: 'SpO₂',           unit: '%',    color: '#3399ff', icon: '💉',  normal: '95–100'    },
  { field: 'bp',        label: 'Blood Pressure', unit: 'mmHg', color: '#aa44ff', icon: '🩺',  normal: '90/60–120/80' },
  { field: 'temp',      label: 'Temperature',    unit: '°C',   color: '#ff8800', icon: '🌡️', normal: '36.1–37.2' },
];

// ECG canvas component
function ECGMonitor({ data, situation }) {
  const canvasRef = useRef(null);
  const cfg = SITUATION_CONFIG[situation] || SITUATION_CONFIG.stable;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx   = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Dark background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,204,102,0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ECG line
    const max    = Math.max(...data.map(Math.abs), 1);
    const mid    = H / 2;
    const scaleY = (H * 0.38) / max;
    const stepX  = W / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur  = 6;

    data.forEach((v, i) => {
      const x = i * stepX;
      const y = mid - v * scaleY;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [data, situation]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={100}
      style={{ width: '100%', height: 100, borderRadius: 8, display: 'block' }}
    />
  );
}

export default function ERDashboard() {
  const [bookingId,    setBookingId]    = useState('');
  const [inputId,      setInputId]      = useState('');
  const [connected,    setConnected]    = useState(false);
  const [socketConn,   setSocketConn]   = useState(false);
  const [telemetry,    setTelemetry]    = useState(null);
  const [ecgData,      setEcgData]      = useState(Array(120).fill(0));
  const [alerts,       setAlerts]       = useState([]);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  const socketRef = useRef(null);

  const addAlert = useCallback((msg, color = '#ff8800') => {
    const a = { id: Date.now(), msg, color, time: new Date().toLocaleTimeString() };
    setAlerts(prev => [a, ...prev].slice(0, 10));
  }, []);

  // ── Socket setup ───────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setSocketConn(true));
    socket.on('disconnect', () => setSocketConn(false));

    socket.on('er:telemetry_snapshot', (data) => {
      setTelemetry(data);
      setLastUpdated(new Date());
      addAlert('📡 Telemetry snapshot received', '#3399ff');
    });

    socket.on('er:vitals_update', (data) => {
      setTelemetry(data);
      setLastUpdated(new Date());
      const cfg = SITUATION_CONFIG[data.situation];
      if (data.situation === 'critical') {
        addAlert('🚨 CRITICAL — Immediate attention required!', '#ff3333');
      } else if (data.situation === 'serious') {
        addAlert('⚠️ SERIOUS — Patient condition worsening', '#ff8800');
      } else {
        addAlert(`✅ Vitals updated — ${cfg?.label || data.situation}`, '#00cc66');
      }
    });

    socket.on('er:ecg_point', ({ value }) => {
      setEcgData(prev => [...prev.slice(1), value]);
    });

    return () => socket.disconnect();
  }, [addAlert]);

  const handleJoin = () => {
    const id = inputId.trim();
    if (!id) return;
    setBookingId(id);
    socketRef.current?.emit('er:join', { bookingId: id, hospitalName: 'ER Dashboard' });
    setConnected(true);
    addAlert(`🏥 Joined telemetry for booking ${id}`, '#3399ff');
  };

  const sit    = SITUATION_CONFIG[telemetry?.situation] || SITUATION_CONFIG.stable;
  const vitals = telemetry?.vitals || {};

  return (
    <div style={{
      minHeight: '100vh',
      background: '#03030e',
      color: '#fff',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      padding: '0',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#ff3333,#cc0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 16px rgba(255,51,51,0.5)' }}>🏥</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>ResQ — Hospital ER Dashboard</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Live Patient Telemetry & ECG Monitoring</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastUpdated && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              Last update: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div
              animate={socketConn ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: socketConn ? '#00cc66' : '#ff3333', boxShadow: socketConn ? '0 0 8px #00cc66' : 'none' }}
            />
            <span style={{ color: socketConn ? '#00cc66' : '#ff5555', fontSize: 12, fontWeight: 700 }}>
              {socketConn ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ── Connect to booking ── */}
        {!connected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>📡</div>
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 8px' }}>Connect to Patient Telemetry</h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 28px' }}>
              Enter the Booking ID to start receiving live vitals and ECG from the ambulance
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Enter Booking ID (e.g. BK-1234567890)"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: '13px 16px',
                  color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button
                onClick={handleJoin}
                style={{
                  padding: '13px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#3399ff,#0055cc)',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(51,153,255,0.4)',
                }}
              >
                Connect
              </button>
            </div>
          </motion.div>
        ) : (
          <div>
            {/* ── Patient header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: '0 0 3px' }}>
                  👤 {telemetry?.patientName || 'Awaiting patient data...'}
                </h2>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                  Booking: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{bookingId}</span>
                  {telemetry?.driverName && (
                    <span style={{ marginLeft: 12 }}>🚑 Driver: <span style={{ color: '#ff8800' }}>{telemetry.driverName}</span></span>
                  )}
                </div>
              </div>

              {/* Situation badge */}
              {telemetry?.situation && (
                <motion.div
                  animate={sit.pulse ? { scale: [1, 1.04, 1], boxShadow: [`0 0 0px ${sit.color}`, `0 0 20px ${sit.color}`, `0 0 0px ${sit.color}`] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    background: sit.bg, border: `2px solid ${sit.border}`,
                    borderRadius: 16, padding: '10px 22px',
                    color: sit.color, fontWeight: 900, fontSize: 15,
                  }}
                >
                  {sit.label}
                </motion.div>
              )}
            </div>

            {/* ── Vitals grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {VITAL_CONFIG.map(v => {
                const val = vitals[v.field];
                return (
                  <motion.div
                    key={v.field}
                    animate={val && telemetry?.situation === 'critical' ? { borderColor: ['rgba(255,51,51,0.2)', 'rgba(255,51,51,0.6)', 'rgba(255,51,51,0.2)'] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${v.color}22`,
                      borderRadius: 14, padding: '18px 16px', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
                    <div style={{ color: val ? v.color : 'rgba(255,255,255,0.15)', fontWeight: 900, fontSize: 28, lineHeight: 1, marginBottom: 4 }}>
                      {val || '—'}
                    </div>
                    <div style={{ color: v.color, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{v.unit}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{v.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, marginTop: 4 }}>Normal: {v.normal}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── ECG Monitor ── */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(0,204,102,0.2)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ color: '#00cc66', fontWeight: 800, fontSize: 13 }}>📈 Live ECG Monitor</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#00cc66' }}
                  />
                  <span style={{ color: '#00cc66', fontSize: 11, fontWeight: 700 }}>STREAMING</span>
                </div>
              </div>
              <ECGMonitor data={ecgData} situation={telemetry?.situation || 'stable'} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Real-time waveform from ambulance</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Speed: 25mm/s</span>
              </div>
            </div>

            {/* ── Bottom row: Alerts + Actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>

              {/* Alert log */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  🔔 Alert Log
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <AnimatePresence>
                    {alerts.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                        Waiting for telemetry...
                      </div>
                    ) : alerts.map(a => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                          background: `${a.color}08`,
                          border: `1px solid ${a.color}20`,
                          borderRadius: 8, padding: '7px 10px',
                        }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>{a.time}</span>
                        <span style={{ color: a.color, fontSize: 12 }}>{a.msg}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* ER Actions */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  ER Actions
                </div>
                {[
                  { label: '🩺 Prepare Trauma Bay',   color: '#ff3333', bg: 'rgba(255,51,51,0.1)',   border: 'rgba(255,51,51,0.3)'   },
                  { label: '🩸 Order Blood Bank',     color: '#ff8800', bg: 'rgba(255,136,0,0.1)',  border: 'rgba(255,136,0,0.3)'   },
                  { label: '💉 ICU Standby',           color: '#aa44ff', bg: 'rgba(170,68,255,0.1)', border: 'rgba(170,68,255,0.3)'  },
                  { label: '📞 Alert Surgeon',         color: '#3399ff', bg: 'rgba(51,153,255,0.1)', border: 'rgba(51,153,255,0.3)'  },
                  { label: '🔄 Disconnect',            color: '#888',    bg: 'rgba(128,128,128,0.08)', border: 'rgba(128,128,128,0.2)',
                    onClick: () => { setConnected(false); setTelemetry(null); setEcgData(Array(120).fill(0)); setAlerts([]); }
                  },
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick || (() => addAlert(`${btn.label} — Action triggered`, btn.color))}
                    style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      background: btn.bg, border: `1px solid ${btn.border}`,
                      color: btn.color, fontWeight: 700, fontSize: 12,
                      fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

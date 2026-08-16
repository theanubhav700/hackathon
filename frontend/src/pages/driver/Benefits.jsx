import { useState, useEffect } from 'react';
import DriverLayout from '../../layouts/DriverLayout';
import { motion, AnimatePresence } from 'framer-motion';

// ── All 10 milestones ────────────────────────────────────────────────────────
const MILESTONES = [
  {
    trips:   10,
    title:   'Free Petrol Voucher',
    desc:    'Ek baar full tank petrol bilkul free — nearest pump par redeem karo.',
    reward:  '⛽ 1x Free Petrol Fill',
    icon:    '⛽',
    color:   '#3399ff',
    badge:   'STARTER',
  },
  {
    trips:   20,
    title:   'Cash Bonus ₹500',
    desc:    '₹500 seedha aapke registered bank account mein transfer hoga.',
    reward:  '💵 ₹500 Cash',
    icon:    '💵',
    color:   '#00cc66',
    badge:   'BRONZE',
  },
  {
    trips:   30,
    title:   'Free Vehicle Wash (3x)',
    desc:    'Partner wash centers par 3 baar free professional vehicle cleaning.',
    reward:  '🚿 3x Free Wash',
    icon:    '🚿',
    color:   '#00bbff',
    badge:   'BRONZE II',
  },
  {
    trips:   40,
    title:   'Cash Bonus ₹1,000',
    desc:    '₹1,000 bonus — consistently delivering great service ka reward.',
    reward:  '💰 ₹1,000 Cash',
    icon:    '💰',
    color:   '#ffaa00',
    badge:   'SILVER',
  },
  {
    trips:   50,
    title:   'Half-Month Fuel Allowance',
    desc:    '15 din ka daily fuel allowance — ₹100/day — seedha wallet mein.',
    reward:  '🛢️ ₹1,500 Fuel',
    icon:    '🛢️',
    color:   '#ff8800',
    badge:   'SILVER II',
  },
  {
    trips:   60,
    title:   'Insurance Premium Cover',
    desc:    'Ek saal ka vehicle insurance premium company ki taraf se.',
    reward:  '🛡️ 1yr Insurance',
    icon:    '🛡️',
    color:   '#aa44ff',
    badge:   'GOLD',
  },
  {
    trips:   70,
    title:   'Cash Bonus ₹2,500',
    desc:    'Bade milestone ka bada reward — ₹2,500 direct bank transfer.',
    reward:  '💎 ₹2,500 Cash',
    icon:    '💎',
    color:   '#ff4488',
    badge:   'GOLD II',
  },
  {
    trips:   80,
    title:   'Family Health Checkup',
    desc:    'Aapke aur family ke liye ek poora health checkup package — free.',
    reward:  '🏥 Family Checkup',
    icon:    '🏥',
    color:   '#00ddaa',
    badge:   'PLATINUM',
  },
  {
    trips:   90,
    title:   'Weekend Trip Voucher',
    desc:    'ResQ-partnered hotel mein 2-night stay voucher — deserving break.',
    reward:  '🏨 2-Night Stay',
    icon:    '🏨',
    color:   '#ffcc00',
    badge:   'PLATINUM II',
  },
  {
    trips:   100,
    title:   'ResQ Legend Award + ₹10,000',
    desc:    'Top driver ka sabse bada award — ₹10,000 cash + ResQ Legend badge aur certificate.',
    reward:  '🏆 ₹10,000 + Legend',
    icon:    '🏆',
    color:   '#ff6600',
    badge:   'LEGEND',
  },
];

export default function Benefits() {
  const driver = JSON.parse(localStorage.getItem('resq_user') || '{}');

  // Real trip count from completed trip history
  const [tripCount, setTripCount] = useState(() => {
    const history = JSON.parse(localStorage.getItem('resq_trip_history') || '[]');
    return history.length;
  });

  // Track which milestones have been claimed
  const [claimed, setClaimed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('resq_benefits_claimed') || '[]');
    } catch { return []; }
  });

  // Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const sync = () => {
      const history = JSON.parse(localStorage.getItem('resq_trip_history') || '[]');
      setTripCount(history.length);
    };
    window.addEventListener('storage', sync);
    const interval = setInterval(sync, 3000);
    return () => { window.removeEventListener('storage', sync); clearInterval(interval); };
  }, []);

  const showToast = (msg, color = '#00cc66') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  const handleClaim = (milestone) => {
    if (claimed.includes(milestone.trips)) return;
    if (tripCount < milestone.trips) return;

    const updated = [...claimed, milestone.trips];
    setClaimed(updated);
    localStorage.setItem('resq_benefits_claimed', JSON.stringify(updated));
    showToast(`🎉 "${milestone.title}" successfully claimed!`, '#00cc66');
  };

  // Next milestone to unlock
  const nextMilestone = MILESTONES.find(m => tripCount < m.trips);
  const tripsToNext   = nextMilestone ? nextMilestone.trips - tripCount : 0;

  // Progress within current milestone band
  const prevTarget = (() => {
    const idx = MILESTONES.findIndex(m => tripCount < m.trips);
    return idx > 0 ? MILESTONES[idx - 1].trips : 0;
  })();
  const nextTarget  = nextMilestone?.trips || 100;
  const bandSize    = nextTarget - prevTarget;
  const bandProgress = Math.min(((tripCount - prevTarget) / bandSize) * 100, 100);

  const unlockedCount = MILESTONES.filter(m => tripCount >= m.trips).length;
  const claimedCount  = claimed.length;

  return (
    <DriverLayout>
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, background: '#0a1a0f',
              border: `1px solid ${toast.color}55`,
              borderRadius: 14, padding: '13px 24px',
              color: toast.color, fontWeight: 700, fontSize: 14,
              boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${toast.color}33`,
            }}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 5px' }}>🎁 Driver Benefits</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Jitni zyada trips, utne bade rewards — yeh hai aapka achievement journey
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Trips Completed', value: tripCount, icon: '🚑', color: '#3399ff' },
          { label: 'Rewards Unlocked', value: `${unlockedCount}/10`, icon: '🔓', color: '#ffaa00' },
          { label: 'Rewards Claimed',  value: `${claimedCount}/10`,  icon: '✅', color: '#00cc66' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}25`,
            borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${s.color}18`, border: `1px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{s.icon}</div>
            <div>
              <div style={{ color: s.color, fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Next milestone progress ── */}
      {nextMilestone && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '18px 22px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              Next: {nextMilestone.icon} {nextMilestone.title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {tripCount}/{nextMilestone.trips} trips &nbsp;·&nbsp;
              <span style={{ color: nextMilestone.color, fontWeight: 700 }}>{tripsToNext} more to go</span>
            </div>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bandProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${nextMilestone.color}, ${nextMilestone.color}99)`, borderRadius: 4 }}
            />
          </div>
        </div>
      )}

      {tripCount >= 100 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,102,0,0.12), rgba(255,204,0,0.08))',
          border: '1px solid rgba(255,102,0,0.4)', borderRadius: 16, padding: '18px 24px',
          marginBottom: 28, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>
          <div style={{ color: '#ff6600', fontWeight: 900, fontSize: 18 }}>Aap ResQ Legend ban gaye!</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>Sabhi 10 milestones unlock ho gaye — extraordinary service!</div>
        </div>
      )}

      {/* ── Milestones grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MILESTONES.map((m, i) => {
          const unlocked  = tripCount >= m.trips;
          const isClaimed = claimed.includes(m.trips);
          const progress  = Math.min((tripCount / m.trips) * 100, 100);

          return (
            <motion.div
              key={m.trips}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${m.color}0a, rgba(255,255,255,0.02))`
                  : 'rgba(255,255,255,0.02)',
                border: unlocked
                  ? `1px solid ${m.color}35`
                  : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 18,
                transition: 'all 0.3s',
              }}
            >
              {/* Icon circle */}
              <div style={{
                width: 54, height: 54, borderRadius: 14, flexShrink: 0,
                background: unlocked ? `${m.color}20` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${unlocked ? m.color + '50' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, filter: unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
                transition: 'all 0.3s',
              }}>
                {unlocked ? m.icon : '🔒'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    color: unlocked ? '#fff' : 'rgba(255,255,255,0.3)',
                    fontWeight: 800, fontSize: 14, transition: 'color 0.3s',
                  }}>{m.title}</span>

                  {/* Badge */}
                  <span style={{
                    fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: 1,
                    background: unlocked ? `${m.color}25` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${unlocked ? m.color + '40' : 'rgba(255,255,255,0.08)'}`,
                    color: unlocked ? m.color : 'rgba(255,255,255,0.2)',
                  }}>{m.badge}</span>

                  {/* Trip count pill */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
                  }}>🚑 {m.trips} trips</span>
                </div>

                <div style={{
                  color: unlocked ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                  fontSize: 12, marginBottom: 10, lineHeight: 1.5,
                }}>{m.desc}</div>

                {/* Progress bar */}
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 3,
                      background: unlocked
                        ? `linear-gradient(90deg, ${m.color}, ${m.color}bb)`
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 4 }}>
                  {tripCount}/{m.trips} trips {unlocked ? '— Unlocked ✓' : `— ${m.trips - tripCount} more needed`}
                </div>
              </div>

              {/* Reward + Claim */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                <div style={{
                  background: unlocked ? `${m.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${unlocked ? m.color + '35' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: '6px 12px', textAlign: 'center',
                }}>
                  <div style={{ color: unlocked ? m.color : 'rgba(255,255,255,0.2)', fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {m.reward}
                  </div>
                </div>

                {unlocked && !isClaimed && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleClaim(m)}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
                      color: '#fff', fontWeight: 800, fontSize: 12, fontFamily: 'inherit',
                      boxShadow: `0 4px 14px ${m.color}40`,
                    }}
                  >🎁 Claim</motion.button>
                )}

                {isClaimed && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(0,204,102,0.1)', border: '1px solid rgba(0,204,102,0.3)',
                    color: '#00cc66', padding: '7px 14px', borderRadius: 10,
                    fontSize: 12, fontWeight: 700,
                  }}>✅ Claimed</div>
                )}

                {!unlocked && (
                  <div style={{
                    color: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: 600,
                    padding: '7px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>🔒 Locked</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Footer note ── */}
      <div style={{
        marginTop: 28, padding: '14px 20px', borderRadius: 12,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', lineHeight: 1.7,
      }}>
        💡 Rewards har baar count hote hain. Claim karne ke baad HR ya manager se contact karein disbursement ke liye.
        <br />Trip count automatically update hota hai jab aap trip complete karte hain.
      </div>
    </DriverLayout>
  );
}

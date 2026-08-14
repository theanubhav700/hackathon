import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SecretPrank from './components/SecretPrank';

// Placeholder pages — will be built next
function ComingSoon({ title }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#05050f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', color: '#fff', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🚑</div>
      <h1 style={{ color: '#ff3333', margin: 0 }}>{title}</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Coming next — under construction</p>
      <a href="/" style={{
        padding: '10px 24px', borderRadius: 8,
        background: 'linear-gradient(135deg,#ff2222,#cc0000)',
        color: '#fff', textDecoration: 'none', fontWeight: 700,
      }}>← Back to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SecretPrank />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer/*" element={<ComingSoon title="Customer Portal" />} />
        <Route path="/driver/*" element={<ComingSoon title="Driver Panel" />} />
        <Route path="/admin/*" element={<ComingSoon title="Admin Dashboard" />} />
        <Route path="*" element={<ComingSoon title="404 — Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

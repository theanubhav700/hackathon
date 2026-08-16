import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Landing
import LandingPage from './pages/LandingPage';

// Auth
import LoginPage        from './pages/LoginPage';
import CustomerLogin    from './pages/auth/CustomerLogin';
import DriverLogin      from './pages/auth/DriverLogin';
import AdminLogin       from './pages/auth/AdminLogin';
import CustomerRegister from './pages/auth/CustomerRegister';

// Customer
import BookAmbulance from './pages/customer/BookAmbulance';
import Profile       from './pages/customer/Profile';
import MyTickets     from './pages/customer/MyTickets';

// Admin
import AdminDashboard      from './pages/admin/AdminDashboard';
import ActiveEmergencies   from './pages/admin/ActiveEmergencies';
import AmbulanceManagement from './pages/admin/AmbulanceManagement';
import DriverManagement    from './pages/admin/DriverManagement';
import CustomerManagement  from './pages/admin/CustomerManagement';
import HospitalManagement  from './pages/admin/HospitalManagement';
import ActivityLogs        from './pages/admin/ActivityLogs';
import Analytics           from './pages/admin/Analytics';

// Driver
import DriverDashboard   from './pages/driver/DriverDashboard';
import EmergencyRequests from './pages/driver/EmergencyRequests';
import PickupNavigation  from './pages/driver/PickupNavigation';
import PatientInfo       from './pages/driver/PatientInfo';
import PatientReceived   from './pages/driver/PatientReceived';
import LiveJourney       from './pages/driver/LiveJourney';
import RouteManagement   from './pages/driver/RouteManagement';
import TrafficAlerts     from './pages/driver/TrafficAlerts';
import PatientTelemetry  from './pages/driver/PatientTelemetry';
import HospitalInfo      from './pages/driver/HospitalInfo';
import HospitalPreAlert  from './pages/driver/HospitalPreAlert';
import CompleteTrip      from './pages/driver/CompleteTrip';
import TripHistory       from './pages/driver/TripHistory';
import Notifications     from './pages/driver/Notifications';
import Benefits          from './pages/driver/Benefits';
import GreenCorridor     from './pages/driver/GreenCorridor';

// Hospital
import ERDashboard from './pages/hospital/ERDashboard';

// Auth guard for driver routes
function DriverRoute({ children }) {
  const token = localStorage.getItem('resq_token');
  const user  = JSON.parse(localStorage.getItem('resq_user') || '{}');
  if (!token || user.role !== 'driver') {
    window.location.href = '/login/driver';
    return null;
  }
  return children;
}

// Placeholder
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
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Coming soon — under construction</p>
      <a href="/" style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg,#ff2222,#cc0000)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>← Back to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Landing ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Auth ── */}
        <Route path="/login"             element={<LoginPage />} />
        <Route path="/login/customer"    element={<CustomerLogin />} />
        <Route path="/login/driver"      element={<DriverLogin />} />
        <Route path="/login/admin"       element={<AdminLogin />} />
        <Route path="/register/customer" element={<CustomerRegister />} />

        {/* ── Customer ── */}
        <Route path="/customer"          element={<BookAmbulance />} />
        <Route path="/customer/book"     element={<BookAmbulance />} />
        <Route path="/customer/profile"  element={<Profile />} />
        <Route path="/customer/tickets"  element={<MyTickets />} />

        {/* ── Admin ── */}
        <Route path="/admin"             element={<AdminDashboard />} />
        <Route path="/admin/dashboard"   element={<AdminDashboard />} />
        <Route path="/admin/emergencies" element={<ActiveEmergencies />} />
        <Route path="/admin/ambulances"  element={<AmbulanceManagement />} />
        <Route path="/admin/drivers"     element={<DriverManagement />} />
        <Route path="/admin/customers"   element={<CustomerManagement />} />
        <Route path="/admin/hospitals"   element={<HospitalManagement />} />
        <Route path="/admin/logs"        element={<ActivityLogs />} />
        <Route path="/admin/analytics"   element={<Analytics />} />

        {/* ── Driver ── */}
        <Route path="/driver/dashboard"     element={<DriverRoute><DriverDashboard /></DriverRoute>} />
        <Route path="/driver/requests"      element={<DriverRoute><EmergencyRequests /></DriverRoute>} />
        <Route path="/driver/navigation"    element={<DriverRoute><PickupNavigation /></DriverRoute>} />
        <Route path="/driver/patient"       element={<DriverRoute><PatientInfo /></DriverRoute>} />
        <Route path="/driver/received"      element={<DriverRoute><PatientReceived /></DriverRoute>} />
        <Route path="/driver/journey"       element={<DriverRoute><LiveJourney /></DriverRoute>} />
        <Route path="/driver/routes"        element={<DriverRoute><RouteManagement /></DriverRoute>} />
        <Route path="/driver/traffic"       element={<DriverRoute><TrafficAlerts /></DriverRoute>} />
        <Route path="/driver/telemetry"     element={<DriverRoute><PatientTelemetry /></DriverRoute>} />
        <Route path="/driver/hospital"      element={<DriverRoute><HospitalInfo /></DriverRoute>} />
        <Route path="/driver/prealert"      element={<DriverRoute><HospitalPreAlert /></DriverRoute>} />
        <Route path="/driver/complete"      element={<DriverRoute><CompleteTrip /></DriverRoute>} />
        <Route path="/driver/history"       element={<DriverRoute><TripHistory /></DriverRoute>} />
        <Route path="/driver/notifications" element={<DriverRoute><Notifications /></DriverRoute>} />
        <Route path="/driver/benefits"      element={<DriverRoute><Benefits /></DriverRoute>} />
        <Route path="/driver/corridor"      element={<DriverRoute><GreenCorridor /></DriverRoute>} />
        <Route path="/driver"               element={<DriverRoute><DriverDashboard /></DriverRoute>} />

        {/* ── Hospital ER ── */}
        <Route path="/hospital/er" element={<ERDashboard />} />

        {/* ── 404 ── */}
        <Route path="*" element={<ComingSoon title="404 — Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

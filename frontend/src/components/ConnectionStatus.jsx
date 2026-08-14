import { useState, useEffect } from 'react';
import { testConnection } from '../services/api';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    testConnection()
      .then((res) => {
        setStatus('connected');
        setMessage(res.data.message);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Cannot reach backend. Make sure server is running on port 5000.');
      });
  }, []);

  const styles = {
    checking: { background: '#1a1a2e', border: '2px solid #f0a500', color: '#f0a500' },
    connected: { background: '#0d1b0d', border: '2px solid #00ff41', color: '#00ff41' },
    error:     { background: '#1a0000', border: '2px solid #ff0000', color: '#ff0000' },
  };

  const icons = { checking: '⏳', connected: '✅', error: '❌' };
  const labels = { checking: 'CONNECTING...', connected: 'BACKEND LIVE', error: 'CONNECTION FAILED' };

  return (
    <div style={{
      ...styles[status],
      padding: '12px 20px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px'
    }}>
      <span style={{ fontSize: '18px' }}>{icons[status]}</span>
      <span><strong>{labels[status]}</strong> — {message || 'Waiting for response...'}</span>
    </div>
  );
}

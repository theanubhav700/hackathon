import { useState, useEffect } from 'react';
import { getAllItems, createItem, deleteItem } from '../services/api';

export default function ItemManager() {
  const [items, setItems]   = useState([]);
  const [title, setTitle]   = useState('');
  const [desc, setDesc]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const fetchItems = async () => {
    try {
      const res = await getAllItems();
      setItems(res.data.data);
    } catch {
      setError('Failed to fetch items');
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createItem({ title, description: desc });
      setTitle('');
      setDesc('');
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(id);
      await fetchItems();
    } catch {
      setError('Failed to delete item');
    }
  };

  return (
    <div style={{ fontFamily: 'monospace' }}>
      <h2 style={{ color: '#00ff41', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        📦 Items — MongoDB
      </h2>

      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ ...inputStyle, flex: 2 }}
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : '+ Add'}
          </button>
        </div>
        {error && <p style={{ color: '#ff4444', marginTop: '8px' }}>⚠️ {error}</p>}
      </form>

      {/* Items List */}
      {items.length === 0 ? (
        <p style={{ color: '#555' }}>No items yet. Add one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li key={item._id} style={itemStyle}>
              <div>
                <strong style={{ color: '#e0e0e0' }}>{item.title}</strong>
                {item.description && (
                  <span style={{ color: '#888', marginLeft: '10px' }}>{item.description}</span>
                )}
                <span style={{ ...badgeStyle(item.status), marginLeft: '10px' }}>
                  {item.status}
                </span>
              </div>
              <button onClick={() => handleDelete(item._id)} style={deleteBtnStyle}>
                🗑 Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────
const inputStyle = {
  flex: 1, minWidth: '140px',
  background: '#111', border: '1px solid #333',
  color: '#e0e0e0', padding: '8px 12px',
  borderRadius: '4px', fontFamily: 'monospace', fontSize: '14px'
};
const btnStyle = {
  background: '#00ff41', color: '#000',
  border: 'none', padding: '8px 18px',
  borderRadius: '4px', cursor: 'pointer',
  fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px'
};
const deleteBtnStyle = {
  background: 'transparent', color: '#ff4444',
  border: '1px solid #ff4444', padding: '4px 10px',
  borderRadius: '4px', cursor: 'pointer',
  fontFamily: 'monospace', fontSize: '12px'
};
const itemStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 14px', marginBottom: '8px',
  background: '#111', border: '1px solid #222', borderRadius: '4px'
};
const badgeStyle = (status) => ({
  fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
  background: status === 'active' ? '#003300' : '#330000',
  color: status === 'active' ? '#00ff41' : '#ff4444',
  border: `1px solid ${status === 'active' ? '#00ff41' : '#ff4444'}`
});

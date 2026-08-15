import axios from 'axios';

// Base URL from .env — falls back to localhost if not set
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Auth API ───────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser    = (data) => API.post('/auth/login', data);


export const getAllItems  = ()          => API.get('/items');
export const getItemById = (id)        => API.get(`/items/${id}`);
export const createItem  = (data)      => API.post('/items', data);
export const updateItem  = (id, data)  => API.put(`/items/${id}`, data);
export const deleteItem  = (id)        => API.delete(`/items/${id}`);

// ── Health check ───────────────────────────────────────
export const testConnection = () => API.get('/test');

export default API;

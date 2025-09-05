export const API_BASE = import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE || '';

async function request(path, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // <- include cookie
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let body = {};
    try {
      body = await res.json();
    } catch {}
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth(password) {
    return request('/api/calendar/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
  listEvents() {
    return request('/api/calendar/events');
  },
  createEvent(data) {
    return request('/api/calendar/events', { method: 'POST', body: JSON.stringify(data) });
  },
  updateEvent(id, data) {
    return request(`/api/calendar/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteEvent(id) {
    return request(`/api/calendar/events/${id}`, { method: 'DELETE' });
  },
};

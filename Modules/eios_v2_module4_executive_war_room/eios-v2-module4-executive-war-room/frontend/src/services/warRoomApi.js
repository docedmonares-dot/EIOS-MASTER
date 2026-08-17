const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v2';

function token(){ return localStorage.getItem('eios_token'); }

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.errors?.join(', ') || 'API Error');
  }
  return res.json();
}

export const WarRoomAPI = {
  kpis: () => api('/warroom/kpis'),
  sessions: () => api('/warroom/sessions'),
  createSession: body => api('/warroom/sessions', { method:'POST', body:JSON.stringify(body) }),
  alerts: () => api('/warroom/alerts'),
  createAlert: body => api('/warroom/alerts', { method:'POST', body:JSON.stringify(body) }),
  updateAlertStatus: (id, status) => api(`/warroom/alerts/${id}/status`, { method:'PATCH', body:JSON.stringify({ status }) }),
  recommendations: () => api('/warroom/recommendations'),
  generateRecommendations: body => api('/warroom/recommendations/generate', { method:'POST', body:JSON.stringify(body) }),
  snapshots: body => api('/warroom/snapshots', { method:'POST', body:JSON.stringify(body) }),
  mapLayers: () => api('/warroom/map-layers'),
  createMapLayer: body => api('/warroom/map-layers', { method:'POST', body:JSON.stringify(body) }),
  executiveBrief: body => api('/warroom/reports/executive-brief', { method:'POST', body:JSON.stringify(body) })
};
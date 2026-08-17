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

export const StrategyAPI = {
  sessions: () => api('/strategy/sessions'),
  createSession: body => api('/strategy/sessions', { method:'POST', body:JSON.stringify(body) }),
  recommendations: () => api('/strategy/recommendations'),
  generateRecommendations: body => api('/strategy/recommendations/generate', { method:'POST', body:JSON.stringify(body) }),
  updateRecommendationStatus: (id, status) => api(`/strategy/recommendations/${id}/status`, { method:'PATCH', body:JSON.stringify({ status }) }),
  messageTest: body => api('/strategy/message-test', { method:'POST', body:JSON.stringify(body) }),
  messageTests: () => api('/strategy/message-tests'),
  resourceAllocation: body => api('/strategy/resource-allocation', { method:'POST', body:JSON.stringify(body) }),
  allocationPlans: () => api('/strategy/resource-allocation'),
  risks: () => api('/strategy/risks'),
  createRisk: body => api('/strategy/risks', { method:'POST', body:JSON.stringify(body) }),
  memo: body => api('/strategy/memo', { method:'POST', body:JSON.stringify(body) }),
  actions: () => api('/strategy/actions'),
  createAction: body => api('/strategy/actions', { method:'POST', body:JSON.stringify(body) })
};
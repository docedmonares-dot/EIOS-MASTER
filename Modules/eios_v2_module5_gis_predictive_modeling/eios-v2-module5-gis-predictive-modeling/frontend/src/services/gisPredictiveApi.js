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

export const GisPredictiveAPI = {
  boundaries: params => api(`/gis/boundaries?${new URLSearchParams(params || {})}`),
  respondentPoints: params => api(`/gis/respondent-points?${new URLSearchParams(params || {})}`),
  areaSummary: () => api('/gis/area-summary'),
  layers: () => api('/gis/layers'),
  createLayer: body => api('/gis/layers', { method:'POST', body:JSON.stringify(body) }),
  classifyArea: body => api('/gis/classify-area', { method:'POST', body:JSON.stringify(body) }),
  computeIssueHotspots: body => api('/hotspots/issues/compute', { method:'POST', body:JSON.stringify(body) }),
  issueHotspots: () => api('/hotspots/issues'),
  computeQcHotspots: body => api('/hotspots/qc/compute', { method:'POST', body:JSON.stringify(body) }),
  qcHotspots: () => api('/hotspots/qc'),
  predictiveModels: () => api('/predictive/models'),
  createPredictiveModel: body => api('/predictive/models', { method:'POST', body:JSON.stringify(body) }),
  predictiveScore: body => api('/predictive/score', { method:'POST', body:JSON.stringify(body) }),
  predictiveScores: () => api('/predictive/scores')
};
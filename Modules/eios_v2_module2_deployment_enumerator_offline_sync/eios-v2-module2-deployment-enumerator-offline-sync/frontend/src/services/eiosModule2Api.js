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

export const PersonnelAPI = {
  list: () => api('/personnel'),
  create: body => api('/personnel', { method:'POST', body:JSON.stringify(body) }),
  update: (id, body) => api(`/personnel/${id}`, { method:'PUT', body:JSON.stringify(body) }),
  status: (id, status) => api(`/personnel/${id}/status`, { method:'PATCH', body:JSON.stringify({ status }) })
};

export const DeploymentAPI = {
  list: () => api('/deployments'),
  create: body => api('/deployments', { method:'POST', body:JSON.stringify(body) }),
  update: (id, body) => api(`/deployments/${id}`, { method:'PUT', body:JSON.stringify(body) }),
  status: (id, status) => api(`/deployments/${id}/status`, { method:'PATCH', body:JSON.stringify({ status }) }),
  assignSurvey: (id, body) => api(`/deployments/${id}/assign-survey`, { method:'POST', body:JSON.stringify(body) }),
  assignPersonnel: (id, body) => api(`/deployments/${id}/assign-personnel`, { method:'POST', body:JSON.stringify(body) }),
  assignArea: (id, body) => api(`/deployments/${id}/assign-area`, { method:'POST', body:JSON.stringify(body) })
};

export const EnumeratorAPI = {
  assignments: () => api('/enumerator/assignments'),
  activeSurvey: () => api('/enumerator/active-survey'),
  quota: () => api('/enumerator/quota'),
  draft: body => api('/enumerator/draft', { method:'POST', body:JSON.stringify(body) }),
  finalSubmit: body => api('/enumerator/final-submit', { method:'POST', body:JSON.stringify(body) })
};

export const DashboardAPI = {
  operations: () => api('/dashboard/operations'),
  supervisor: () => api('/dashboard/supervisor'),
  enumerator: () => api('/dashboard/enumerator')
};

export const QcGpsAPI = {
  precheck: body => api('/qc/precheck', { method:'POST', body:JSON.stringify(body) }),
  flags: () => api('/qc/flags'),
  gpsValidate: body => api('/gps/validate', { method:'POST', body:JSON.stringify(body) }),
  gpsCoverage: () => api('/gps/coverage')
};
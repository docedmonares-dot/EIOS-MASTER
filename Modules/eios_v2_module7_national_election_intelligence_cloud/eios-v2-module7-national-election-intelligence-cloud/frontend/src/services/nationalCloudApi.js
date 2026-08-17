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

export const NationalCloudAPI = {
  tenants: () => api('/cloud/tenants'),
  createTenant: body => api('/cloud/tenants', { method:'POST', body:JSON.stringify(body) }),
  assignTenantUser: body => api('/cloud/tenants/assign-user', { method:'POST', body:JSON.stringify(body) }),
  electionCycles: () => api('/cloud/election-cycles'),
  createElectionCycle: body => api('/cloud/election-cycles', { method:'POST', body:JSON.stringify(body) }),
  projects: () => api('/cloud/projects'),
  createProject: body => api('/cloud/projects', { method:'POST', body:JSON.stringify(body) }),
  geography: params => api(`/cloud/geography?${new URLSearchParams(params || {})}`),
  createGeography: body => api('/cloud/geography', { method:'POST', body:JSON.stringify(body) }),
  nodes: () => api('/cloud/regional-nodes'),
  createNode: body => api('/cloud/regional-nodes', { method:'POST', body:JSON.stringify(body) }),
  syncUpload: body => api('/cloud/sync/upload', { method:'POST', body:JSON.stringify(body) }),
  syncBatches: () => api('/cloud/sync/batches'),
  syncConflicts: () => api('/cloud/sync/conflicts'),
  refreshWarehouse: body => api('/cloud/warehouse/refresh', { method:'POST', body:JSON.stringify(body) }),
  warehouseJobs: () => api('/cloud/warehouse/jobs'),
  kpis: () => api('/cloud/command/kpis'),
  candidateMetrics: () => api('/cloud/command/candidate-metrics'),
  alerts: () => api('/cloud/alerts'),
  createAlert: body => api('/cloud/alerts', { method:'POST', body:JSON.stringify(body) })
};
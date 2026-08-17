const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v2';
function token(){ return localStorage.getItem('eios_token'); }
export async function api(path, options={}){
  const headers = { 'Content-Type':'application/json', ...(options.headers || {}) };
  const t = token();
  if(t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if(!res.ok){
    const body = await res.json().catch(()=>({}));
    throw new Error(body.error || body.errors?.join(', ') || 'API Error');
  }
  return res.json();
}
export const QuestionBankAPI = {
  list: (params={}) => api(`/questions?${new URLSearchParams(params)}`),
  create: body => api('/questions', { method:'POST', body:JSON.stringify(body) }),
  update: (id, body) => api(`/questions/${id}`, { method:'PUT', body:JSON.stringify(body) }),
  clone: (id, body={}) => api(`/questions/${id}/clone`, { method:'POST', body:JSON.stringify(body) }),
  status: (id, status) => api(`/questions/${id}/status`, { method:'PATCH', body:JSON.stringify({status}) }),
  archive: id => api(`/questions/${id}`, { method:'DELETE' })
};
export const SurveyBuilderAPI = {
  list: () => api('/surveys'),
  create: body => api('/surveys', { method:'POST', body:JSON.stringify(body) }),
  update: (id, body) => api(`/surveys/${id}`, { method:'PUT', body:JSON.stringify(body) }),
  archive: id => api(`/surveys/${id}`, { method:'DELETE' }),
  addSection: (id, body) => api(`/surveys/${id}/sections`, { method:'POST', body:JSON.stringify(body) }),
  addQuestion: (id, body) => api(`/surveys/${id}/questions`, { method:'POST', body:JSON.stringify(body) }),
  publish: (id, body={}) => api(`/surveys/${id}/publish`, { method:'POST', body:JSON.stringify(body) })
};
export const LogicAPI = {
  create: body => api('/logic', { method:'POST', body:JSON.stringify(body) }),
  list: survey_id => api(`/logic?survey_id=${survey_id}`)
};
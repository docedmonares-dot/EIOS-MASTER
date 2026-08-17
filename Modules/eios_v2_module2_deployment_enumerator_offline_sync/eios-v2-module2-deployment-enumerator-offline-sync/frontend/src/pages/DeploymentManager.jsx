import React, { useEffect, useState } from 'react';
import { DeploymentAPI } from '../services/eiosModule2Api';

export default function DeploymentManager() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ deployment_name:'', election_type:'Local Election', geographic_scope:'', start_date:'', end_date:'', deployment_status:'Draft' });

  async function load(){ setRows(await DeploymentAPI.list()); }
  useEffect(()=>{ load(); },[]);

  async function save(e){
    e.preventDefault();
    await DeploymentAPI.create(form);
    setForm({ deployment_name:'', election_type:'Local Election', geographic_scope:'', start_date:'', end_date:'', deployment_status:'Draft' });
    await load();
  }

  return <div className="page">
    <h1>Deployment Manager</h1>
    <form onSubmit={save} className="card">
      <input placeholder="Deployment Name" value={form.deployment_name} onChange={e=>setForm({...form, deployment_name:e.target.value})}/>
      <input placeholder="Election Type" value={form.election_type} onChange={e=>setForm({...form, election_type:e.target.value})}/>
      <input placeholder="Geographic Scope" value={form.geographic_scope} onChange={e=>setForm({...form, geographic_scope:e.target.value})}/>
      <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})}/>
      <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})}/>
      <button>Create Deployment</button>
    </form>
    <table><thead><tr><th>Name</th><th>Type</th><th>Scope</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.deployment_id}><td>{r.deployment_name}</td><td>{r.election_type}</td><td>{r.geographic_scope}</td><td>{r.deployment_status}</td><td><button onClick={()=>DeploymentAPI.status(r.deployment_id,'Active').then(load)}>Activate</button><button onClick={()=>DeploymentAPI.status(r.deployment_id,'Paused').then(load)}>Pause</button><button onClick={()=>DeploymentAPI.status(r.deployment_id,'Closed').then(load)}>Close</button></td></tr>)}</tbody></table>
  </div>
}
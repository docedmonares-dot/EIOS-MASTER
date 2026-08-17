import React, { useEffect, useState } from 'react';
import { PersonnelAPI } from '../services/eiosModule2Api';

export default function PersonnelManagement() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ full_name:'', role:'Enumerator', mobile_number:'', email:'', team_name:'', status:'Active' });

  async function load(){ setRows(await PersonnelAPI.list()); }
  useEffect(()=>{ load(); },[]);

  async function save(e){
    e.preventDefault();
    await PersonnelAPI.create(form);
    setForm({ full_name:'', role:'Enumerator', mobile_number:'', email:'', team_name:'', status:'Active' });
    await load();
  }

  return <div className="page">
    <h1>Personnel Management</h1>
    <form onSubmit={save} className="card">
      <input placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})}/>
      <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
        {['Operations Manager','Deployment Supervisor','QC Supervisor','Field Supervisor','Enumerator','Analyst','Client Viewer'].map(r=><option key={r}>{r}</option>)}
      </select>
      <input placeholder="Mobile Number" value={form.mobile_number} onChange={e=>setForm({...form, mobile_number:e.target.value})}/>
      <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
      <input placeholder="Team Name" value={form.team_name} onChange={e=>setForm({...form, team_name:e.target.value})}/>
      <button>Add Personnel</button>
    </form>
    <table><thead><tr><th>Name</th><th>Role</th><th>Mobile</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.personnel_id}><td>{r.full_name}</td><td>{r.role}</td><td>{r.mobile_number}</td><td>{r.email}</td><td>{r.status}</td><td><button onClick={()=>PersonnelAPI.status(r.personnel_id,'Suspended').then(load)}>Suspend</button><button onClick={()=>PersonnelAPI.status(r.personnel_id,'Active').then(load)}>Activate</button></td></tr>)}</tbody></table>
  </div>
}
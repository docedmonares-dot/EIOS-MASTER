import React, { useState } from 'react';
import { DeploymentAPI } from '../services/eiosModule2Api';

export default function AreaAssignment() {
  const [form, setForm] = useState({
    deployment_id:'', personnel_id:'', supervisor_id:'', region:'', province:'',
    municipality:'', barangay:'', district:'', precinct_cluster:'', voting_center:'',
    quota_target:0, start_date:'', end_date:''
  });

  async function save(e) {
    e.preventDefault();
    await DeploymentAPI.assignArea(form.deployment_id, form);
    alert('Area assigned.');
  }

  return <div className="page">
    <h1>Area and Quota Assignment</h1>
    <form onSubmit={save} className="card grid">
      {Object.keys(form).map(k => <input key={k} placeholder={k} value={form[k]} onChange={e=>setForm({...form, [k]:e.target.value})}/>)}
      <button>Assign Area</button>
    </form>
  </div>
}
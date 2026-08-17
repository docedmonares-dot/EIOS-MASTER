import React, { useEffect, useState } from 'react';
import { NationalCloudAPI } from '../services/nationalCloudApi';
import '../nationalCloud.css';

export default function NationalGeographyDashboard() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ geo_level:'Region', geo_code:'', geo_name:'', psgc_code:'', registered_voters:0, population:0 });

  async function load(){ setRows(await NationalCloudAPI.geography({})); }
  useEffect(()=>{ load(); },[]);

  async function save(e){
    e.preventDefault();
    await NationalCloudAPI.createGeography(form);
    await load();
  }

  return (
    <div className="national-cloud-page">
      <h1>National Geography</h1>
      <form className="cloud-panel" onSubmit={save}>
        <select value={form.geo_level} onChange={e=>setForm({...form, geo_level:e.target.value})}>
          {['Country','Island Group','Region','Province','HUC','City','Municipality','Congressional District','Legislative District','Barangay','Precinct Cluster','Voting Center'].map(x=><option key={x}>{x}</option>)}
        </select>
        <input placeholder="Geo Code" value={form.geo_code} onChange={e=>setForm({...form, geo_code:e.target.value})}/>
        <input placeholder="Geo Name" value={form.geo_name} onChange={e=>setForm({...form, geo_name:e.target.value})}/>
        <input placeholder="PSGC Code" value={form.psgc_code} onChange={e=>setForm({...form, psgc_code:e.target.value})}/>
        <input type="number" placeholder="Registered Voters" value={form.registered_voters} onChange={e=>setForm({...form, registered_voters:Number(e.target.value)})}/>
        <input type="number" placeholder="Population" value={form.population} onChange={e=>setForm({...form, population:Number(e.target.value)})}/>
        <button>Add Geography</button>
      </form>

      <table><thead><tr><th>Level</th><th>Code</th><th>Name</th><th>Voters</th><th>Population</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.geo_id}><td>{r.geo_level}</td><td>{r.geo_code}</td><td>{r.geo_name}</td><td>{r.registered_voters}</td><td>{r.population}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { NationalCloudAPI } from '../services/nationalCloudApi';
import '../nationalCloud.css';

export default function TenantAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ tenant_code:'', tenant_name:'', tenant_type:'Campaign Organization', subscription_tier:'Enterprise', data_region:'Philippines' });

  async function load(){ setTenants(await NationalCloudAPI.tenants()); }
  useEffect(()=>{ load(); },[]);

  async function save(e) {
    e.preventDefault();
    await NationalCloudAPI.createTenant(form);
    setForm({ tenant_code:'', tenant_name:'', tenant_type:'Campaign Organization', subscription_tier:'Enterprise', data_region:'Philippines' });
    await load();
  }

  return (
    <div className="national-cloud-page">
      <h1>Tenant Administration</h1>
      <form className="cloud-panel" onSubmit={save}>
        <input placeholder="Tenant Code" value={form.tenant_code} onChange={e=>setForm({...form, tenant_code:e.target.value})}/>
        <input placeholder="Tenant Name" value={form.tenant_name} onChange={e=>setForm({...form, tenant_name:e.target.value})}/>
        <input placeholder="Tenant Type" value={form.tenant_type} onChange={e=>setForm({...form, tenant_type:e.target.value})}/>
        <input placeholder="Subscription Tier" value={form.subscription_tier} onChange={e=>setForm({...form, subscription_tier:e.target.value})}/>
        <input placeholder="Data Region" value={form.data_region} onChange={e=>setForm({...form, data_region:e.target.value})}/>
        <button>Create Tenant</button>
      </form>

      <table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Tier</th><th>Status</th></tr></thead>
        <tbody>{tenants.map(t => <tr key={t.tenant_id}><td>{t.tenant_code}</td><td>{t.tenant_name}</td><td>{t.tenant_type}</td><td>{t.subscription_tier}</td><td>{t.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
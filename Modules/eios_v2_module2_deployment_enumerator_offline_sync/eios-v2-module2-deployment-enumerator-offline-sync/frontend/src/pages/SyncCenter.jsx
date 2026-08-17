import React, { useEffect, useState } from 'react';
import { getAllRecords } from '../offline/indexedDbEngine';
import { syncOfflineResponses } from '../offline/syncClient';

export default function SyncCenter({ deviceId, enumeratorId, deploymentId }) {
  const [records, setRecords] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  async function load(){ setRecords(await getAllRecords('responses')); }

  useEffect(()=>{
    load();
    const on=()=>setOnline(true), off=()=>setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return ()=>{window.removeEventListener('online', on); window.removeEventListener('offline', off);}
  },[]);

  async function sync(){
    if (!online) return alert('Offline. Cannot sync yet.');
    const result = await syncOfflineResponses({ device_id: deviceId, enumerator_id: enumeratorId, deployment_id: deploymentId });
    alert(`Sync completed. Accepted: ${result.accepted_records?.length || 0}`);
    await load();
  }

  return <div className="page">
    <h1>Sync Center</h1>
    <p>Status: {online ? 'ONLINE' : 'OFFLINE'}</p>
    <button onClick={sync}>Sync Now</button>
    <table><thead><tr><th>Local ID</th><th>Respondent</th><th>Status</th></tr></thead><tbody>
      {records.map(r=><tr key={r.local_response_id}><td>{r.local_response_id}</td><td>{r.respondent_code}</td><td>{r.sync_status}</td></tr>)}
    </tbody></table>
  </div>
}
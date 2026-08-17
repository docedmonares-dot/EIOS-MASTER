import React, { useEffect, useState } from 'react';
import { NationalCloudAPI } from '../services/nationalCloudApi';
import '../nationalCloud.css';

export default function RegionalNodeDashboard() {
  const [nodes, setNodes] = useState([]);
  const [batches, setBatches] = useState([]);

  async function load() {
    setNodes(await NationalCloudAPI.nodes());
    setBatches(await NationalCloudAPI.syncBatches());
  }
  useEffect(()=>{ load(); },[]);

  async function simulateSync(node) {
    await NationalCloudAPI.syncUpload({
      tenant_id: node.tenant_id,
      node_id: node.node_id,
      source_system: 'Regional Node',
      sync_direction: 'Upload',
      records: [{ entity_type:'test', entity_id:null, payload:{ ok:true }}]
    });
    await load();
  }

  return (
    <div className="national-cloud-page">
      <h1>Regional Node Control</h1>
      <section className="cloud-panel">
        <h2>Nodes</h2>
        {nodes.map(n => <div className="node-row" key={n.node_id}>
          <strong>{n.node_name}</strong>
          <span>{n.node_code} · {n.sync_status}</span>
          <button onClick={() => simulateSync(n)}>Simulate Sync</button>
        </div>)}
      </section>

      <section className="cloud-panel">
        <h2>Sync Batches</h2>
        <pre>{JSON.stringify(batches, null, 2)}</pre>
      </section>
    </div>
  );
}
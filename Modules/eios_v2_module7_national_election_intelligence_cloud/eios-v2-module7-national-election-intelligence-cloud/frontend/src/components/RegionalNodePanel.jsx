import React from 'react';

export default function RegionalNodePanel({ nodes=[] }) {
  return (
    <div className="cloud-panel">
      <h2>Regional Nodes</h2>
      {nodes.map(n => (
        <div className="node-row" key={n.node_id}>
          <strong>{n.node_name}</strong>
          <span>{n.node_type} · {n.sync_status} · {n.status}</span>
        </div>
      ))}
    </div>
  );
}
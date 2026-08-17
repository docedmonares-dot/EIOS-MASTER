import React from 'react';

export default function WarRoomAlertPanel({ alerts=[], onAcknowledge, onResolve }) {
  return (
    <div className="war-panel">
      <h2>War Room Alerts</h2>
      {alerts.map(a => (
        <div key={a.alert_id} className={`alert-card ${String(a.severity).toLowerCase()}`}>
          <strong>{a.severity}: {a.title}</strong>
          <p>{a.message}</p>
          {a.recommendation && <small>Recommendation: {a.recommendation}</small>}
          <div>
            <button onClick={() => onAcknowledge?.(a.alert_id)}>Acknowledge</button>
            <button onClick={() => onResolve?.(a.alert_id)}>Resolve</button>
          </div>
        </div>
      ))}
    </div>
  );
}
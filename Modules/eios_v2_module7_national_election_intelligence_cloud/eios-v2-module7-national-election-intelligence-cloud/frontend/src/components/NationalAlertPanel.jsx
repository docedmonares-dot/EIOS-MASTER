import React from 'react';

export default function NationalAlertPanel({ alerts=[] }) {
  return (
    <div className="cloud-panel">
      <h2>National Alerts</h2>
      {alerts.map(a => (
        <div key={a.national_alert_id} className={`national-alert ${String(a.severity).toLowerCase()}`}>
          <strong>{a.severity}: {a.title}</strong>
          <p>{a.message}</p>
          {a.recommended_action && <small>{a.recommended_action}</small>}
        </div>
      ))}
    </div>
  );
}
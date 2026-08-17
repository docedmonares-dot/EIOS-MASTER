import React from 'react';

export default function WarRoomKpiCard({ title, value, subtitle, status='neutral' }) {
  return (
    <div className={`war-kpi-card ${status}`}>
      <small>{title}</small>
      <strong>{value ?? '—'}</strong>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}
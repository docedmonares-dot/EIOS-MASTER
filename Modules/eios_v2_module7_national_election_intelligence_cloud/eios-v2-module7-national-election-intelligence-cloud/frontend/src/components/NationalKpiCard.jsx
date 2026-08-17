import React from 'react';

export default function NationalKpiCard({ title, value, subtitle }) {
  return (
    <div className="national-kpi-card">
      <small>{title}</small>
      <strong>{value ?? '—'}</strong>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}
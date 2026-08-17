import React, { useEffect, useState } from 'react';
import { GisPredictiveAPI } from '../services/gisPredictiveApi';
import '../module5Gis.css';

export default function HotspotDashboard() {
  const [issues, setIssues] = useState([]);
  const [qc, setQc] = useState([]);

  async function load() {
    setIssues(await GisPredictiveAPI.issueHotspots());
    setQc(await GisPredictiveAPI.qcHotspots());
  }
  useEffect(()=>{ load(); },[]);

  return (
    <div className="gis-page">
      <h1>Issue and QC Hotspots</h1>
      <button onClick={() => GisPredictiveAPI.computeIssueHotspots({}).then(load)}>Compute Issue Hotspots</button>
      <button onClick={() => GisPredictiveAPI.computeQcHotspots({}).then(load)}>Compute QC Hotspots</button>

      <section className="gis-panel">
        <h2>Issue Hotspots</h2>
        <table><thead><tr><th>Issue</th><th>Score</th><th>Frequency</th><th>Severity</th></tr></thead>
        <tbody>{issues.map(x => <tr key={x.hotspot_id}><td>{x.issue_name}</td><td>{x.hotspot_score}</td><td>{x.issue_frequency}</td><td>{x.severity}</td></tr>)}</tbody></table>
      </section>

      <section className="gis-panel">
        <h2>QC Hotspots</h2>
        <table><thead><tr><th>Flag</th><th>Count</th><th>Risk</th><th>Severity</th></tr></thead>
        <tbody>{qc.map(x => <tr key={x.qc_hotspot_id}><td>{x.qc_flag_type}</td><td>{x.qc_flag_count}</td><td>{x.qc_risk_score}</td><td>{x.severity}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
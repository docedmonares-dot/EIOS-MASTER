import React, { useEffect, useState } from 'react';
import { NationalCloudAPI } from '../services/nationalCloudApi';
import NationalKpiCard from '../components/NationalKpiCard';
import RegionalNodePanel from '../components/RegionalNodePanel';
import NationalAlertPanel from '../components/NationalAlertPanel';
import '../nationalCloud.css';

export default function NationalCommandDashboard() {
  const [kpis, setKpis] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [candidateMetrics, setCandidateMetrics] = useState({});

  async function load() {
    setKpis(await NationalCloudAPI.kpis());
    setNodes(await NationalCloudAPI.nodes());
    setAlerts(await NationalCloudAPI.alerts());
    setCandidateMetrics(await NationalCloudAPI.candidateMetrics());
  }

  useEffect(() => { load(); }, []);

  const s = kpis?.summary || {};

  return (
    <div className="national-cloud-page">
      <header className="national-header">
        <h1>EIOS National Election Intelligence Cloud</h1>
        <p>National command view for multi-region election intelligence operations.</p>
      </header>

      <div className="national-kpi-grid">
        <NationalKpiCard title="Total Interviews" value={s.total_interviews || 0} />
        <NationalKpiCard title="Valid Interviews" value={s.valid_interviews || 0} />
        <NationalKpiCard title="Flagged Interviews" value={s.flagged_interviews || 0} />
        <NationalKpiCard title="Active Enumerators" value={s.active_enumerators || 0} />
        <NationalKpiCard title="Swing Areas" value={s.swing_area_count || 0} />
        <NationalKpiCard title="Critical Alerts" value={s.critical_alert_count || 0} />
      </div>

      <div className="cloud-grid">
        <RegionalNodePanel nodes={nodes} />
        <NationalAlertPanel alerts={alerts} />
      </div>

      <section className="cloud-panel">
        <h2>National Candidate Metrics</h2>
        <pre>{JSON.stringify(candidateMetrics, null, 2)}</pre>
      </section>
    </div>
  );
}
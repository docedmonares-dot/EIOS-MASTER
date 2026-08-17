import React, { useEffect, useState } from 'react';
import { WarRoomAPI } from '../services/warRoomApi';
import WarRoomKpiCard from '../components/WarRoomKpiCard';
import CandidateScorecard from '../components/CandidateScorecard';
import WarRoomAlertPanel from '../components/WarRoomAlertPanel';
import CommandMapPlaceholder from '../components/CommandMapPlaceholder';
import RecommendationPanel from '../components/RecommendationPanel';
import '../warRoom.css';

export default function ExecutiveWarRoom() {
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [layers, setLayers] = useState([]);

  async function load() {
    setKpis(await WarRoomAPI.kpis());
    setAlerts(await WarRoomAPI.alerts());
    setRecommendations(await WarRoomAPI.recommendations());
    setLayers(await WarRoomAPI.mapLayers());
  }

  useEffect(() => { load(); }, []);

  async function acknowledge(id) {
    await WarRoomAPI.updateAlertStatus(id, 'Acknowledged');
    await load();
  }

  async function resolve(id) {
    await WarRoomAPI.updateAlertStatus(id, 'Resolved');
    await load();
  }

  async function generateBrief() {
    const result = await WarRoomAPI.executiveBrief({
      kpis,
      alerts,
      recommendations,
      maps: layers,
      analytics: {}
    });
    alert('Executive brief generated.');
    console.log(result.report);
  }

  const syncRows = kpis?.sync || [];
  const qcRows = kpis?.qc || [];
  const field = kpis?.field || {};

  const synced = syncRows.find(x => x.sync_status === 'Synced')?.total || 0;
  const unsynced = syncRows.find(x => x.sync_status !== 'Synced')?.total || 0;
  const flagged = qcRows.find(x => x.qc_status === 'For Supervisor Review')?.total || 0;

  return (
    <div className="war-room-page">
      <header className="war-header">
        <div>
          <h1>EIOS Executive War Room</h1>
          <p>Live field intelligence, campaign analytics, QC alerts, and executive recommendations.</p>
        </div>
        <button onClick={generateBrief}>Generate Executive Brief</button>
      </header>

      <div className="war-kpi-grid">
        <WarRoomKpiCard title="Active Deployments" value={field.active_deployments || 0} />
        <WarRoomKpiCard title="Total Deployments" value={field.total_deployments || 0} />
        <WarRoomKpiCard title="Synced Records" value={synced} status="good" />
        <WarRoomKpiCard title="Unsynced / Other" value={unsynced} status="warning" />
        <WarRoomKpiCard title="QC For Review" value={flagged} status="danger" />
        <WarRoomKpiCard title="Open Alerts" value={alerts.length} status={alerts.length ? 'danger' : 'good'} />
      </div>

      <div className="war-main-grid">
        <section>
          <h2>Candidate Scorecards</h2>
          <CandidateScorecard candidate="Candidate A" metrics={{ awareness: 68, satisfaction: 56, trust: 59, preference: 45, tenacity: 64, pes: 58.4 }} />
          <CandidateScorecard candidate="Candidate B" metrics={{ awareness: 72, satisfaction: 48, trust: 50, preference: 39, tenacity: 52, pes: 52.2 }} />
        </section>

        <CommandMapPlaceholder layers={layers} />
      </div>

      <div className="war-main-grid">
        <WarRoomAlertPanel alerts={alerts} onAcknowledge={acknowledge} onResolve={resolve} />
        <RecommendationPanel recommendations={recommendations} />
      </div>
    </div>
  );
}
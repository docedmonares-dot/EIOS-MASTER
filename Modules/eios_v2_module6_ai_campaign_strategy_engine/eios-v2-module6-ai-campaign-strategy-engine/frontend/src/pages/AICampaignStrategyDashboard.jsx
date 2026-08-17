import React, { useEffect, useState } from 'react';
import { StrategyAPI } from '../services/strategyApi';
import StrategyRecommendationCard from '../components/StrategyRecommendationCard';
import '../module6Strategy.css';

export default function AICampaignStrategyDashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [sessions, setSessions] = useState([]);

  async function load() {
    setRecommendations(await StrategyAPI.recommendations());
    setSessions(await StrategyAPI.sessions());
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    await StrategyAPI.generateRecommendations({
      coreMetrics: {
        'Candidate A': { awareness: 55, trust: 45, preference: 32, tenacity: 42 },
        'Candidate B': { awareness: 72, trust: 61, preference: 41, tenacity: 60 }
      },
      gisMetrics: [
        { area_name: 'Barangay 1', area_classification: 'Swing Area' },
        { area_name: 'Barangay 2', area_classification: 'Weak Area' }
      ],
      qcSummary: { flagged_rate: 12 }
    });
    await load();
  }

  async function status(id, value) {
    await StrategyAPI.updateRecommendationStatus(id, value);
    await load();
  }

  return (
    <div className="strategy-page">
      <header>
        <h1>AI Campaign Strategy Engine</h1>
        <p>Convert validated EIOS intelligence into field strategy and campaign action.</p>
        <button onClick={generate}>Generate Strategy Recommendations</button>
      </header>

      <section className="strategy-panel">
        <h2>Strategy Sessions</h2>
        <ul>{sessions.map(s => <li key={s.strategy_session_id}>{s.session_name} — {s.status}</li>)}</ul>
      </section>

      <section className="strategy-grid">
        {recommendations.map(r => (
          <StrategyRecommendationCard
            key={r.strategy_recommendation_id}
            rec={r}
            onAccept={id => status(id, 'Accepted')}
            onReject={id => status(id, 'Rejected')}
          />
        ))}
      </section>
    </div>
  );
}
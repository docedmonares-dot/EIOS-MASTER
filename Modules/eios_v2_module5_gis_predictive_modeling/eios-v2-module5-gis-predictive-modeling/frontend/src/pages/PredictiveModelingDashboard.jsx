import React, { useState } from 'react';
import { GisPredictiveAPI } from '../services/gisPredictiveApi';
import '../module5Gis.css';

export default function PredictiveModelingDashboard() {
  const [metrics, setMetrics] = useState({
    awareness_pct: 60,
    satisfaction_pct: 55,
    trust_pct: 58,
    preference_pct: 45,
    tenacity_pct: 50
  });
  const [result, setResult] = useState(null);

  async function compute() {
    const res = await GisPredictiveAPI.predictiveScore({
      candidate_name: 'Candidate A',
      metrics
    });
    setResult(res);
  }

  return (
    <div className="gis-page">
      <h1>Predictive Modeling Engine</h1>
      <div className="gis-panel">
        {Object.keys(metrics).map(k => (
          <label key={k}>{k}
            <input type="number" value={metrics[k]} onChange={e => setMetrics({...metrics, [k]: Number(e.target.value)})}/>
          </label>
        ))}
        <button onClick={compute}>Compute Predictive Score</button>
      </div>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
import React from 'react';

export default function CandidateScorecard({ candidate, metrics={} }) {
  return (
    <div className="candidate-scorecard">
      <h3>{candidate}</h3>
      <div className="score-grid">
        <span>Awareness <b>{metrics.awareness ?? '—'}%</b></span>
        <span>Satisfaction <b>{metrics.satisfaction ?? '—'}%</b></span>
        <span>Trust <b>{metrics.trust ?? '—'}%</b></span>
        <span>Preference <b>{metrics.preference ?? '—'}%</b></span>
        <span>Tenacity <b>{metrics.tenacity ?? '—'}%</b></span>
        <span>PES <b>{metrics.pes ?? '—'}</b></span>
      </div>
    </div>
  );
}
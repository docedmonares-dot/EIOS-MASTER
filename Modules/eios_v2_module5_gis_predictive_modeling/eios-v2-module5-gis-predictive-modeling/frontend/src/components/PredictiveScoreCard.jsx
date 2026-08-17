import React from 'react';

export default function PredictiveScoreCard({ score }) {
  return (
    <div className={`predictive-card ${String(score?.risk_level || '').toLowerCase()}`}>
      <h3>{score?.candidate_name || 'Candidate'}</h3>
      <p>{score?.boundary_name || 'Area'}</p>
      <strong>{score?.predicted_vote_share ?? '—'}%</strong>
      <small>Confidence: {score?.confidence_score ?? '—'} · Swing: {score?.swing_probability ?? '—'}%</small>
      <span>{score?.risk_level}</span>
    </div>
  );
}
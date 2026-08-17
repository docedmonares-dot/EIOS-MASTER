import React from 'react';

export default function StrategyRecommendationCard({ rec, onAccept, onReject }) {
  return (
    <div className={`strategy-card ${String(rec.priority || '').toLowerCase()}`}>
      <small>{rec.recommendation_type} · {rec.priority}</small>
      <h3>{rec.title}</h3>
      <p>{rec.recommendation_text}</p>
      {rec.rationale && <em>{rec.rationale}</em>}
      <div>
        <button onClick={() => onAccept?.(rec.strategy_recommendation_id)}>Accept</button>
        <button onClick={() => onReject?.(rec.strategy_recommendation_id)}>Reject</button>
      </div>
    </div>
  );
}
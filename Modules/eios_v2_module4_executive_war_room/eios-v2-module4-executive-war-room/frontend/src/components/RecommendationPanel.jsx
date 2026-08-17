import React from 'react';

export default function RecommendationPanel({ recommendations=[] }) {
  return (
    <div className="war-panel">
      <h2>Strategic Recommendations</h2>
      {recommendations.map(r => (
        <div key={r.recommendation_id || r.title} className={`recommendation-card ${String(r.priority).toLowerCase()}`}>
          <strong>{r.priority}: {r.title}</strong>
          <p>{r.recommendation_text}</p>
          {r.rationale && <small>Rationale: {r.rationale}</small>}
        </div>
      ))}
    </div>
  );
}
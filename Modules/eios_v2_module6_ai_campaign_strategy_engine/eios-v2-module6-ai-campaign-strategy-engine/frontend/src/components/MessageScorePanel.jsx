import React from 'react';

export default function MessageScorePanel({ result }) {
  if (!result) return null;
  const s = result.score || result;
  return (
    <div className="score-panel">
      <h3>Message Test Score</h3>
      <div className="score-grid">
        <span>Clarity <b>{s.clarity_score}</b></span>
        <span>Emotion <b>{s.emotional_score}</b></span>
        <span>Credibility <b>{s.credibility_score}</b></span>
        <span>Persuasion <b>{s.persuasion_score}</b></span>
        <span>Risk <b>{s.risk_score}</b></span>
      </div>
      {s.notes && <p>{s.notes.interpretation}</p>}
    </div>
  );
}
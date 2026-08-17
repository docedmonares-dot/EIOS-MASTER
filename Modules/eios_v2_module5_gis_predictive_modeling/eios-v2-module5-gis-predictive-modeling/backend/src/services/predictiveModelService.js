export function ruleBasedPredictiveScore(metrics = {}, weights = {}) {
  const w = {
    awareness: weights.awareness ?? 0.15,
    satisfaction: weights.satisfaction ?? 0.15,
    trust: weights.trust ?? 0.20,
    preference: weights.preference ?? 0.30,
    tenacity: weights.tenacity ?? 0.20
  };

  const score =
    Number(metrics.awareness_pct || 0) * w.awareness +
    Number(metrics.satisfaction_pct || 0) * w.satisfaction +
    Number(metrics.trust_pct || 0) * w.trust +
    Number(metrics.preference_pct || 0) * w.preference +
    Number(metrics.tenacity_pct || 0) * w.tenacity;

  const swingProbability = Math.max(0, Math.min(100, 100 - Math.abs(Number(metrics.preference_pct || 0) - 50) * 2));
  const confidence = Math.min(100, (Number(metrics.tenacity_pct || 0) + Number(metrics.trust_pct || 0)) / 2);

  let risk = 'Low';
  if (score < 35) risk = 'Critical';
  else if (score < 45) risk = 'High';
  else if (score < 55) risk = 'Medium';

  return {
    predicted_vote_share: Number(score.toFixed(2)),
    confidence_score: Number(confidence.toFixed(2)),
    swing_probability: Number(swingProbability.toFixed(2)),
    risk_level: risk,
    explanation: {
      formula: 'weighted awareness, satisfaction, trust, preference, tenacity',
      weights: w,
      inputs: metrics
    }
  };
}

export async function savePredictiveScore(req, { model_id, client_id, project_id, survey_wave_id, boundary_id, candidate_name, prediction }) {
  const result = await req.db.query(
    `INSERT INTO predictive_scores
     (model_id, client_id, project_id, survey_wave_id, boundary_id, candidate_name,
      predicted_vote_share, confidence_score, swing_probability, risk_level, explanation_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
     RETURNING *`,
    [
      model_id || null, client_id || null, project_id || null, survey_wave_id || null,
      boundary_id || null, candidate_name,
      prediction.predicted_vote_share, prediction.confidence_score,
      prediction.swing_probability, prediction.risk_level,
      JSON.stringify(prediction.explanation || {})
    ]
  );
  return result.rows[0];
}
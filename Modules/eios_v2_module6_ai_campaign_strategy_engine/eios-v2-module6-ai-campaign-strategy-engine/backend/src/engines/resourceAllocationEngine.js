export function allocateResources({ areas = [], totalBudget = 100, totalFieldTeams = 10 }) {
  const scored = areas.map(a => {
    const swing = Number(a.swing_probability || 0);
    const risk = a.risk_level === 'Critical' ? 100 : a.risk_level === 'High' ? 75 : a.risk_level === 'Medium' ? 50 : 25;
    const estimated = Number(a.estimated_votes || 0);
    const score = (swing * 0.45) + (risk * 0.25) + (Math.min(100, estimated / 100) * 0.30);
    return { ...a, allocation_score: score };
  });

  const totalScore = scored.reduce((s, a) => s + a.allocation_score, 0) || 1;

  return scored.map(a => ({
    target_area: a.area_name || a.boundary_name,
    target_segment: a.target_segment || 'General Voters',
    target_candidate: a.target_candidate,
    resource_type: 'Field Teams and Campaign Support',
    recommended_quantity: Math.max(1, Math.round(totalFieldTeams * (a.allocation_score / totalScore))),
    budget_share: Number((totalBudget * (a.allocation_score / totalScore)).toFixed(2)),
    priority: a.allocation_score >= 75 ? 'High' : a.allocation_score >= 50 ? 'Medium' : 'Low',
    rationale: `Allocation score ${a.allocation_score.toFixed(2)} based on swing probability, risk, and estimated votes.`
  }));
}
export function generateRecommendations({ coreMetrics={}, issueOwnership={}, fieldSummary={}, qcSummary={} }) {
  const recommendations = [];

  if (qcSummary.flaggedRate && qcSummary.flaggedRate > 10) {
    recommendations.push({
      recommendation_type: 'Quality Control',
      priority: 'High',
      title: 'Intensify QC Backcheck',
      recommendation_text: 'Flagged interviews exceed safe threshold. Assign supervisors to validate high-risk enumerators and areas.',
      rationale: `Flagged rate is ${qcSummary.flaggedRate}%.`,
      expected_impact: 'Improve data credibility and reduce field fraud risk.'
    });
  }

  for (const [candidate, m] of Object.entries(coreMetrics || {})) {
    if (m.awareness < 60 && m.preference > 20) {
      recommendations.push({
        recommendation_type: 'Campaign Communication',
        priority: 'High',
        title: `Increase Name Recall for ${candidate}`,
        recommendation_text: `${candidate} has preference potential but still needs broader awareness-building.`,
        rationale: `Awareness is ${m.awareness}, preference is ${m.preference}.`,
        target_candidate: candidate,
        expected_impact: 'Raise conversion ceiling and improve vote share.'
      });
    }

    if (m.tenacity < 50 && m.preference > 25) {
      recommendations.push({
        recommendation_type: 'Voter Lock-In',
        priority: 'Urgent',
        title: `Lock in Soft Supporters for ${candidate}`,
        recommendation_text: 'Deploy targeted house-to-house and relational persuasion for soft supporters.',
        rationale: `Preference exists but tenacity is weak.`,
        target_candidate: candidate,
        expected_impact: 'Reduce vote leakage before election day.'
      });
    }
  }

  return recommendations;
}
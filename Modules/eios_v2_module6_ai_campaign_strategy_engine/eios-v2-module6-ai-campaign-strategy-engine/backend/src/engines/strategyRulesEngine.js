export function generateStrategyRecommendations({ coreMetrics = {}, gisMetrics = [], issueOwnership = {}, qcSummary = {} }) {
  const recommendations = [];

  for (const [candidate, m] of Object.entries(coreMetrics || {})) {
    const awareness = Number(m.awareness || 0);
    const trust = Number(m.trust || 0);
    const preference = Number(m.preference || 0);
    const tenacity = Number(m.tenacity || 0);

    if (awareness < 60 && preference >= 20) {
      recommendations.push({
        recommendation_type: 'Awareness Expansion',
        priority: 'High',
        title: `Expand Name Recall for ${candidate}`,
        recommendation_text: `Increase visibility and name recall for ${candidate} through house-to-house, barangay-level visuals, sectoral endorsement, and social media repetition.`,
        rationale: `Awareness is ${awareness}% while preference is already ${preference}%, indicating headroom for conversion.`,
        target_candidate: candidate,
        recommended_action: 'Launch awareness blitz',
        expected_impact: 'Increase conversion ceiling'
      });
    }

    if (trust < 50 && awareness >= 60) {
      recommendations.push({
        recommendation_type: 'Trust Repair',
        priority: 'Urgent',
        title: `Build Trust Narrative for ${candidate}`,
        recommendation_text: `Shift messaging to credibility, service record, proof of performance, testimonials, and third-party validators.`,
        rationale: `Candidate is known but trust is below 50%.`,
        target_candidate: candidate,
        recommended_action: 'Deploy trust validators',
        expected_impact: 'Improve persuasion and reduce resistance'
      });
    }

    if (preference >= 30 && tenacity < 50) {
      recommendations.push({
        recommendation_type: 'Voter Lock-In',
        priority: 'High',
        title: `Lock-in Soft Supporters for ${candidate}`,
        recommendation_text: `Prioritize relational contact, household-level reinforcement, and direct candidate touchpoints for soft supporters.`,
        rationale: `Preference exists, but tenacity is weak.`,
        target_candidate: candidate,
        recommended_action: 'Soft supporter lock-in program',
        expected_impact: 'Reduce vote leakage'
      });
    }
  }

  for (const area of gisMetrics || []) {
    if (area.area_classification === 'Swing Area') {
      recommendations.push({
        recommendation_type: 'Geographic Targeting',
        priority: 'Urgent',
        title: `Prioritize Swing Area: ${area.boundary_name || area.area_name}`,
        recommendation_text: `Deploy additional field operations, persuasion messaging, and issue-focused activities in this swing area.`,
        rationale: `Area classified as Swing Area with high movement potential.`,
        target_area: area.boundary_name || area.area_name,
        recommended_action: 'Increase field saturation',
        expected_impact: 'Win movable voters'
      });
    }

    if (area.area_classification === 'Weak Area') {
      recommendations.push({
        recommendation_type: 'Damage Control',
        priority: 'Medium',
        title: `Contain Weak Area: ${area.boundary_name || area.area_name}`,
        recommendation_text: `Do not over-invest unless strategic. Use low-cost visibility and targeted issue response.`,
        rationale: `Area is classified as Weak Area.`,
        target_area: area.boundary_name || area.area_name,
        recommended_action: 'Selective containment',
        expected_impact: 'Limit vote loss'
      });
    }
  }

  if (Number(qcSummary.flagged_rate || 0) > 10) {
    recommendations.push({
      recommendation_type: 'Data Integrity',
      priority: 'High',
      title: 'Strengthen Field QC',
      recommendation_text: 'Increase supervisor backchecks and review enumerator risk patterns before using data for strategic decisions.',
      rationale: `QC flagged rate is ${qcSummary.flagged_rate}%.`,
      recommended_action: 'Backcheck and field audit',
      expected_impact: 'Protect data credibility'
    });
  }

  return recommendations;
}
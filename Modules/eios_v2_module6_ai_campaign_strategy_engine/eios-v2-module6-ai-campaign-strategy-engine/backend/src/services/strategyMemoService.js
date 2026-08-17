export function buildCampaignMemo({ session, recommendations = [], risks = [], messageTests = [], resourcePlan = [] }) {
  const urgent = recommendations.filter(r => r.priority === 'Urgent' || r.priority === 'High');

  return {
    title: 'EIOS AI Campaign Strategy Memo',
    generated_at: new Date().toISOString(),
    session,
    executive_summary: {
      main_message: 'This memo converts EIOS validated intelligence into campaign action priorities.',
      urgent_actions: urgent.slice(0, 5).map(r => r.title),
      risk_count: risks.length,
      resource_plan_count: resourcePlan.length
    },
    strategic_recommendations: recommendations,
    campaign_risks: risks,
    message_tests: messageTests,
    resource_allocation: resourcePlan,
    field_directives: urgent.map(r => ({
      action: r.recommended_action,
      target_area: r.target_area,
      target_candidate: r.target_candidate,
      expected_impact: r.expected_impact
    }))
  };
}

export function memoToText(memo) {
  return [
    memo.title,
    `Generated: ${memo.generated_at}`,
    '',
    'Executive Summary:',
    memo.executive_summary.main_message,
    '',
    'Urgent Actions:',
    ...(memo.executive_summary.urgent_actions || []).map((x, i) => `${i+1}. ${x}`),
    '',
    'Field Directives:',
    ...(memo.field_directives || []).map((x, i) => `${i+1}. ${x.action || 'Action'} — ${x.target_area || 'General Area'} — ${x.expected_impact || ''}`)
  ].join('\n');
}
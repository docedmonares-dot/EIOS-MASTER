export function buildExecutiveBrief({ kpis, alerts, recommendations, maps, analytics }) {
  return {
    title: 'EIOS Executive War Room Brief',
    generated_at: new Date().toISOString(),
    executive_summary: {
      situation: 'Current field and political intelligence snapshot generated from EIOS validated data.',
      key_findings: [
        'Review KPI cards for field progress and QC status.',
        'Review candidate scorecards for awareness, trust, preference, and tenacity.',
        'Review alerts and recommendations for immediate action.'
      ]
    },
    kpis,
    alerts,
    recommendations,
    maps,
    analytics,
    action_agenda: recommendations?.slice(0, 5) || []
  };
}
export async function getNationalCommandSummary(req, filters = {}) {
  const params = [];
  let where = 'WHERE 1=1';
  if (filters.tenant_id) { params.push(filters.tenant_id); where += ` AND k.tenant_id=$${params.length}`; }
  if (filters.national_project_id) { params.push(filters.national_project_id); where += ` AND k.national_project_id=$${params.length}`; }

  const result = await req.db.query(
    `SELECT
       SUM(total_interviews) total_interviews,
       SUM(valid_interviews) valid_interviews,
       SUM(flagged_interviews) flagged_interviews,
       SUM(synced_interviews) synced_interviews,
       SUM(active_enumerators) active_enumerators,
       AVG(awareness_avg) awareness_avg,
       AVG(satisfaction_avg) satisfaction_avg,
       AVG(trust_avg) trust_avg,
       AVG(tenacity_avg) tenacity_avg,
       SUM(swing_area_count) swing_area_count,
       SUM(critical_alert_count) critical_alert_count
     FROM national_command_kpis k ${where}`,
    params
  );

  const alerts = await req.db.query(
    `SELECT severity, COUNT(*) total FROM national_alerts
     WHERE status='Open'
     GROUP BY severity`
  ).catch(() => ({ rows: [] }));

  return { summary: result.rows[0], alerts: alerts.rows, generated_at: new Date().toISOString() };
}

export async function buildNationalCandidateMetrics(req) {
  const result = await req.db.query(`SELECT * FROM vw_national_candidate_metrics ORDER BY candidate_name, metric_name`);
  const grouped = {};
  for (const row of result.rows) {
    grouped[row.candidate_name] = grouped[row.candidate_name] || {};
    grouped[row.candidate_name][row.metric_name] = Number(row.avg_metric || 0);
  }
  return grouped;
}
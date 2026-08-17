export function severityFromScore(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export async function computeIssueHotspots(req, { project_id=null, survey_wave_id=null } = {}) {
  const result = await req.db.query(
    `SELECT boundary_id, issue_name, COUNT(*) issue_frequency
     FROM (
       SELECT r.boundary_id, COALESCE(r.metadata_json->>'most_important_issue','Unknown') issue_name
       FROM respondent_gis_points r
       WHERE ($1::uuid IS NULL OR r.project_id=$1)
         AND ($2::uuid IS NULL OR r.survey_wave_id=$2)
     ) x
     GROUP BY boundary_id, issue_name`,
    [project_id, survey_wave_id]
  );

  const saved = [];
  for (const row of result.rows) {
    const score = Math.min(100, Number(row.issue_frequency || 0) * 5);
    const severity = severityFromScore(score);
    const insert = await req.db.query(
      `INSERT INTO issue_hotspots
       (project_id, survey_wave_id, boundary_id, issue_name, hotspot_score, issue_frequency, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [project_id, survey_wave_id, row.boundary_id, row.issue_name, score, row.issue_frequency, severity]
    );
    saved.push(insert.rows[0]);
  }
  return saved;
}

export async function computeQcHotspots(req, { deployment_id=null } = {}) {
  const result = await req.db.query(
    `SELECT g.boundary_id, g.personnel_id enumerator_id, unnest(ARRAY(SELECT jsonb_array_elements_text(g.gps_validation_flags))) flag_type, COUNT(*) flag_count
     FROM gps_validation_logs g
     WHERE ($1::uuid IS NULL OR g.deployment_id=$1)
     GROUP BY g.boundary_id, g.personnel_id, flag_type`,
    [deployment_id]
  ).catch(() => ({ rows: [] }));

  const saved = [];
  for (const row of result.rows) {
    const score = Math.min(100, Number(row.flag_count || 0) * 10);
    const severity = severityFromScore(score);
    const insert = await req.db.query(
      `INSERT INTO qc_hotspots
       (deployment_id, boundary_id, enumerator_id, qc_flag_type, qc_flag_count, qc_risk_score, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [deployment_id, row.boundary_id, row.enumerator_id, row.flag_type, row.flag_count, score, severity]
    );
    saved.push(insert.rows[0]);
  }
  return saved;
}
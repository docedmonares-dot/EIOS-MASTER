export async function getExecutiveKpis(req, { client_id=null, project_id=null, wave_id=null } = {}) {
  const field = await req.db.query(`
    SELECT
      COUNT(*) FILTER (WHERE deployment_status='Active') active_deployments,
      COUNT(*) total_deployments
    FROM deployments
  `).catch(() => ({ rows: [{ active_deployments: 0, total_deployments: 0 }] }));

  const sync = await req.db.query(`
    SELECT sync_status, COUNT(*) total
    FROM offline_response_queue
    GROUP BY sync_status
  `).catch(() => ({ rows: [] }));

  const qc = await req.db.query(`
    SELECT qc_status, COUNT(*) total
    FROM qc_precheck_results
    GROUP BY qc_status
  `).catch(() => ({ rows: [] }));

  const alerts = await req.db.query(`
    SELECT severity, COUNT(*) total
    FROM war_room_alerts
    WHERE alert_status='Open'
    GROUP BY severity
  `).catch(() => ({ rows: [] }));

  return {
    field: field.rows[0],
    sync: sync.rows,
    qc: qc.rows,
    alerts: alerts.rows,
    generated_at: new Date().toISOString()
  };
}

export async function createKpiSnapshot(req, payload) {
  const kpis = await getExecutiveKpis(req, payload);
  const result = await req.db.query(
    `INSERT INTO war_room_kpi_snapshots
     (session_id, client_id, project_id, survey_wave_id, snapshot_label,
      total_interviews, synced_interviews, unsynced_interviews, valid_interviews,
      flagged_interviews, rejected_interviews, overall_awareness, overall_satisfaction,
      overall_trust, overall_preference, overall_tenacity)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      payload.session_id, payload.client_id, payload.project_id, payload.survey_wave_id,
      payload.snapshot_label || 'War Room Snapshot',
      payload.total_interviews || 0,
      payload.synced_interviews || 0,
      payload.unsynced_interviews || 0,
      payload.valid_interviews || 0,
      payload.flagged_interviews || 0,
      payload.rejected_interviews || 0,
      payload.overall_awareness || null,
      payload.overall_satisfaction || null,
      payload.overall_trust || null,
      payload.overall_preference || null,
      payload.overall_tenacity || null
    ]
  );
  return { snapshot: result.rows[0], kpis };
}
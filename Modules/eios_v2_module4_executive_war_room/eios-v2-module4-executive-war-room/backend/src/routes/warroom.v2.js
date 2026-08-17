import express from 'express';
import { getExecutiveKpis, createKpiSnapshot } from '../services/warRoomKpiService.js';
import { generateRecommendations } from '../services/warRoomRecommendationService.js';
import { buildExecutiveBrief } from '../services/reportGeneratorService.js';

const router = express.Router();

router.get('/warroom/kpis', async (req, res) => {
  const result = await getExecutiveKpis(req, req.query);
  res.json(result);
});

router.post('/warroom/sessions', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO war_room_sessions
     (client_id, project_id, survey_wave_id, session_name, session_type, session_status, created_by)
     VALUES ($1,$2,$3,$4,$5,'Active',$6) RETURNING *`,
    [x.client_id || null, x.project_id || null, x.survey_wave_id || null,
     x.session_name, x.session_type || 'Executive', req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/warroom/sessions', async (req, res) => {
  const result = await req.db.query(`SELECT * FROM war_room_sessions ORDER BY created_at DESC`);
  res.json(result.rows);
});

router.post('/warroom/alerts', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO war_room_alerts
     (session_id, client_id, project_id, alert_type, severity, title, message,
      affected_area, affected_candidate, metric_name, metric_value, recommendation)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [x.session_id || null, x.client_id || null, x.project_id || null, x.alert_type,
     x.severity || 'Info', x.title, x.message, x.affected_area, x.affected_candidate,
     x.metric_name, x.metric_value || null, x.recommendation]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/warroom/alerts', async (req, res) => {
  const result = await req.db.query(
    `SELECT * FROM war_room_alerts WHERE alert_status <> 'Archived' ORDER BY created_at DESC LIMIT 100`
  );
  res.json(result.rows);
});

router.patch('/warroom/alerts/:id/status', async (req, res) => {
  const result = await req.db.query(
    `UPDATE war_room_alerts SET alert_status=$1,
      acknowledged_by=CASE WHEN $1='Acknowledged' THEN $2 ELSE acknowledged_by END,
      acknowledged_at=CASE WHEN $1='Acknowledged' THEN CURRENT_TIMESTAMP ELSE acknowledged_at END,
      resolved_by=CASE WHEN $1='Resolved' THEN $2 ELSE resolved_by END,
      resolved_at=CASE WHEN $1='Resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
     WHERE alert_id=$3 RETURNING *`,
    [req.body.status, req.user?.id || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.get('/warroom/recommendations', async (req, res) => {
  const result = await req.db.query(
    `SELECT * FROM war_room_recommendations ORDER BY created_at DESC LIMIT 100`
  );
  res.json(result.rows);
});

router.post('/warroom/recommendations/generate', async (req, res) => {
  const recs = generateRecommendations(req.body || {});
  const saved = [];

  for (const r of recs) {
    const result = await req.db.query(
      `INSERT INTO war_room_recommendations
       (session_id, client_id, project_id, recommendation_type, priority, title,
        recommendation_text, rationale, target_area, target_segment, target_candidate, expected_impact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.body.session_id || null, req.body.client_id || null, req.body.project_id || null,
        r.recommendation_type, r.priority, r.title, r.recommendation_text, r.rationale,
        r.target_area || null, r.target_segment || null, r.target_candidate || null,
        r.expected_impact || null
      ]
    );
    saved.push(result.rows[0]);
  }

  res.json(saved);
});

router.post('/warroom/snapshots', async (req, res) => {
  const result = await createKpiSnapshot(req, req.body);
  res.status(201).json(result);
});

router.get('/warroom/map-layers', async (req, res) => {
  const result = await req.db.query(
    `SELECT * FROM war_room_map_layers WHERE visible=true ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

router.post('/warroom/map-layers', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO war_room_map_layers
     (session_id, layer_name, layer_type, geojson_data, style_json, visible)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6) RETURNING *`,
    [x.session_id || null, x.layer_name, x.layer_type, JSON.stringify(x.geojson_data || {}),
     JSON.stringify(x.style_json || {}), x.visible ?? true]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/warroom/reports/executive-brief', async (req, res) => {
  const report = buildExecutiveBrief(req.body || {});
  const result = await req.db.query(
    `INSERT INTO war_room_reports
     (session_id, report_title, report_type, report_json, generated_by)
     VALUES ($1,$2,'Executive Brief',$3::jsonb,$4) RETURNING *`,
    [req.body.session_id || null, report.title, JSON.stringify(report), req.user?.id || null]
  );
  res.status(201).json({ report_record: result.rows[0], report });
});

export default router;
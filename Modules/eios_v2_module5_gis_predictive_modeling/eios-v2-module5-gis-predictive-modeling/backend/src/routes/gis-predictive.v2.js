import express from 'express';
import { getBoundaryGeoJson, getRespondentPoints, classifyArea } from '../services/gisService.js';
import { ruleBasedPredictiveScore, savePredictiveScore } from '../services/predictiveModelService.js';
import { computeIssueHotspots, computeQcHotspots } from '../services/hotspotService.js';

const router = express.Router();

router.get('/gis/boundaries', async (req, res) => {
  res.json(await getBoundaryGeoJson(req, req.query));
});

router.get('/gis/respondent-points', async (req, res) => {
  res.json(await getRespondentPoints(req, req.query));
});

router.get('/gis/area-summary', async (req, res) => {
  const result = await req.db.query('SELECT * FROM vw_gis_area_summary ORDER BY interview_count DESC LIMIT 500');
  res.json(result.rows);
});

router.post('/gis/layers', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO gis_map_layers(layer_name, layer_type, source_table, filter_json, style_json, visible, created_by)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) RETURNING *`,
    [x.layer_name, x.layer_type, x.source_table, JSON.stringify(x.filter_json || {}),
     JSON.stringify(x.style_json || {}), x.visible ?? true, req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/gis/layers', async (req, res) => {
  const result = await req.db.query('SELECT * FROM gis_map_layers ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/gis/classify-area', async (req, res) => {
  const classification = await classifyArea(req.body);
  res.json({ area_classification: classification });
});

router.post('/hotspots/issues/compute', async (req, res) => {
  res.json(await computeIssueHotspots(req, req.body));
});

router.get('/hotspots/issues', async (req, res) => {
  const result = await req.db.query('SELECT * FROM issue_hotspots ORDER BY created_at DESC LIMIT 500');
  res.json(result.rows);
});

router.post('/hotspots/qc/compute', async (req, res) => {
  res.json(await computeQcHotspots(req, req.body));
});

router.get('/hotspots/qc', async (req, res) => {
  const result = await req.db.query('SELECT * FROM qc_hotspots ORDER BY created_at DESC LIMIT 500');
  res.json(result.rows);
});

router.post('/predictive/models', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO predictive_models(model_code, model_name, model_type, model_version,
     features_json, weights_json, model_status, created_by)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8) RETURNING *`,
    [x.model_code, x.model_name, x.model_type || 'Rule-Based', x.model_version || '1.0',
     JSON.stringify(x.features_json || {}), JSON.stringify(x.weights_json || {}),
     x.model_status || 'Active', req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/predictive/models', async (req, res) => {
  const result = await req.db.query('SELECT * FROM predictive_models ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/predictive/score', async (req, res) => {
  const prediction = ruleBasedPredictiveScore(req.body.metrics || {}, req.body.weights || {});
  const saved = await savePredictiveScore(req, { ...req.body, prediction });
  res.json({ prediction, saved });
});

router.get('/predictive/scores', async (req, res) => {
  const result = await req.db.query('SELECT * FROM vw_gis_predictive_summary ORDER BY predicted_vote_share DESC LIMIT 500');
  res.json(result.rows);
});

export default router;
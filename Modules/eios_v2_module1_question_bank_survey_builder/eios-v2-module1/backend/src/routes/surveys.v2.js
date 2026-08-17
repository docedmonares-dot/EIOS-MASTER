import express from 'express';
import { validateSurveyPayload } from '../validators/questionValidator.js';
import { buildDeploymentPackage, freezeQuestionSnapshot } from '../services/publishingService.js';

const router = express.Router();

router.get('/surveys', async (req, res) => {
  const result = await req.db.query('SELECT * FROM surveys ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/surveys', async (req, res) => {
  const errors = validateSurveyPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const s = req.body;

  const result = await req.db.query(
    `INSERT INTO surveys
    (survey_code, survey_name, client_id, project_id, wave_id, election_type,
     geographic_scope, description, status, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Draft',$9,$9) RETURNING *`,
    [s.survey_code, s.survey_name, s.client_id, s.project_id, s.wave_id,
     s.election_type, s.geographic_scope, s.description, req.user?.id || null]
  );

  res.status(201).json(result.rows[0]);
});

router.put('/surveys/:id', async (req, res) => {
  const s = req.body;
  const result = await req.db.query(
    `UPDATE surveys SET survey_name=$1, client_id=$2, project_id=$3, wave_id=$4,
     election_type=$5, geographic_scope=$6, description=$7, status=$8,
     updated_by=$9, updated_at=CURRENT_TIMESTAMP WHERE survey_id=$10 RETURNING *`,
    [s.survey_name, s.client_id, s.project_id, s.wave_id, s.election_type,
     s.geographic_scope, s.description, s.status || 'Draft', req.user?.id || null, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Survey not found' });
  res.json(result.rows[0]);
});

router.post('/surveys/:id/sections', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO survey_sections(survey_id, section_code, section_title, section_description, page_number, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, x.section_code, x.section_title, x.section_description, x.page_number || 1, x.sort_order || 0]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/surveys/:id/questions', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO survey_questions(survey_id, section_id, question_id, page_number, sort_order,
     required_override, question_label_override, settings_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     ON CONFLICT (survey_id, question_id)
     DO UPDATE SET section_id=$2, page_number=$4, sort_order=$5, required_override=$6,
     question_label_override=$7, settings_json=$8::jsonb RETURNING *`,
    [req.params.id, x.section_id || null, x.question_id, x.page_number || 1, x.sort_order || 0,
     x.required_override ?? null, x.question_label_override || null, JSON.stringify(x.settings_json || {})]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/logic', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO survey_logic(survey_id, source_question_id, condition_json, action_json,
     affected_questions_json, logic_status, created_by)
     VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6,$7) RETURNING *`,
    [x.survey_id, x.source_question_id, JSON.stringify(x.condition_json || {}),
     JSON.stringify(x.action_json || {}), JSON.stringify(x.affected_questions_json || []),
     x.logic_status || 'Active', req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/logic', async (req, res) => {
  const result = await req.db.query('SELECT * FROM survey_logic WHERE survey_id=$1 ORDER BY created_at DESC', [req.query.survey_id]);
  res.json(result.rows);
});

router.post('/surveys/:id/publish', async (req, res) => {
  const surveyResult = await req.db.query('SELECT * FROM surveys WHERE survey_id=$1', [req.params.id]);
  if (!surveyResult.rowCount) return res.status(404).json({ error: 'Survey not found' });

  const survey = surveyResult.rows[0];
  const sections = (await req.db.query('SELECT * FROM survey_sections WHERE survey_id=$1 ORDER BY page_number, sort_order', [req.params.id])).rows;
  const questions = (await req.db.query(
    `SELECT sq.*, qb.question_code, qb.question_text, qb.question_type, qb.options_json, qb.required_flag, qb.question_module
     FROM survey_questions sq JOIN question_bank qb ON sq.question_id=qb.question_id
     WHERE sq.survey_id=$1 AND sq.is_active=true ORDER BY sq.page_number, sq.sort_order`, [req.params.id])).rows;
  const logic = (await req.db.query(`SELECT * FROM survey_logic WHERE survey_id=$1 AND logic_status='Active'`, [req.params.id])).rows;

  const versionNumber = Number(survey.current_version_number || 0) + 1;
  const questionSnapshot = freezeQuestionSnapshot(questions);
  const deploymentPackage = buildDeploymentPackage({ survey, sections, questions: questionSnapshot, logic, versionNumber });

  await req.db.query('UPDATE survey_versions SET is_active_version=false WHERE survey_id=$1', [req.params.id]);

  const version = (await req.db.query(
    `INSERT INTO survey_versions(survey_id, version_number, version_label, survey_snapshot, question_snapshot,
     logic_snapshot, published_by, publish_notes, is_active_version)
     VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,true) RETURNING *`,
    [req.params.id, versionNumber, `Survey Version ${versionNumber}`, JSON.stringify({ survey, sections }),
     JSON.stringify(questionSnapshot), JSON.stringify(logic), req.user?.id || null, req.body.publish_notes || ''])).rows[0];

  const deployment = (await req.db.query(
    `INSERT INTO survey_deployments(survey_id, survey_version_id, deployment_package, deployment_status, deployed_by)
     VALUES ($1,$2,$3::jsonb,'Ready',$4) RETURNING *`,
    [req.params.id, version.survey_version_id, JSON.stringify(deploymentPackage), req.user?.id || null])).rows[0];

  await req.db.query(`UPDATE surveys SET status='Published', current_version_number=$1 WHERE survey_id=$2`, [versionNumber, req.params.id]);

  res.json({ survey_version: version, deployment, deployment_package: deploymentPackage });
});

router.delete('/surveys/:id', async (req, res) => {
  await req.db.query(`UPDATE surveys SET status='Archived' WHERE survey_id=$1`, [req.params.id]);
  res.json({ ok: true, archived: true });
});

export default router;
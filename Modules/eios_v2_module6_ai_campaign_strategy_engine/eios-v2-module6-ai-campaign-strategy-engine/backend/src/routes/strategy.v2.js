import express from 'express';
import { generateStrategyRecommendations } from '../engines/strategyRulesEngine.js';
import { scoreMessage } from '../engines/messageTestingEngine.js';
import { allocateResources } from '../engines/resourceAllocationEngine.js';
import { buildCampaignMemo, memoToText } from '../services/strategyMemoService.js';

const router = express.Router();

router.post('/strategy/sessions', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO strategy_sessions
     (client_id, project_id, survey_wave_id, session_name, strategy_scope, status, created_by)
     VALUES ($1,$2,$3,$4,$5,'Active',$6) RETURNING *`,
    [x.client_id || null, x.project_id || null, x.survey_wave_id || null,
     x.session_name, x.strategy_scope || 'Campaign Strategy', req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/strategy/sessions', async (req, res) => {
  const result = await req.db.query('SELECT * FROM strategy_sessions ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/strategy/recommendations/generate', async (req, res) => {
  const recs = generateStrategyRecommendations(req.body || {});
  const saved = [];

  for (const r of recs) {
    const result = await req.db.query(
      `INSERT INTO strategy_recommendations
       (strategy_session_id, recommendation_type, priority, title, recommendation_text,
        rationale, evidence_json, target_area, target_segment, target_candidate,
        recommended_action, expected_impact)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.body.strategy_session_id || null, r.recommendation_type, r.priority,
        r.title, r.recommendation_text, r.rationale, JSON.stringify(req.body.evidence_json || {}),
        r.target_area || null, r.target_segment || null, r.target_candidate || null,
        r.recommended_action || null, r.expected_impact || null
      ]
    );
    saved.push(result.rows[0]);
  }

  res.json(saved);
});

router.get('/strategy/recommendations', async (req, res) => {
  const result = await req.db.query('SELECT * FROM strategy_recommendations ORDER BY created_at DESC LIMIT 200');
  res.json(result.rows);
});

router.patch('/strategy/recommendations/:id/status', async (req, res) => {
  const result = await req.db.query(
    `UPDATE strategy_recommendations SET implementation_status=$1, decided_by=$2, decided_at=CURRENT_TIMESTAMP
     WHERE strategy_recommendation_id=$3 RETURNING *`,
    [req.body.status, req.user?.id || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.post('/strategy/message-test', async (req, res) => {
  const score = scoreMessage(req.body);
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO message_tests
     (strategy_session_id, message_title, message_theme, message_text, target_candidate,
      target_issue, target_segment, test_score, clarity_score, emotional_score,
      credibility_score, persuasion_score, risk_score, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Tested') RETURNING *`,
    [
      x.strategy_session_id || null, x.message_title, x.message_theme, x.message_text,
      x.target_candidate || null, x.target_issue || null, x.target_segment || null,
      score.test_score, score.clarity_score, score.emotional_score, score.credibility_score,
      score.persuasion_score, score.risk_score
    ]
  );
  res.status(201).json({ record: result.rows[0], score });
});

router.get('/strategy/message-tests', async (req, res) => {
  const result = await req.db.query('SELECT * FROM message_tests ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/strategy/resource-allocation', async (req, res) => {
  const plan = allocateResources(req.body || {});
  const saved = [];

  for (const p of plan) {
    const result = await req.db.query(
      `INSERT INTO resource_allocation_plans
       (strategy_session_id, target_area, target_segment, target_candidate, resource_type,
        recommended_quantity, priority, rationale)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        req.body.strategy_session_id || null, p.target_area, p.target_segment,
        p.target_candidate || null, p.resource_type, p.recommended_quantity,
        p.priority, p.rationale
      ]
    );
    saved.push({ ...result.rows[0], budget_share: p.budget_share });
  }

  res.json(saved);
});

router.get('/strategy/resource-allocation', async (req, res) => {
  const result = await req.db.query('SELECT * FROM resource_allocation_plans ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/strategy/risks', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO campaign_risk_register
     (strategy_session_id, risk_type, risk_title, risk_description, affected_area,
      affected_candidate, risk_level, probability, impact, mitigation)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [x.strategy_session_id || null, x.risk_type, x.risk_title, x.risk_description,
     x.affected_area || null, x.affected_candidate || null, x.risk_level || 'Medium',
     x.probability || null, x.impact || null, x.mitigation || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/strategy/risks', async (req, res) => {
  const result = await req.db.query('SELECT * FROM campaign_risk_register ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/strategy/memo', async (req, res) => {
  const memo = buildCampaignMemo(req.body || {});
  const text = memoToText(memo);

  const result = await req.db.query(
    `INSERT INTO ai_campaign_memos
     (strategy_session_id, memo_title, memo_type, memo_json, memo_text, generated_by)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING *`,
    [req.body.strategy_session_id || null, memo.title, req.body.memo_type || 'Strategy Memo',
     JSON.stringify(memo), text, req.user?.id || null]
  );

  res.status(201).json({ memo_record: result.rows[0], memo, text });
});

router.get('/strategy/actions', async (req, res) => {
  const result = await req.db.query('SELECT * FROM strategy_action_tracker ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/strategy/actions', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO strategy_action_tracker
     (strategy_session_id, recommendation_id, action_title, action_owner, target_area, due_date, action_status, progress_notes)
     VALUES ($1,$2,$3,$4,$5,$6,'Pending',$7) RETURNING *`,
    [x.strategy_session_id || null, x.recommendation_id || null, x.action_title,
     x.action_owner || null, x.target_area || null, x.due_date || null, x.progress_notes || null]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
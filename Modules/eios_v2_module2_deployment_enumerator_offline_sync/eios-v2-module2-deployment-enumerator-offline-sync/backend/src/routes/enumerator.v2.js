import express from 'express';
import { fieldLog } from '../services/fieldLogService.js';

const router = express.Router();

router.get('/enumerator/assignments', async (req, res) => {
  const result = await req.db.query(
    `SELECT aa.* FROM area_assignments aa
     JOIN personnel p ON aa.personnel_id = p.personnel_id
     WHERE p.user_id=$1 AND aa.assignment_status IN ('Assigned','In Progress')`,
    [req.user?.id]
  );
  res.json(result.rows);
});

router.get('/enumerator/active-survey', async (req, res) => {
  const result = await req.db.query(
    `SELECT ds.* FROM deployment_surveys ds
     JOIN deployment_personnel dp ON ds.deployment_id = dp.deployment_id
     JOIN personnel p ON dp.personnel_id = p.personnel_id
     WHERE p.user_id=$1
     ORDER BY ds.assigned_at DESC LIMIT 1`,
    [req.user?.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'No active survey package assigned' });
  await fieldLog(req, { deployment_id: result.rows[0].deployment_id, action: 'survey loaded' });
  res.json(result.rows[0]);
});

router.get('/enumerator/quota', async (req, res) => {
  const result = await req.db.query(
    `SELECT aa.assignment_id, aa.deployment_id, aa.barangay, aa.precinct_cluster,
            aa.quota_target, aa.quota_completed, aa.quota_remaining, aa.assignment_status
     FROM area_assignments aa
     JOIN personnel p ON aa.personnel_id = p.personnel_id
     WHERE p.user_id=$1`,
    [req.user?.id]
  );
  res.json(result.rows);
});

router.post('/enumerator/draft', async (req, res) => {
  await fieldLog(req, { deployment_id: req.body.deployment_id, action: 'draft saved', status: 'Draft' });
  res.json({ ok: true, local_response_id: req.body.local_response_id });
});

router.post('/enumerator/final-submit', async (req, res) => {
  await fieldLog(req, { deployment_id: req.body.deployment_id, action: 'final submit', status: 'Final Locked Unsynced' });
  res.json({ ok: true, local_response_id: req.body.local_response_id, sync_status: 'Final Locked Unsynced' });
});

export default router;
import express from 'express';
import { validateGps } from '../services/gpsValidationService.js';
import { qcPrecheck } from '../services/qcPrecheckService.js';

const router = express.Router();

router.post('/gps/validate', async (req, res) => {
  const result = await validateGps(req, req.body);
  res.json(result);
});

router.get('/gps/coverage', async (req, res) => {
  const result = await req.db.query(
    `SELECT deployment_id, personnel_id, gps_validation_status, COUNT(*) total
     FROM gps_validation_logs
     GROUP BY deployment_id, personnel_id, gps_validation_status`
  );
  res.json(result.rows);
});

router.post('/qc/precheck', async (req, res) => {
  const result = await qcPrecheck(req, req.body);
  res.json(result);
});

router.get('/qc/flags', async (req, res) => {
  const result = await req.db.query('SELECT * FROM qc_precheck_results ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/qc/review', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO supervisor_reviews
     (deployment_id, local_response_id, server_response_id, supervisor_id, review_status, review_notes, reviewed_at)
     VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING *`,
    [x.deployment_id, x.local_response_id, x.server_response_id || null, x.supervisor_id, x.review_status, x.review_notes]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/dashboard/operations', async (req, res) => {
  const deployments = await req.db.query(`SELECT deployment_status, COUNT(*) total FROM deployments GROUP BY deployment_status`);
  const personnel = await req.db.query(`SELECT role, COUNT(*) total FROM personnel GROUP BY role`);
  const quota = await req.db.query(`SELECT SUM(quota_target) assigned, SUM(quota_completed) completed, SUM(quota_remaining) remaining FROM area_assignments`);
  const sync = await req.db.query(`SELECT sync_status, COUNT(*) total FROM offline_response_queue GROUP BY sync_status`);
  res.json({ deployments: deployments.rows, personnel: personnel.rows, quota: quota.rows[0], sync: sync.rows });
});

router.get('/dashboard/supervisor', async (req, res) => {
  const result = await req.db.query(
    `SELECT aa.*, p.full_name enumerator_name
     FROM area_assignments aa
     JOIN personnel p ON aa.personnel_id=p.personnel_id
     WHERE aa.supervisor_id IN (SELECT personnel_id FROM personnel WHERE user_id=$1)`,
    [req.user?.id]
  );
  res.json(result.rows);
});

router.get('/dashboard/enumerator', async (req, res) => {
  const result = await req.db.query(
    `SELECT aa.* FROM area_assignments aa
     JOIN personnel p ON aa.personnel_id=p.personnel_id
     WHERE p.user_id=$1`,
    [req.user?.id]
  );
  res.json(result.rows);
});

export default router;
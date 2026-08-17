import express from 'express';
import { validateSyncPayload } from '../validators/deploymentValidator.js';
import { syncResponses } from '../services/syncService.js';
import { fieldLog } from '../services/fieldLogService.js';

const router = express.Router();

router.post('/sync/responses', async (req, res) => {
  const errors = validateSyncPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  await fieldLog(req, {
    deployment_id: req.body.deployment_id,
    device_id: req.body.device_id,
    action: 'sync started',
    status: 'Processing',
    metadata: { records_count: req.body.records.length }
  });

  const result = await syncResponses(req, req.body);

  await fieldLog(req, {
    deployment_id: req.body.deployment_id,
    device_id: req.body.device_id,
    action: 'sync completed',
    status: 'Completed',
    metadata: result
  });

  res.json(result);
});

router.get('/sync/status', async (req, res) => {
  const result = await req.db.query(
    `SELECT * FROM sync_batches ORDER BY sync_started_at DESC LIMIT 50`
  );
  res.json(result.rows);
});

router.post('/sync/retry', async (req, res) => {
  res.json({ ok: true, message: 'Retry should be handled by frontend queue and /sync/responses endpoint.' });
});

export default router;
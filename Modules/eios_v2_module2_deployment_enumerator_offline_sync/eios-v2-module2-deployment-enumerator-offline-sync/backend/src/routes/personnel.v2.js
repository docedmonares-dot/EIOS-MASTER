import express from 'express';
import { validatePersonnel } from '../validators/deploymentValidator.js';
import { fieldLog } from '../services/fieldLogService.js';

const router = express.Router();

router.get('/personnel', async (req, res) => {
  const result = await req.db.query('SELECT * FROM personnel ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/personnel', async (req, res) => {
  const errors = validatePersonnel(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const p = req.body;
  const result = await req.db.query(
    `INSERT INTO personnel
     (user_id, full_name, role, mobile_number, email, assigned_project_id,
      assigned_client_id, immediate_supervisor_id, team_name, status, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) RETURNING *`,
    [
      p.user_id || null, p.full_name, p.role, p.mobile_number, p.email,
      p.assigned_project_id || null, p.assigned_client_id || null,
      p.immediate_supervisor_id || null, p.team_name,
      p.status || 'Active', req.user?.id || null
    ]
  );

  await fieldLog(req, { personnel_id: result.rows[0].personnel_id, action: 'personnel added' });
  res.status(201).json(result.rows[0]);
});

router.put('/personnel/:id', async (req, res) => {
  const p = req.body;
  const result = await req.db.query(
    `UPDATE personnel SET full_name=$1, role=$2, mobile_number=$3, email=$4,
     assigned_project_id=$5, assigned_client_id=$6, immediate_supervisor_id=$7,
     team_name=$8, status=$9, updated_by=$10, updated_at=CURRENT_TIMESTAMP
     WHERE personnel_id=$11 RETURNING *`,
    [
      p.full_name, p.role, p.mobile_number, p.email, p.assigned_project_id || null,
      p.assigned_client_id || null, p.immediate_supervisor_id || null, p.team_name,
      p.status || 'Active', req.user?.id || null, req.params.id
    ]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Personnel not found' });
  await fieldLog(req, { personnel_id: req.params.id, action: 'personnel edited' });
  res.json(result.rows[0]);
});

router.patch('/personnel/:id/status', async (req, res) => {
  const result = await req.db.query(
    `UPDATE personnel SET status=$1, updated_by=$2, updated_at=CURRENT_TIMESTAMP
     WHERE personnel_id=$3 RETURNING *`,
    [req.body.status, req.user?.id || null, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Personnel not found' });
  await fieldLog(req, { personnel_id: req.params.id, action: 'personnel status changed', status: req.body.status });
  res.json(result.rows[0]);
});

export default router;
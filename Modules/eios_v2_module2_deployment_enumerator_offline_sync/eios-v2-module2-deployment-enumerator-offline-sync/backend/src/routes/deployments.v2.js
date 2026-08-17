import express from 'express';
import { validateDeployment, validateAssignment } from '../validators/deploymentValidator.js';
import { fieldLog } from '../services/fieldLogService.js';

const router = express.Router();

router.get('/deployments', async (req, res) => {
  const result = await req.db.query('SELECT * FROM deployments ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/deployments', async (req, res) => {
  const errors = validateDeployment(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const d = req.body;
  const result = await req.db.query(
    `INSERT INTO deployments
     (client_id, project_id, survey_id, survey_version_id, survey_wave_id,
      deployment_name, election_type, geographic_scope, start_date, end_date,
      deployment_status, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING *`,
    [
      d.client_id || null, d.project_id || null, d.survey_id || null,
      d.survey_version_id || null, d.survey_wave_id || null, d.deployment_name,
      d.election_type, d.geographic_scope, d.start_date, d.end_date,
      d.deployment_status || 'Draft', req.user?.id || null
    ]
  );

  await fieldLog(req, { deployment_id: result.rows[0].deployment_id, action: 'deployment created' });
  res.status(201).json(result.rows[0]);
});

router.put('/deployments/:id', async (req, res) => {
  const d = req.body;
  const result = await req.db.query(
    `UPDATE deployments SET deployment_name=$1, election_type=$2, geographic_scope=$3,
     start_date=$4, end_date=$5, deployment_status=$6, updated_by=$7, updated_at=CURRENT_TIMESTAMP
     WHERE deployment_id=$8 RETURNING *`,
    [d.deployment_name, d.election_type, d.geographic_scope, d.start_date, d.end_date,
     d.deployment_status || 'Draft', req.user?.id || null, req.params.id]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Deployment not found' });
  res.json(result.rows[0]);
});

router.patch('/deployments/:id/status', async (req, res) => {
  const result = await req.db.query(
    `UPDATE deployments SET deployment_status=$1, updated_by=$2, updated_at=CURRENT_TIMESTAMP
     WHERE deployment_id=$3 RETURNING *`,
    [req.body.status, req.user?.id || null, req.params.id]
  );
  await fieldLog(req, { deployment_id: req.params.id, action: 'deployment status changed', status: req.body.status });
  res.json(result.rows[0]);
});

router.post('/deployments/:id/assign-survey', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO deployment_surveys
     (deployment_id, survey_id, survey_version_id, deployment_package, assigned_by)
     VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING *`,
    [req.params.id, x.survey_id, x.survey_version_id, JSON.stringify(x.deployment_package || {}), req.user?.id || null]
  );
  await fieldLog(req, { deployment_id: req.params.id, action: 'survey version assigned to deployment' });
  res.status(201).json(result.rows[0]);
});

router.post('/deployments/:id/assign-personnel', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO deployment_personnel
     (deployment_id, personnel_id, deployment_role, status, assigned_by)
     VALUES ($1,$2,$3,'Assigned',$4)
     ON CONFLICT (deployment_id, personnel_id)
     DO UPDATE SET deployment_role=$3, status='Assigned'
     RETURNING *`,
    [req.params.id, x.personnel_id, x.deployment_role, req.user?.id || null]
  );
  await fieldLog(req, { personnel_id: x.personnel_id, deployment_id: req.params.id, action: 'personnel assigned to deployment' });
  res.status(201).json(result.rows[0]);
});

router.post('/deployments/:id/assign-area', async (req, res) => {
  const errors = validateAssignment({ ...req.body, deployment_id: req.params.id });
  if (errors.length) return res.status(400).json({ errors });

  const a = req.body;
  const result = await req.db.query(
    `INSERT INTO area_assignments
     (deployment_id, personnel_id, supervisor_id, area_id, region, province, municipality,
      barangay, district, precinct_cluster, voting_center, quota_target, quota_completed,
      quota_remaining, assignment_status, start_date, end_date, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,$12,'Assigned',$13,$14,$15,$15)
     RETURNING *`,
    [
      req.params.id, a.personnel_id, a.supervisor_id || null, a.area_id || null,
      a.region, a.province, a.municipality, a.barangay, a.district, a.precinct_cluster,
      a.voting_center, a.quota_target || 0, a.start_date, a.end_date, req.user?.id || null
    ]
  );
  await fieldLog(req, { personnel_id: a.personnel_id, deployment_id: req.params.id, action: 'area assigned' });
  res.status(201).json(result.rows[0]);
});

export default router;
import express from 'express';
import { createTenant, listTenants, assignTenantUser } from '../services/tenantService.js';
import { getNationalCommandSummary, buildNationalCandidateMetrics } from '../services/nationalKpiService.js';
import { processRegionalUpload } from '../services/cloudSyncService.js';
import { refreshNationalMetrics } from '../services/dataWarehouseService.js';
import { nationalSecurityLog } from '../security/nationalSecurityService.js';

const router = express.Router();

router.get('/cloud/tenants', async (req, res) => {
  res.json(await listTenants(req));
});

router.post('/cloud/tenants', async (req, res) => {
  const tenant = await createTenant(req, req.body);
  await nationalSecurityLog(req, { tenant_id: tenant.tenant_id, event_type: 'tenant created', severity: 'Info' });
  res.status(201).json(tenant);
});

router.post('/cloud/tenants/assign-user', async (req, res) => {
  const record = await assignTenantUser(req, req.body);
  await nationalSecurityLog(req, { tenant_id: req.body.tenant_id, event_type: 'tenant user assigned', severity: 'Info' });
  res.status(201).json(record);
});

router.post('/cloud/election-cycles', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO national_election_cycles(cycle_code, cycle_name, election_date, election_type, status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [x.cycle_code, x.cycle_name, x.election_date, x.election_type, x.status || 'Planning']
  );
  res.status(201).json(result.rows[0]);
});

router.get('/cloud/election-cycles', async (req, res) => {
  const result = await req.db.query('SELECT * FROM national_election_cycles ORDER BY election_date DESC');
  res.json(result.rows);
});

router.post('/cloud/projects', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO national_projects
     (tenant_id, national_cycle_id, project_code, project_name, project_scope, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [x.tenant_id, x.national_cycle_id || null, x.project_code, x.project_name,
     x.project_scope || 'National', x.status || 'Active', req.user?.id || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/cloud/projects', async (req, res) => {
  const result = await req.db.query('SELECT * FROM national_projects ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/cloud/geography', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO national_geography
     (parent_geo_id, geo_level, geo_code, geo_name, psgc_code, registered_voters,
      population, households, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *`,
    [x.parent_geo_id || null, x.geo_level, x.geo_code, x.geo_name, x.psgc_code,
     x.registered_voters || 0, x.population || 0, x.households || 0,
     JSON.stringify(x.metadata_json || {})]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/cloud/geography', async (req, res) => {
  const { geo_level, parent_geo_id } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (geo_level) { params.push(geo_level); where += ` AND geo_level=$${params.length}`; }
  if (parent_geo_id) { params.push(parent_geo_id); where += ` AND parent_geo_id=$${params.length}`; }

  const result = await req.db.query(
    `SELECT geo_id, parent_geo_id, geo_level, geo_code, geo_name, psgc_code,
            registered_voters, population, households
     FROM national_geography ${where}
     ORDER BY geo_level, geo_name LIMIT 2000`,
    params
  );
  res.json(result.rows);
});

router.post('/cloud/regional-nodes', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO regional_nodes
     (tenant_id, national_project_id, node_code, node_name, node_type,
      assigned_geo_id, api_endpoint, sync_status, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8) RETURNING *`,
    [x.tenant_id, x.national_project_id, x.node_code, x.node_name,
     x.node_type || 'Regional Command', x.assigned_geo_id || null,
     x.api_endpoint || null, x.status || 'Active']
  );
  res.status(201).json(result.rows[0]);
});

router.get('/cloud/regional-nodes', async (req, res) => {
  const result = await req.db.query('SELECT * FROM regional_nodes ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/cloud/sync/upload', async (req, res) => {
  const result = await processRegionalUpload(req, req.body);
  await nationalSecurityLog(req, { tenant_id: req.body.tenant_id, node_id: req.body.node_id, event_type: 'regional upload sync', severity: 'Info', metadata: result });
  res.json(result);
});

router.get('/cloud/sync/batches', async (req, res) => {
  const result = await req.db.query('SELECT * FROM cloud_sync_batches ORDER BY started_at DESC LIMIT 100');
  res.json(result.rows);
});

router.get('/cloud/sync/conflicts', async (req, res) => {
  const result = await req.db.query('SELECT * FROM cloud_sync_conflicts ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.post('/cloud/warehouse/refresh', async (req, res) => {
  res.json(await refreshNationalMetrics(req, req.body));
});

router.get('/cloud/warehouse/jobs', async (req, res) => {
  const result = await req.db.query('SELECT * FROM national_data_warehouse_jobs ORDER BY created_at DESC LIMIT 100');
  res.json(result.rows);
});

router.get('/cloud/command/kpis', async (req, res) => {
  res.json(await getNationalCommandSummary(req, req.query));
});

router.get('/cloud/command/candidate-metrics', async (req, res) => {
  res.json(await buildNationalCandidateMetrics(req));
});

router.post('/cloud/alerts', async (req, res) => {
  const x = req.body;
  const result = await req.db.query(
    `INSERT INTO national_alerts
     (tenant_id, national_project_id, geo_id, alert_scope, alert_type, severity,
      title, message, recommended_action, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Open') RETURNING *`,
    [x.tenant_id, x.national_project_id || null, x.geo_id || null, x.alert_scope || 'National',
     x.alert_type, x.severity || 'Info', x.title, x.message, x.recommended_action]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/cloud/alerts', async (req, res) => {
  const result = await req.db.query('SELECT * FROM national_alerts ORDER BY created_at DESC LIMIT 200');
  res.json(result.rows);
});

export default router;
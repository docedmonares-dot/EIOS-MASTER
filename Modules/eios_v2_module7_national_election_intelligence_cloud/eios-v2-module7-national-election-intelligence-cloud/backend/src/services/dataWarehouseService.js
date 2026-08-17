export async function createWarehouseJob(req, body) {
  const result = await req.db.query(
    `INSERT INTO national_data_warehouse_jobs
     (tenant_id, national_project_id, job_type, job_status, source_tables, output_tables)
     VALUES ($1,$2,$3,'Queued',$4::jsonb,$5::jsonb) RETURNING *`,
    [body.tenant_id || null, body.national_project_id || null, body.job_type || 'Refresh Metrics',
     JSON.stringify(body.source_tables || []), JSON.stringify(body.output_tables || [])]
  );
  return result.rows[0];
}

export async function refreshNationalMetrics(req, body) {
  const job = await createWarehouseJob(req, body);

  await req.db.query(
    `UPDATE national_data_warehouse_jobs SET job_status='Running', started_at=CURRENT_TIMESTAMP
     WHERE warehouse_job_id=$1`,
    [job.warehouse_job_id]
  );

  // Integration point:
  // Pull validated metric outputs from Module 3, GIS classifications from Module 5,
  // field operation counts from Module 2, and alerts from Module 4.
  // This scaffold creates the job lifecycle and target warehouse model.

  await req.db.query(
    `UPDATE national_data_warehouse_jobs SET job_status='Completed', completed_at=CURRENT_TIMESTAMP
     WHERE warehouse_job_id=$1`,
    [job.warehouse_job_id]
  );

  return { ...job, job_status: 'Completed' };
}
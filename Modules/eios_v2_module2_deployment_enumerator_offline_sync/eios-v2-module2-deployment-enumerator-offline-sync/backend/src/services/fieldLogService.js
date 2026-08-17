export async function fieldLog(req, {
  personnel_id = null,
  device_id = null,
  deployment_id = null,
  action,
  status = 'Success',
  gps_lat = null,
  gps_lng = null,
  metadata = {}
}) {
  await req.db.query(
    `INSERT INTO field_operation_logs
     (user_id, personnel_id, role, device_id, deployment_id, action, status,
      ip_address, gps_lat, gps_lng, user_agent, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
    [
      req.user?.id || null,
      personnel_id,
      req.user?.role || null,
      device_id,
      deployment_id,
      action,
      status,
      req.ip || null,
      gps_lat,
      gps_lng,
      req.headers['user-agent'] || '',
      JSON.stringify(metadata)
    ]
  );
}
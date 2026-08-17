export async function nationalSecurityLog(req, {
  tenant_id=null,
  node_id=null,
  event_type,
  severity='Info',
  lat=null,
  lng=null,
  metadata={}
}) {
  await req.db.query(
    `INSERT INTO national_security_events
     (tenant_id, user_id, node_id, event_type, severity, ip_address, user_agent, geo_location, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,
       CASE WHEN $8::numeric IS NULL OR $9::numeric IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($9,$8),4326) END,
       $10::jsonb)`,
    [
      tenant_id, req.user?.id || null, node_id, event_type, severity,
      req.ip || null, req.headers['user-agent'] || '', lat, lng, JSON.stringify(metadata || {})
    ]
  );
}
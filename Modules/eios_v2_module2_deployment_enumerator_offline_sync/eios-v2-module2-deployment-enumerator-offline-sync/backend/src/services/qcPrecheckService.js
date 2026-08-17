export async function qcPrecheck(req, record, options = {}) {
  const flags = [];
  const blocking = [];
  const warnings = [];

  if (!record.final_locked) warnings.push('Record not final locked');
  if (!record.gps?.lat || !record.gps?.lng) blocking.push('Missing GPS');
  if (Number(record.gps?.accuracy || 9999) > Number(options.max_accuracy || 50)) warnings.push('Weak GPS Accuracy');
  if (Number(record.duration_seconds || 0) < Number(options.min_duration_seconds || 120)) warnings.push('Interview too short');
  if (!record.respondent_code) blocking.push('Missing respondent code');

  const dup = await req.db.query(
    `SELECT 1 FROM offline_response_queue
     WHERE respondent_code=$1 AND deployment_id=$2 AND sync_status IN ('Synced','Final Locked Unsynced') LIMIT 1`,
    [record.respondent_code, record.deployment_id]
  );
  if (dup.rowCount) warnings.push('Duplicate respondent code');

  flags.push(...blocking, ...warnings);

  const qc_status = blocking.length
    ? 'Blocked'
    : warnings.length
      ? 'For Supervisor Review'
      : 'Valid';

  await req.db.query(
    `INSERT INTO qc_precheck_results
     (local_response_id, deployment_id, personnel_id, qc_status,
      qc_flags, blocking_flags, warning_flags)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb)`,
    [
      record.local_response_id,
      record.deployment_id,
      record.enumerator_id,
      qc_status,
      JSON.stringify(flags),
      JSON.stringify(blocking),
      JSON.stringify(warnings)
    ]
  );

  return {
    qc_status,
    qc_flags: flags,
    blocking_flags: blocking,
    warning_flags: warnings
  };
}
import { v4 as uuid } from 'uuid';

export async function createCloudSyncBatch(req, payload) {
  const batchId = uuid();
  await req.db.query(
    `INSERT INTO cloud_sync_batches
     (cloud_sync_batch_id, tenant_id, node_id, source_system, sync_direction,
      records_count, sync_status)
     VALUES ($1,$2,$3,$4,$5,$6,'Processing')`,
    [batchId, payload.tenant_id, payload.node_id, payload.source_system || 'Regional Node',
     payload.sync_direction || 'Upload', payload.records?.length || 0]
  );
  return batchId;
}

export async function completeCloudSyncBatch(req, batchId, result) {
  await req.db.query(
    `UPDATE cloud_sync_batches SET accepted_count=$1, rejected_count=$2, conflict_count=$3,
     sync_status='Completed', completed_at=CURRENT_TIMESTAMP WHERE cloud_sync_batch_id=$4`,
    [result.accepted_count || 0, result.rejected_count || 0, result.conflict_count || 0, batchId]
  );
}

export async function registerSyncConflict(req, { batchId, entity_type, entity_id, conflict_type, local_value, cloud_value }) {
  const result = await req.db.query(
    `INSERT INTO cloud_sync_conflicts
     (cloud_sync_batch_id, entity_type, entity_id, conflict_type, local_value, cloud_value)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb) RETURNING *`,
    [batchId, entity_type, entity_id || null, conflict_type,
     JSON.stringify(local_value || {}), JSON.stringify(cloud_value || {})]
  );
  return result.rows[0];
}

export async function processRegionalUpload(req, payload) {
  const batchId = await createCloudSyncBatch(req, payload);
  let accepted = 0, rejected = 0, conflict = 0;

  for (const record of payload.records || []) {
    try {
      if (!record.entity_type) {
        rejected++;
        continue;
      }
      accepted++;
    } catch {
      conflict++;
      await registerSyncConflict(req, {
        batchId,
        entity_type: record.entity_type,
        entity_id: record.entity_id,
        conflict_type: 'Processing Error',
        local_value: record,
        cloud_value: {}
      });
    }
  }

  await completeCloudSyncBatch(req, batchId, { accepted_count: accepted, rejected_count: rejected, conflict_count: conflict });
  return { batch_id: batchId, accepted_count: accepted, rejected_count: rejected, conflict_count: conflict };
}
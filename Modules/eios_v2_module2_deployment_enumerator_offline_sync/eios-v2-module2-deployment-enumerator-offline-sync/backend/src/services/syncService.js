import { v4 as uuid } from 'uuid';
import { qcPrecheck } from './qcPrecheckService.js';

export async function syncResponses(req, payload) {
  const batchId = uuid();
  const accepted_records = [];
  const rejected_records = [];
  const conflict_records = [];
  const server_response_ids = [];

  await req.db.query(
    `INSERT INTO sync_batches
     (sync_batch_id, device_id, enumerator_id, deployment_id, records_count, sync_status)
     VALUES ($1,$2,$3,$4,$5,'Processing')`,
    [batchId, payload.device_id, payload.enumerator_id, payload.deployment_id, payload.records.length]
  );

  for (const record of payload.records) {
    try {
      const existing = await req.db.query(
        `SELECT offline_response_id FROM offline_response_queue WHERE local_response_id=$1`,
        [record.local_response_id]
      );

      if (existing.rowCount) {
        conflict_records.push({ local_response_id: record.local_response_id, reason: 'Duplicate local_response_id' });
        await insertSyncRecord(req, batchId, record.local_response_id, null, 'Conflict', 'Duplicate local_response_id');
        continue;
      }

      const qc = await qcPrecheck(req, {
        ...record,
        deployment_id: payload.deployment_id,
        enumerator_id: payload.enumerator_id
      });

      if (qc.qc_status === 'Blocked') {
        rejected_records.push({ local_response_id: record.local_response_id, reason: 'QC Blocked', qc });
        await insertSyncRecord(req, batchId, record.local_response_id, null, 'Rejected', 'QC Blocked');
        continue;
      }

      const serverId = uuid();

      await req.db.query(
        `INSERT INTO offline_response_queue
         (offline_response_id, local_response_id, local_device_id, enumerator_id,
          deployment_id, survey_version_id, respondent_code, answers_json, gps_json,
          qc_precheck_json, sync_status, retry_count, synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,'Synced',0,CURRENT_TIMESTAMP)`,
        [
          serverId,
          record.local_response_id,
          payload.device_id,
          payload.enumerator_id,
          payload.deployment_id,
          record.survey_version_id,
          record.respondent_code,
          JSON.stringify(record.answers || {}),
          JSON.stringify(record.gps || {}),
          JSON.stringify(qc)
        ]
      );

      accepted_records.push({ local_response_id: record.local_response_id, server_response_id: serverId, qc });
      server_response_ids.push(serverId);
      await insertSyncRecord(req, batchId, record.local_response_id, serverId, 'Accepted', 'Synced');

    } catch (err) {
      rejected_records.push({ local_response_id: record.local_response_id, reason: err.message });
      await insertSyncRecord(req, batchId, record.local_response_id, null, 'Failed', err.message);
    }
  }

  await req.db.query(
    `UPDATE sync_batches SET accepted_count=$1, rejected_count=$2, conflict_count=$3,
     sync_status='Completed', sync_completed_at=CURRENT_TIMESTAMP WHERE sync_batch_id=$4`,
    [accepted_records.length, rejected_records.length, conflict_records.length, batchId]
  );

  return {
    batch_id: batchId,
    accepted_records,
    rejected_records,
    conflict_records,
    server_response_ids,
    sync_timestamp: new Date().toISOString()
  };
}

async function insertSyncRecord(req, batchId, localId, serverId, result, detail) {
  await req.db.query(
    `INSERT INTO sync_records
     (sync_batch_id, local_response_id, server_response_id, sync_result, result_detail)
     VALUES ($1,$2,$3,$4,$5)`,
    [batchId, localId, serverId, result, detail]
  );
}
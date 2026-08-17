import { getUnsyncedResponses, putRecord } from './indexedDbEngine';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v2';

function token() {
  return localStorage.getItem('eios_token');
}

export async function syncOfflineResponses({ device_id, enumerator_id, deployment_id }) {
  const records = await getUnsyncedResponses();
  if (!records.length) return { ok: true, message: 'No records to sync', records: [] };

  records.forEach(r => r.sync_status = 'Syncing');

  const res = await fetch(`${API_BASE}/sync/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`
    },
    body: JSON.stringify({ device_id, enumerator_id, deployment_id, records })
  });

  const result = await res.json();

  for (const accepted of result.accepted_records || []) {
    const found = records.find(r => r.local_response_id === accepted.local_response_id);
    if (found) {
      await putRecord('responses', {
        ...found,
        server_response_id: accepted.server_response_id,
        sync_status: 'Synced',
        synced_at: new Date().toISOString()
      });
    }
  }

  for (const rejected of result.rejected_records || []) {
    const found = records.find(r => r.local_response_id === rejected.local_response_id);
    if (found) {
      await putRecord('responses', {
        ...found,
        sync_status: 'Rejected',
        rejection_reason: rejected.reason,
        updated_at: new Date().toISOString()
      });
    }
  }

  for (const conflict of result.conflict_records || []) {
    const found = records.find(r => r.local_response_id === conflict.local_response_id);
    if (found) {
      await putRecord('responses', {
        ...found,
        sync_status: 'Conflict',
        conflict_reason: conflict.reason,
        updated_at: new Date().toISOString()
      });
    }
  }

  return result;
}
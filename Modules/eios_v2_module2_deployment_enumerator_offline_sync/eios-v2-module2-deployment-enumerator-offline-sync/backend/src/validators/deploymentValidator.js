export function validatePersonnel(body) {
  const errors = [];
  if (!body.full_name) errors.push('full_name is required');
  if (!body.role) errors.push('role is required');
  return errors;
}

export function validateDeployment(body) {
  const errors = [];
  if (!body.deployment_name) errors.push('deployment_name is required');
  if (!body.client_id) errors.push('client_id is recommended');
  if (!body.project_id) errors.push('project_id is recommended');
  return errors;
}

export function validateAssignment(body) {
  const errors = [];
  if (!body.personnel_id) errors.push('personnel_id is required');
  if (!body.deployment_id) errors.push('deployment_id is required');
  if (!body.quota_target && body.quota_target !== 0) errors.push('quota_target is required');
  return errors;
}

export function validateSyncPayload(body) {
  const errors = [];
  if (!body.device_id) errors.push('device_id is required');
  if (!body.enumerator_id) errors.push('enumerator_id is required');
  if (!body.deployment_id) errors.push('deployment_id is required');
  if (!Array.isArray(body.records)) errors.push('records must be an array');
  return errors;
}
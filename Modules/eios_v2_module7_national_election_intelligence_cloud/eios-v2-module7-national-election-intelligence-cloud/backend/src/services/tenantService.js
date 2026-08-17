export async function createTenant(req, body) {
  const result = await req.db.query(
    `INSERT INTO tenants
     (tenant_code, tenant_name, tenant_type, subscription_tier, status, data_region)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [body.tenant_code, body.tenant_name, body.tenant_type || 'Campaign Organization',
     body.subscription_tier || 'Enterprise', body.status || 'Active', body.data_region || null]
  );
  return result.rows[0];
}

export async function listTenants(req) {
  const result = await req.db.query(`SELECT * FROM tenants ORDER BY created_at DESC`);
  return result.rows;
}

export async function assignTenantUser(req, body) {
  const result = await req.db.query(
    `INSERT INTO tenant_users(tenant_id, user_id, tenant_role, access_scope, status)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET tenant_role=$3, access_scope=$4, status=$5
     RETURNING *`,
    [body.tenant_id, body.user_id, body.tenant_role, body.access_scope || 'Tenant', body.status || 'Active']
  );
  return result.rows[0];
}
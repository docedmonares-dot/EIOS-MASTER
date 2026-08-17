CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(120) UNIQUE NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    tenant_type VARCHAR(80) DEFAULT 'Campaign Organization',
    subscription_tier VARCHAR(80) DEFAULT 'Enterprise',
    status VARCHAR(40) DEFAULT 'Active' CHECK (status IN ('Active','Suspended','Inactive','Archived')),
    data_region VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    tenant_role VARCHAR(120) NOT NULL,
    access_scope VARCHAR(120) DEFAULT 'Tenant',
    status VARCHAR(40) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS national_election_cycles (
    national_cycle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_code VARCHAR(120) UNIQUE NOT NULL,
    cycle_name VARCHAR(255) NOT NULL,
    election_date DATE,
    election_type VARCHAR(120),
    status VARCHAR(40) DEFAULT 'Planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_geography (
    geo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_geo_id UUID REFERENCES national_geography(geo_id),
    geo_level VARCHAR(80) NOT NULL CHECK (geo_level IN (
        'Country','Island Group','Region','Province','HUC','City','Municipality',
        'Congressional District','Legislative District','Barangay','Precinct Cluster','Voting Center'
    )),
    geo_code VARCHAR(120),
    geo_name VARCHAR(255) NOT NULL,
    psgc_code VARCHAR(80),
    registered_voters INTEGER DEFAULT 0,
    population INTEGER DEFAULT 0,
    households INTEGER DEFAULT 0,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_national_geo_parent ON national_geography(parent_geo_id);
CREATE INDEX IF NOT EXISTS idx_national_geo_level ON national_geography(geo_level);
CREATE INDEX IF NOT EXISTS idx_national_geo_geom ON national_geography USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_national_geo_centroid ON national_geography USING GIST(centroid);

CREATE TABLE IF NOT EXISTS national_projects (
    national_project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_cycle_id UUID REFERENCES national_election_cycles(national_cycle_id),
    project_code VARCHAR(120) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_scope VARCHAR(120) DEFAULT 'National',
    status VARCHAR(40) DEFAULT 'Active',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_nodes (
    node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    node_code VARCHAR(120) UNIQUE NOT NULL,
    node_name VARCHAR(255) NOT NULL,
    node_type VARCHAR(80) DEFAULT 'Regional Command',
    assigned_geo_id UUID REFERENCES national_geography(geo_id),
    api_endpoint TEXT,
    sync_status VARCHAR(60) DEFAULT 'Pending',
    last_sync_at TIMESTAMP,
    status VARCHAR(40) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloud_sync_batches (
    cloud_sync_batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    node_id UUID REFERENCES regional_nodes(node_id),
    source_system VARCHAR(120),
    sync_direction VARCHAR(40) CHECK (sync_direction IN ('Upload','Download','Bidirectional')),
    records_count INTEGER DEFAULT 0,
    accepted_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    conflict_count INTEGER DEFAULT 0,
    sync_status VARCHAR(40) DEFAULT 'Processing',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloud_sync_conflicts (
    conflict_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cloud_sync_batch_id UUID REFERENCES cloud_sync_batches(cloud_sync_batch_id) ON DELETE CASCADE,
    entity_type VARCHAR(120),
    entity_id UUID,
    conflict_type VARCHAR(120),
    local_value JSONB,
    cloud_value JSONB,
    resolution_status VARCHAR(40) DEFAULT 'Pending',
    resolved_by UUID,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_command_kpis (
    national_kpi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    geo_id UUID REFERENCES national_geography(geo_id),
    survey_wave_id UUID,
    total_interviews INTEGER DEFAULT 0,
    valid_interviews INTEGER DEFAULT 0,
    flagged_interviews INTEGER DEFAULT 0,
    synced_interviews INTEGER DEFAULT 0,
    active_enumerators INTEGER DEFAULT 0,
    awareness_avg NUMERIC,
    satisfaction_avg NUMERIC,
    trust_avg NUMERIC,
    preference_leader VARCHAR(255),
    preference_leader_score NUMERIC,
    tenacity_avg NUMERIC,
    swing_area_count INTEGER DEFAULT 0,
    critical_alert_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_national_command_kpis_geo ON national_command_kpis(geo_id);
CREATE INDEX IF NOT EXISTS idx_national_command_kpis_project ON national_command_kpis(national_project_id);

CREATE TABLE IF NOT EXISTS national_alerts (
    national_alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    geo_id UUID REFERENCES national_geography(geo_id),
    alert_scope VARCHAR(80) DEFAULT 'National',
    alert_type VARCHAR(160),
    severity VARCHAR(40) CHECK (severity IN ('Info','Low','Medium','High','Critical')) DEFAULT 'Info',
    title VARCHAR(255),
    message TEXT,
    recommended_action TEXT,
    status VARCHAR(40) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_by UUID,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_data_warehouse_jobs (
    warehouse_job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    job_type VARCHAR(120),
    job_status VARCHAR(40) DEFAULT 'Queued',
    source_tables JSONB DEFAULT '[]'::jsonb,
    output_tables JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fact_national_survey_metrics (
    fact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    national_cycle_id UUID REFERENCES national_election_cycles(national_cycle_id),
    geo_id UUID REFERENCES national_geography(geo_id),
    survey_wave_id UUID,
    candidate_name VARCHAR(255),
    metric_name VARCHAR(120),
    metric_value NUMERIC,
    raw_count INTEGER,
    base_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fact_national_metrics_geo ON fact_national_survey_metrics(geo_id);
CREATE INDEX IF NOT EXISTS idx_fact_national_metrics_candidate ON fact_national_survey_metrics(candidate_name);
CREATE INDEX IF NOT EXISTS idx_fact_national_metrics_name ON fact_national_survey_metrics(metric_name);

CREATE TABLE IF NOT EXISTS fact_national_field_operations (
    fact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    national_project_id UUID REFERENCES national_projects(national_project_id),
    geo_id UUID REFERENCES national_geography(geo_id),
    deployment_id UUID,
    total_quota INTEGER,
    completed_quota INTEGER,
    synced_records INTEGER,
    unsynced_records INTEGER,
    flagged_records INTEGER,
    rejected_records INTEGER,
    active_enumerators INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS national_security_events (
    security_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    user_id UUID,
    node_id UUID REFERENCES regional_nodes(node_id),
    event_type VARCHAR(160),
    severity VARCHAR(40) DEFAULT 'Info',
    ip_address INET,
    user_agent TEXT,
    geo_location GEOMETRY(POINT, 4326),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_national_security_tenant ON national_security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_national_security_event_type ON national_security_events(event_type);

CREATE OR REPLACE VIEW vw_national_kpi_summary AS
SELECT
    t.tenant_name,
    np.project_name,
    ng.geo_level,
    ng.geo_name,
    SUM(k.total_interviews) total_interviews,
    SUM(k.valid_interviews) valid_interviews,
    SUM(k.flagged_interviews) flagged_interviews,
    AVG(k.awareness_avg) awareness_avg,
    AVG(k.trust_avg) trust_avg,
    AVG(k.tenacity_avg) tenacity_avg,
    SUM(k.swing_area_count) swing_area_count,
    SUM(k.critical_alert_count) critical_alert_count
FROM national_command_kpis k
LEFT JOIN tenants t ON k.tenant_id = t.tenant_id
LEFT JOIN national_projects np ON k.national_project_id = np.national_project_id
LEFT JOIN national_geography ng ON k.geo_id = ng.geo_id
GROUP BY t.tenant_name, np.project_name, ng.geo_level, ng.geo_name;

CREATE OR REPLACE VIEW vw_national_candidate_metrics AS
SELECT
    candidate_name,
    metric_name,
    AVG(metric_value) avg_metric,
    SUM(raw_count) raw_count,
    SUM(base_count) base_count
FROM fact_national_survey_metrics
GROUP BY candidate_name, metric_name;
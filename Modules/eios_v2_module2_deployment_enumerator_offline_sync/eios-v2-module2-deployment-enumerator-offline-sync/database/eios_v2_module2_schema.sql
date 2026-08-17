-- EIOS V2 Module 2
-- Deployment Manager, Personnel Assignment, Enumerator App, Offline Sync
-- Target: PostgreSQL 15+ with PostGIS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS personnel (
    personnel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(80) NOT NULL CHECK (role IN (
        'Operations Manager','Deployment Supervisor','QC Supervisor',
        'Field Supervisor','Enumerator','Analyst','Client Viewer'
    )),
    mobile_number VARCHAR(50),
    email VARCHAR(255),
    assigned_project_id UUID,
    assigned_client_id UUID,
    immediate_supervisor_id UUID REFERENCES personnel(personnel_id),
    team_name VARCHAR(160),
    status VARCHAR(40) DEFAULT 'Active' CHECK (status IN ('Active','Standby','Suspended','Inactive','Archived')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personnel_role ON personnel(role);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON personnel(status);
CREATE INDEX IF NOT EXISTS idx_personnel_supervisor ON personnel(immediate_supervisor_id);

CREATE TABLE IF NOT EXISTS field_teams (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(160) NOT NULL,
    deployment_id UUID,
    supervisor_id UUID REFERENCES personnel(personnel_id),
    team_status VARCHAR(40) DEFAULT 'Active',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
    deployment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_id UUID,
    survey_version_id UUID,
    survey_wave_id UUID,
    deployment_name VARCHAR(255) NOT NULL,
    election_type VARCHAR(120),
    geographic_scope VARCHAR(255),
    start_date DATE,
    end_date DATE,
    deployment_status VARCHAR(40) DEFAULT 'Draft' CHECK (deployment_status IN ('Draft','Ready','Active','Paused','Closed','Archived')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);

CREATE TABLE IF NOT EXISTS deployment_surveys (
    deployment_survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    survey_id UUID NOT NULL,
    survey_version_id UUID NOT NULL,
    deployment_package JSONB NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID
);

CREATE TABLE IF NOT EXISTS deployment_personnel (
    deployment_personnel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel(personnel_id),
    deployment_role VARCHAR(80) NOT NULL,
    status VARCHAR(40) DEFAULT 'Assigned' CHECK (status IN ('Assigned','Active','Paused','Removed','Completed')),
    assigned_by UUID,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deployment_id, personnel_id)
);

CREATE TABLE IF NOT EXISTS area_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(deployment_id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel(personnel_id),
    supervisor_id UUID REFERENCES personnel(personnel_id),
    area_id UUID,
    region VARCHAR(160),
    province VARCHAR(160),
    municipality VARCHAR(160),
    barangay VARCHAR(160),
    district VARCHAR(160),
    precinct_cluster VARCHAR(160),
    voting_center VARCHAR(255),
    gps_polygon GEOMETRY(POLYGON, 4326),
    gps_radius_center GEOMETRY(POINT, 4326),
    gps_radius_meters NUMERIC(12,2),
    quota_target INTEGER DEFAULT 0,
    quota_completed INTEGER DEFAULT 0,
    quota_remaining INTEGER DEFAULT 0,
    assignment_status VARCHAR(40) DEFAULT 'Assigned' CHECK (assignment_status IN ('Assigned','In Progress','Completed','Paused','Reassigned','Cancelled')),
    start_date DATE,
    end_date DATE,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_area_assignments_deployment ON area_assignments(deployment_id);
CREATE INDEX IF NOT EXISTS idx_area_assignments_personnel ON area_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_area_assignments_polygon ON area_assignments USING GIST(gps_polygon);
CREATE INDEX IF NOT EXISTS idx_area_assignments_radius_center ON area_assignments USING GIST(gps_radius_center);

CREATE TABLE IF NOT EXISTS quota_assignments (
    quota_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES area_assignments(assignment_id) ON DELETE CASCADE,
    quota_type VARCHAR(80) DEFAULT 'Total',
    quota_label VARCHAR(160),
    quota_target INTEGER DEFAULT 0,
    quota_completed INTEGER DEFAULT 0,
    quota_remaining INTEGER DEFAULT 0,
    hard_block_when_full BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enumerator_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnel_id UUID NOT NULL REFERENCES personnel(personnel_id),
    device_name VARCHAR(255),
    device_fingerprint TEXT,
    platform VARCHAR(120),
    browser VARCHAR(120),
    os_version VARCHAR(120),
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP,
    last_login_at TIMESTAMP,
    status VARCHAR(40) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Blocked','Retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_personnel ON enumerator_devices(personnel_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON enumerator_devices(status);

CREATE TABLE IF NOT EXISTS offline_response_queue (
    offline_response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_response_id VARCHAR(160) UNIQUE NOT NULL,
    local_device_id UUID,
    enumerator_id UUID REFERENCES personnel(personnel_id),
    deployment_id UUID REFERENCES deployments(deployment_id),
    survey_version_id UUID,
    respondent_code VARCHAR(160),
    answers_json JSONB NOT NULL,
    gps_json JSONB,
    qc_precheck_json JSONB,
    sync_status VARCHAR(60) DEFAULT 'Draft' CHECK (sync_status IN (
        'Draft','Final Locked Unsynced','Syncing','Synced','Failed','Conflict','Rejected'
    )),
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_status ON offline_response_queue(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_enumerator ON offline_response_queue(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_offline_deployment ON offline_response_queue(deployment_id);

CREATE TABLE IF NOT EXISTS sync_batches (
    sync_batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID,
    enumerator_id UUID REFERENCES personnel(personnel_id),
    deployment_id UUID REFERENCES deployments(deployment_id),
    records_count INTEGER DEFAULT 0,
    accepted_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    conflict_count INTEGER DEFAULT 0,
    sync_status VARCHAR(40) DEFAULT 'Processing',
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_records (
    sync_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_batch_id UUID NOT NULL REFERENCES sync_batches(sync_batch_id) ON DELETE CASCADE,
    local_response_id VARCHAR(160),
    server_response_id UUID,
    sync_result VARCHAR(40) CHECK (sync_result IN ('Accepted','Rejected','Conflict','Failed')),
    result_detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gps_validation_logs (
    gps_validation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID,
    assignment_id UUID,
    personnel_id UUID,
    local_response_id VARCHAR(160),
    gps_point GEOMETRY(POINT, 4326),
    gps_accuracy NUMERIC(12,2),
    inside_assigned_area BOOLEAN,
    gps_accuracy_passed BOOLEAN,
    distance_from_area NUMERIC(14,2),
    gps_validation_status VARCHAR(40) CHECK (gps_validation_status IN ('Valid','Warning','Invalid','Missing','Out of Area')),
    gps_validation_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gps_validation_point ON gps_validation_logs USING GIST(gps_point);
CREATE INDEX IF NOT EXISTS idx_gps_validation_personnel ON gps_validation_logs(personnel_id);

CREATE TABLE IF NOT EXISTS qc_precheck_results (
    qc_precheck_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    local_response_id VARCHAR(160),
    deployment_id UUID,
    personnel_id UUID,
    qc_status VARCHAR(60) CHECK (qc_status IN ('Valid','Warning','Blocked','For Supervisor Review')),
    qc_flags JSONB DEFAULT '[]'::jsonb,
    blocking_flags JSONB DEFAULT '[]'::jsonb,
    warning_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supervisor_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID,
    local_response_id VARCHAR(160),
    server_response_id UUID,
    supervisor_id UUID REFERENCES personnel(personnel_id),
    review_status VARCHAR(60) CHECK (review_status IN ('Pending','Approved','Rejected','Backcheck','Reinterview','Fraud Suspected')),
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_operation_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    personnel_id UUID,
    role VARCHAR(80),
    device_id UUID,
    deployment_id UUID,
    action VARCHAR(160) NOT NULL,
    status VARCHAR(80),
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    gps_lat NUMERIC(12,8),
    gps_lng NUMERIC(12,8),
    user_agent TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_field_logs_user ON field_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_field_logs_deployment ON field_operation_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_field_logs_action ON field_operation_logs(action);

CREATE TABLE IF NOT EXISTS enumerator_attendance (
    attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enumerator_id UUID REFERENCES personnel(personnel_id),
    deployment_id UUID REFERENCES deployments(deployment_id),
    device_id UUID REFERENCES enumerator_devices(device_id),
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    clock_in_gps GEOMETRY(POINT, 4326),
    clock_out_gps GEOMETRY(POINT, 4326),
    selfie_photo_url TEXT,
    attendance_status VARCHAR(60) DEFAULT 'Clocked In',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
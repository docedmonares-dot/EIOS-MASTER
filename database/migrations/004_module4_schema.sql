CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS war_room_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    session_name VARCHAR(255) NOT NULL,
    session_type VARCHAR(80) DEFAULT 'Executive',
    session_status VARCHAR(40) DEFAULT 'Active',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS war_room_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES war_room_sessions(session_id) ON DELETE CASCADE,
    client_id UUID,
    project_id UUID,
    alert_type VARCHAR(120) NOT NULL,
    severity VARCHAR(40) CHECK (severity IN ('Info','Low','Medium','High','Critical')) DEFAULT 'Info',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    affected_area VARCHAR(255),
    affected_candidate VARCHAR(255),
    metric_name VARCHAR(120),
    metric_value NUMERIC,
    recommendation TEXT,
    alert_status VARCHAR(40) DEFAULT 'Open' CHECK (alert_status IN ('Open','Acknowledged','Resolved','Archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_by UUID,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_war_room_alerts_session ON war_room_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_war_room_alerts_severity ON war_room_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_war_room_alerts_status ON war_room_alerts(alert_status);

CREATE TABLE IF NOT EXISTS war_room_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES war_room_sessions(session_id) ON DELETE CASCADE,
    client_id UUID,
    project_id UUID,
    recommendation_type VARCHAR(120) NOT NULL,
    priority VARCHAR(40) DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
    title VARCHAR(255) NOT NULL,
    recommendation_text TEXT NOT NULL,
    rationale TEXT,
    target_area VARCHAR(255),
    target_segment VARCHAR(255),
    target_candidate VARCHAR(255),
    expected_impact VARCHAR(255),
    status VARCHAR(40) DEFAULT 'Proposed' CHECK (status IN ('Proposed','Accepted','Rejected','Implemented','Archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_by UUID,
    decided_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS war_room_kpi_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES war_room_sessions(session_id) ON DELETE CASCADE,
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    snapshot_label VARCHAR(160),
    total_interviews INTEGER DEFAULT 0,
    synced_interviews INTEGER DEFAULT 0,
    unsynced_interviews INTEGER DEFAULT 0,
    valid_interviews INTEGER DEFAULT 0,
    flagged_interviews INTEGER DEFAULT 0,
    rejected_interviews INTEGER DEFAULT 0,
    overall_awareness NUMERIC,
    overall_satisfaction NUMERIC,
    overall_trust NUMERIC,
    overall_preference NUMERIC,
    overall_tenacity NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS war_room_map_layers (
    layer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES war_room_sessions(session_id) ON DELETE CASCADE,
    layer_name VARCHAR(160) NOT NULL,
    layer_type VARCHAR(80) CHECK (layer_type IN ('Respondent Points','Enumerator Tracks','Strongholds','Weak Areas','Swing Areas','QC Alerts','Issue Hotspots','Custom')),
    geojson_data JSONB,
    style_json JSONB DEFAULT '{}'::jsonb,
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS war_room_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES war_room_sessions(session_id) ON DELETE CASCADE,
    report_title VARCHAR(255) NOT NULL,
    report_type VARCHAR(80) DEFAULT 'Executive Brief',
    report_json JSONB NOT NULL,
    generated_by UUID,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executive summary view placeholders. These are designed to connect to Module 3 analytics tables/views.
CREATE OR REPLACE VIEW vw_war_room_field_summary AS
SELECT
  COUNT(*) FILTER (WHERE deployment_status='Active') AS active_deployments,
  COUNT(*) AS total_deployments
FROM deployments;

CREATE OR REPLACE VIEW vw_war_room_alert_summary AS
SELECT severity, alert_status, COUNT(*) total
FROM war_room_alerts
GROUP BY severity, alert_status;
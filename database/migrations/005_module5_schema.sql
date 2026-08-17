CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS gis_boundary_levels (
    boundary_level_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_code VARCHAR(80) UNIQUE NOT NULL,
    level_name VARCHAR(160) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gis_boundaries (
    boundary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boundary_level_id UUID REFERENCES gis_boundary_levels(boundary_level_id),
    parent_boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    region VARCHAR(160),
    province VARCHAR(160),
    municipality VARCHAR(160),
    district VARCHAR(160),
    barangay VARCHAR(160),
    precinct_cluster VARCHAR(160),
    voting_center VARCHAR(255),
    boundary_name VARCHAR(255) NOT NULL,
    registered_voters INTEGER DEFAULT 0,
    population INTEGER DEFAULT 0,
    households INTEGER DEFAULT 0,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gis_boundaries_geom ON gis_boundaries USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_gis_boundaries_centroid ON gis_boundaries USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_gis_boundaries_name ON gis_boundaries(boundary_name);

CREATE TABLE IF NOT EXISTS respondent_gis_points (
    respondent_point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID,
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    deployment_id UUID,
    enumerator_id UUID,
    respondent_code VARCHAR(160),
    boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    gps_point GEOMETRY(POINT, 4326),
    gps_accuracy NUMERIC(12,2),
    interview_status VARCHAR(80),
    qc_status VARCHAR(80),
    submitted_at TIMESTAMP,
    metadata_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_respondent_gis_points_geom ON respondent_gis_points USING GIST(gps_point);
CREATE INDEX IF NOT EXISTS idx_respondent_gis_points_project ON respondent_gis_points(project_id);
CREATE INDEX IF NOT EXISTS idx_respondent_gis_points_wave ON respondent_gis_points(survey_wave_id);

CREATE TABLE IF NOT EXISTS enumerator_track_points (
    track_point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID,
    enumerator_id UUID,
    device_id UUID,
    gps_point GEOMETRY(POINT, 4326),
    gps_accuracy NUMERIC(12,2),
    activity_type VARCHAR(120),
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_enumerator_track_points_geom ON enumerator_track_points USING GIST(gps_point);
CREATE INDEX IF NOT EXISTS idx_enumerator_track_points_enum ON enumerator_track_points(enumerator_id);

CREATE TABLE IF NOT EXISTS gis_metric_snapshots (
    gis_metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    candidate_name VARCHAR(255),
    area_classification VARCHAR(80) CHECK (area_classification IN ('Stronghold','Weak Area','Swing Area','Battleground','Unknown')),
    awareness_pct NUMERIC,
    satisfaction_pct NUMERIC,
    trust_pct NUMERIC,
    preference_pct NUMERIC,
    tenacity_pct NUMERIC,
    issue_hotspot_score NUMERIC,
    qc_risk_score NUMERIC,
    field_completion_pct NUMERIC,
    predictive_vote_score NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gis_metric_boundary ON gis_metric_snapshots(boundary_id);
CREATE INDEX IF NOT EXISTS idx_gis_metric_project_wave ON gis_metric_snapshots(project_id, survey_wave_id);
CREATE INDEX IF NOT EXISTS idx_gis_metric_class ON gis_metric_snapshots(area_classification);

CREATE TABLE IF NOT EXISTS issue_hotspots (
    hotspot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    issue_name VARCHAR(255),
    hotspot_score NUMERIC,
    issue_frequency INTEGER DEFAULT 0,
    severity VARCHAR(40) CHECK (severity IN ('Low','Medium','High','Critical')) DEFAULT 'Low',
    geom GEOMETRY(MULTIPOLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_hotspots_geom ON issue_hotspots USING GIST(geom);

CREATE TABLE IF NOT EXISTS qc_hotspots (
    qc_hotspot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID,
    boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    enumerator_id UUID,
    qc_flag_type VARCHAR(160),
    qc_flag_count INTEGER DEFAULT 0,
    qc_risk_score NUMERIC,
    severity VARCHAR(40) CHECK (severity IN ('Low','Medium','High','Critical')) DEFAULT 'Low',
    geom GEOMETRY(MULTIPOLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qc_hotspots_geom ON qc_hotspots USING GIST(geom);

CREATE TABLE IF NOT EXISTS predictive_models (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_code VARCHAR(120) UNIQUE NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(120) DEFAULT 'Rule-Based',
    model_version VARCHAR(80) DEFAULT '1.0',
    features_json JSONB NOT NULL,
    weights_json JSONB NOT NULL,
    model_status VARCHAR(40) DEFAULT 'Active' CHECK (model_status IN ('Active','Inactive','Draft','Archived')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS predictive_scores (
    predictive_score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES predictive_models(model_id),
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    boundary_id UUID REFERENCES gis_boundaries(boundary_id),
    candidate_name VARCHAR(255),
    predicted_vote_share NUMERIC,
    confidence_score NUMERIC,
    swing_probability NUMERIC,
    risk_level VARCHAR(40) CHECK (risk_level IN ('Low','Medium','High','Critical')),
    explanation_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictive_scores_boundary ON predictive_scores(boundary_id);
CREATE INDEX IF NOT EXISTS idx_predictive_scores_project_wave ON predictive_scores(project_id, survey_wave_id);

CREATE TABLE IF NOT EXISTS gis_map_layers (
    layer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(120) CHECK (layer_type IN (
        'Boundary','Respondent Points','Enumerator Tracks','Strongholds',
        'Weak Areas','Swing Areas','Issue Hotspots','QC Hotspots','Predictive Scores','Custom'
    )),
    source_table VARCHAR(160),
    filter_json JSONB DEFAULT '{}'::jsonb,
    style_json JSONB DEFAULT '{}'::jsonb,
    visible BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW vw_gis_area_summary AS
SELECT
    b.boundary_id,
    b.boundary_name,
    b.region,
    b.province,
    b.municipality,
    b.barangay,
    COUNT(r.respondent_point_id) AS interview_count,
    AVG(r.gps_accuracy) AS avg_gps_accuracy
FROM gis_boundaries b
LEFT JOIN respondent_gis_points r ON b.boundary_id = r.boundary_id
GROUP BY b.boundary_id, b.boundary_name, b.region, b.province, b.municipality, b.barangay;

CREATE OR REPLACE VIEW vw_gis_predictive_summary AS
SELECT
    b.boundary_name,
    ps.candidate_name,
    ps.predicted_vote_share,
    ps.confidence_score,
    ps.swing_probability,
    ps.risk_level
FROM predictive_scores ps
JOIN gis_boundaries b ON ps.boundary_id = b.boundary_id;
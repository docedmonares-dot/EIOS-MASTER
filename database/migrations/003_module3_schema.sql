CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS survey_waves (
    wave_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_id UUID,
    wave_code VARCHAR(80) UNIQUE NOT NULL,
    wave_name VARCHAR(160) NOT NULL,
    survey_date DATE,
    status VARCHAR(40) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    candidate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    candidate_name VARCHAR(255) NOT NULL,
    position_sought VARCHAR(160),
    party_name VARCHAR(160),
    status VARCHAR(40) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_metric_snapshots (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    candidate_id UUID REFERENCES candidates(candidate_id),
    candidate_name VARCHAR(255),
    geo_level VARCHAR(80),
    geo_name VARCHAR(255),
    metric_name VARCHAR(120) NOT NULL,
    raw_count INTEGER DEFAULT 0,
    base_count INTEGER DEFAULT 0,
    metric_percent NUMERIC(8,2),
    margin_of_error NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wave_gain_loss (
    gain_loss_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    candidate_id UUID REFERENCES candidates(candidate_id),
    previous_wave_id UUID REFERENCES survey_waves(wave_id),
    current_wave_id UUID REFERENCES survey_waves(wave_id),
    metric_name VARCHAR(120) NOT NULL,
    previous_value NUMERIC(8,2),
    current_value NUMERIC(8,2),
    gain_loss NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vote_migration_matrix (
    migration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    previous_position VARCHAR(160),
    previous_candidate VARCHAR(255),
    current_position VARCHAR(160),
    current_candidate VARCHAR(255),
    respondent_count INTEGER DEFAULT 0,
    migration_percent NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS party_equity_metrics (
    party_equity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    party_name VARCHAR(255) NOT NULL,
    awareness_pct NUMERIC(8,2),
    trust_pct NUMERIC(8,2),
    preference_pct NUMERIC(8,2),
    loyalty_pct NUMERIC(8,2),
    switching_risk_pct NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sentimental_vote_metrics (
    sentimental_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    reference_position VARCHAR(160),
    reference_candidate VARCHAR(255),
    correlated_position VARCHAR(160),
    correlated_candidate VARCHAR(255),
    transfer_rate_pct NUMERIC(8,2),
    respondent_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_ownership_metrics (
    issue_ownership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    issue_name VARCHAR(255) NOT NULL,
    candidate_id UUID REFERENCES candidates(candidate_id),
    candidate_name VARCHAR(255),
    ownership_count INTEGER DEFAULT 0,
    ownership_pct NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_benchmarking_metrics (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    candidate_id UUID REFERENCES candidates(candidate_id),
    candidate_name VARCHAR(255),
    desired_position VARCHAR(160),
    support_count INTEGER DEFAULT 0,
    support_pct NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS winnability_scores (
    winnability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    candidate_id UUID REFERENCES candidates(candidate_id),
    candidate_name VARCHAR(255),
    awareness_score NUMERIC(8,2),
    satisfaction_score NUMERIC(8,2),
    trust_score NUMERIC(8,2),
    preference_score NUMERIC(8,2),
    tenacity_score NUMERIC(8,2),
    political_equity_score NUMERIC(8,2),
    winnability_class VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demographic_crosstabs (
    crosstab_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    candidate_id UUID REFERENCES candidates(candidate_id),
    variable_name VARCHAR(160),
    variable_value VARCHAR(255),
    metric_name VARCHAR(120),
    raw_count INTEGER DEFAULT 0,
    base_count INTEGER DEFAULT 0,
    metric_percent NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_jobs (
    analytics_job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    wave_id UUID REFERENCES survey_waves(wave_id),
    job_type VARCHAR(160),
    job_status VARCHAR(40) DEFAULT 'Queued',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metric_snapshots_wave ON analytics_metric_snapshots(wave_id);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_candidate ON analytics_metric_snapshots(candidate_id);
CREATE INDEX IF NOT EXISTS idx_gain_loss_candidate ON wave_gain_loss(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vote_migration_wave ON vote_migration_matrix(wave_id);
CREATE INDEX IF NOT EXISTS idx_issue_ownership_wave ON issue_ownership_metrics(wave_id);
CREATE INDEX IF NOT EXISTS idx_winnability_wave ON winnability_scores(wave_id);

CREATE OR REPLACE VIEW vw_candidate_latest_metrics AS
SELECT candidate_name, metric_name, metric_percent, wave_id, created_at
FROM analytics_metric_snapshots
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW vw_winnability_leaderboard AS
SELECT candidate_name, political_equity_score, winnability_class, wave_id, created_at
FROM winnability_scores
ORDER BY political_equity_score DESC;
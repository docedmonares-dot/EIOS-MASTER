CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS strategy_sessions (
    strategy_session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    session_name VARCHAR(255) NOT NULL,
    strategy_scope VARCHAR(120),
    status VARCHAR(40) DEFAULT 'Active',
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_objectives (
    objective_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    objective_type VARCHAR(120) NOT NULL,
    objective_title VARCHAR(255) NOT NULL,
    objective_description TEXT,
    target_candidate VARCHAR(255),
    target_area VARCHAR(255),
    target_segment VARCHAR(255),
    priority VARCHAR(40) DEFAULT 'Medium',
    status VARCHAR(40) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_recommendations (
    strategy_recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    recommendation_type VARCHAR(120) NOT NULL,
    priority VARCHAR(40) DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
    title VARCHAR(255) NOT NULL,
    recommendation_text TEXT NOT NULL,
    rationale TEXT,
    evidence_json JSONB DEFAULT '{}'::jsonb,
    target_area VARCHAR(255),
    target_segment VARCHAR(255),
    target_candidate VARCHAR(255),
    recommended_action VARCHAR(255),
    expected_impact VARCHAR(255),
    implementation_status VARCHAR(40) DEFAULT 'Proposed' CHECK (implementation_status IN ('Proposed','Accepted','Rejected','Implemented','Archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_by UUID,
    decided_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_tests (
    message_test_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    message_title VARCHAR(255) NOT NULL,
    message_theme VARCHAR(160),
    message_text TEXT NOT NULL,
    target_candidate VARCHAR(255),
    target_issue VARCHAR(255),
    target_segment VARCHAR(255),
    test_score NUMERIC,
    clarity_score NUMERIC,
    emotional_score NUMERIC,
    credibility_score NUMERIC,
    persuasion_score NUMERIC,
    risk_score NUMERIC,
    status VARCHAR(40) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS persuasion_targets (
    persuasion_target_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    client_id UUID,
    project_id UUID,
    survey_wave_id UUID,
    boundary_id UUID,
    area_name VARCHAR(255),
    target_segment VARCHAR(255),
    target_candidate VARCHAR(255),
    voter_type VARCHAR(120),
    persuasion_priority VARCHAR(40) DEFAULT 'Medium',
    estimated_votes INTEGER,
    persuasion_score NUMERIC,
    recommended_message TEXT,
    recommended_channel VARCHAR(160),
    recommended_field_action VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_allocation_plans (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    target_area VARCHAR(255),
    target_segment VARCHAR(255),
    target_candidate VARCHAR(255),
    resource_type VARCHAR(120),
    recommended_quantity NUMERIC,
    priority VARCHAR(40) DEFAULT 'Medium',
    rationale TEXT,
    status VARCHAR(40) DEFAULT 'Proposed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_risk_register (
    risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    risk_type VARCHAR(160),
    risk_title VARCHAR(255),
    risk_description TEXT,
    affected_area VARCHAR(255),
    affected_candidate VARCHAR(255),
    risk_level VARCHAR(40) CHECK (risk_level IN ('Low','Medium','High','Critical')),
    probability NUMERIC,
    impact NUMERIC,
    mitigation TEXT,
    status VARCHAR(40) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_campaign_memos (
    memo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    memo_title VARCHAR(255) NOT NULL,
    memo_type VARCHAR(120) DEFAULT 'Strategy Memo',
    memo_json JSONB NOT NULL,
    memo_text TEXT,
    generated_by UUID,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strategy_action_tracker (
    action_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_session_id UUID REFERENCES strategy_sessions(strategy_session_id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES strategy_recommendations(strategy_recommendation_id),
    action_title VARCHAR(255) NOT NULL,
    action_owner VARCHAR(255),
    target_area VARCHAR(255),
    due_date DATE,
    action_status VARCHAR(40) DEFAULT 'Pending' CHECK (action_status IN ('Pending','In Progress','Done','Cancelled')),
    progress_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW vw_strategy_priority_summary AS
SELECT priority, implementation_status, COUNT(*) total
FROM strategy_recommendations
GROUP BY priority, implementation_status;

CREATE OR REPLACE VIEW vw_persuasion_target_summary AS
SELECT 
    area_name AS target_area,
    target_segment,
    persuasion_priority,
    SUM(estimated_votes) AS estimated_votes,
    AVG(persuasion_score) AS avg_score
FROM persuasion_targets
GROUP BY area_name, target_segment, persuasion_priority;
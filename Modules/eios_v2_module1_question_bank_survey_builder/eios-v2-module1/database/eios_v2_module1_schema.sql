CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS question_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code VARCHAR(80) UNIQUE NOT NULL,
    category_name VARCHAR(160) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_bank (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_code VARCHAR(120) UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(80) NOT NULL,
    question_group VARCHAR(160),
    question_module VARCHAR(160),
    question_category_id UUID REFERENCES question_categories(category_id),
    question_description TEXT,
    question_status VARCHAR(40) DEFAULT 'Draft' CHECK (question_status IN ('Active','Inactive','Draft','Archived')),
    required_flag BOOLEAN DEFAULT FALSE,
    version_number INTEGER DEFAULT 1,
    options_json JSONB DEFAULT '[]'::jsonb,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_versions (
    question_version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES question_bank(question_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    question_snapshot JSONB NOT NULL,
    change_log TEXT,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, version_number)
);

CREATE TABLE IF NOT EXISTS question_logic (
    logic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES question_bank(question_id) ON DELETE CASCADE,
    logic_name VARCHAR(180),
    condition_json JSONB NOT NULL,
    action_json JSONB NOT NULL,
    affected_questions_json JSONB DEFAULT '[]'::jsonb,
    logic_status VARCHAR(40) DEFAULT 'Active' CHECK (logic_status IN ('Active','Inactive','Draft','Archived')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
    survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_code VARCHAR(120) UNIQUE NOT NULL,
    survey_name VARCHAR(255) NOT NULL,
    client_id UUID,
    project_id UUID,
    wave_id UUID,
    election_type VARCHAR(120),
    geographic_scope VARCHAR(255),
    description TEXT,
    status VARCHAR(40) DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Published','Inactive','Archived')),
    current_version_number INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_sections (
    section_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
    section_code VARCHAR(120),
    section_title VARCHAR(255) NOT NULL,
    section_description TEXT,
    page_number INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS survey_questions (
    survey_question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
    section_id UUID REFERENCES survey_sections(section_id) ON DELETE SET NULL,
    question_id UUID NOT NULL REFERENCES question_bank(question_id),
    page_number INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    required_override BOOLEAN,
    question_label_override TEXT,
    settings_json JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(survey_id, question_id)
);

CREATE TABLE IF NOT EXISTS survey_logic (
    survey_logic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
    source_question_id UUID REFERENCES question_bank(question_id),
    condition_json JSONB NOT NULL,
    action_json JSONB NOT NULL,
    affected_questions_json JSONB DEFAULT '[]'::jsonb,
    logic_status VARCHAR(40) DEFAULT 'Active' CHECK (logic_status IN ('Active','Inactive','Draft','Archived')),
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_versions (
    survey_version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_label VARCHAR(120),
    survey_snapshot JSONB NOT NULL,
    question_snapshot JSONB NOT NULL,
    logic_snapshot JSONB NOT NULL,
    published_by UUID,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publish_notes TEXT,
    is_active_version BOOLEAN DEFAULT TRUE,
    UNIQUE(survey_id, version_number)
);

CREATE TABLE IF NOT EXISTS survey_deployments (
    deployment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id),
    survey_version_id UUID NOT NULL REFERENCES survey_versions(survey_version_id),
    deployment_package JSONB NOT NULL,
    deployment_status VARCHAR(40) DEFAULT 'Ready' CHECK (deployment_status IN ('Ready','Deployed','Paused','Closed','Archived')),
    deployed_by UUID,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_builder_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    action VARCHAR(120) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    performed_by UUID,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_question_bank_status ON question_bank(question_status);
CREATE INDEX IF NOT EXISTS idx_question_bank_module ON question_bank(question_module);
CREATE INDEX IF NOT EXISTS idx_question_logic_question ON question_logic(question_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_survey_questions_sort ON survey_questions(survey_id, page_number, sort_order);
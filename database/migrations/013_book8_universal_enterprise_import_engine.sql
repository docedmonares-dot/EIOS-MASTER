BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   IMPORT TEMPLATES
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_import_templates (
    import_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    template_code VARCHAR(120) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    target_module VARCHAR(120) NOT NULL,
    target_entity VARCHAR(120) NOT NULL,

    accepted_file_types JSONB NOT NULL
        DEFAULT '["csv","xlsx","json"]'::jsonb,

    field_mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    transformation_rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    duplicate_strategy VARCHAR(30) NOT NULL DEFAULT 'Reject',
    error_strategy VARCHAR(30) NOT NULL DEFAULT 'Continue',

    is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_import_templates_duplicate_strategy_check
        CHECK (
            duplicate_strategy IN (
                'Reject',
                'Skip',
                'Update',
                'Replace'
            )
        ),

    CONSTRAINT enterprise_import_templates_error_strategy_check
        CHECK (
            error_strategy IN (
                'Stop',
                'Continue'
            )
        )
);

/* =========================================================
   IMPORT JOBS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_import_jobs (
    import_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    import_template_id UUID
        REFERENCES enterprise_import_templates(import_template_id)
        ON DELETE SET NULL,

    organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE SET NULL,

    requested_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    job_name VARCHAR(200) NOT NULL,
    source_file_name VARCHAR(255),
    source_file_type VARCHAR(30),
    source_file_path TEXT,

    target_module VARCHAR(120) NOT NULL,
    target_entity VARCHAR(120) NOT NULL,

    job_status VARCHAR(30) NOT NULL DEFAULT 'Queued',
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,

    total_records INTEGER NOT NULL DEFAULT 0,
    processed_records INTEGER NOT NULL DEFAULT 0,
    successful_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    skipped_records INTEGER NOT NULL DEFAULT 0,
    duplicate_records INTEGER NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    rollback_supported BOOLEAN NOT NULL DEFAULT TRUE,
    rollback_status VARCHAR(30),
    rolled_back_at TIMESTAMPTZ,
    rolled_back_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_import_jobs_status_check
        CHECK (
            job_status IN (
                'Queued',
                'Validating',
                'Ready',
                'Processing',
                'Completed',
                'Completed With Errors',
                'Failed',
                'Cancelled',
                'Rolled Back'
            )
        ),

    CONSTRAINT enterprise_import_jobs_progress_check
        CHECK (
            progress_percentage BETWEEN 0 AND 100
        ),

    CONSTRAINT enterprise_import_jobs_rollback_status_check
        CHECK (
            rollback_status IS NULL
            OR rollback_status IN (
                'Available',
                'Processing',
                'Completed',
                'Failed',
                'Unavailable'
            )
        )
);

/* =========================================================
   IMPORT RECORD STAGING
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_import_records (
    import_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    import_job_id UUID NOT NULL
        REFERENCES enterprise_import_jobs(import_job_id)
        ON DELETE CASCADE,

    row_number INTEGER NOT NULL,

    source_record_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    mapped_record_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    transformed_record_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    validation_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    processing_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    target_record_id UUID,

    duplicate_key VARCHAR(250),
    validation_errors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    processing_errors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings_json JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    CONSTRAINT enterprise_import_records_unique_row
        UNIQUE (import_job_id, row_number),

    CONSTRAINT enterprise_import_records_validation_status_check
        CHECK (
            validation_status IN (
                'Pending',
                'Valid',
                'Invalid',
                'Warning'
            )
        ),

    CONSTRAINT enterprise_import_records_processing_status_check
        CHECK (
            processing_status IN (
                'Pending',
                'Inserted',
                'Updated',
                'Skipped',
                'Duplicate',
                'Failed',
                'Rolled Back'
            )
        )
);

/* =========================================================
   IMPORT JOB EVENTS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_import_job_events (
    import_job_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    import_job_id UUID NOT NULL
        REFERENCES enterprise_import_jobs(import_job_id)
        ON DELETE CASCADE,

    event_type VARCHAR(80) NOT NULL,
    event_message TEXT,
    event_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* =========================================================
   IMPORT ROLLBACK LOG
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_import_rollback_log (
    rollback_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    import_job_id UUID NOT NULL
        REFERENCES enterprise_import_jobs(import_job_id)
        ON DELETE CASCADE,

    import_record_id UUID
        REFERENCES enterprise_import_records(import_record_id)
        ON DELETE SET NULL,

    target_entity VARCHAR(120) NOT NULL,
    target_record_id UUID,

    rollback_action VARCHAR(30) NOT NULL,
    rollback_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    rollback_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT enterprise_import_rollback_action_check
        CHECK (
            rollback_action IN (
                'Delete Inserted Record',
                'Restore Updated Record'
            )
        ),

    CONSTRAINT enterprise_import_rollback_status_check
        CHECK (
            rollback_status IN (
                'Pending',
                'Completed',
                'Failed'
            )
        )
);

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_import_templates_module
    ON enterprise_import_templates(target_module);

CREATE INDEX IF NOT EXISTS idx_import_templates_entity
    ON enterprise_import_templates(target_entity);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status
    ON enterprise_import_jobs(job_status);

CREATE INDEX IF NOT EXISTS idx_import_jobs_requested_by
    ON enterprise_import_jobs(requested_by);

CREATE INDEX IF NOT EXISTS idx_import_jobs_organization
    ON enterprise_import_jobs(organization_id);

CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at
    ON enterprise_import_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_records_job
    ON enterprise_import_records(import_job_id);

CREATE INDEX IF NOT EXISTS idx_import_records_validation
    ON enterprise_import_records(validation_status);

CREATE INDEX IF NOT EXISTS idx_import_records_processing
    ON enterprise_import_records(processing_status);

CREATE INDEX IF NOT EXISTS idx_import_job_events_job
    ON enterprise_import_job_events(import_job_id);

CREATE INDEX IF NOT EXISTS idx_import_job_events_created_at
    ON enterprise_import_job_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_rollback_job
    ON enterprise_import_rollback_log(import_job_id);

/* =========================================================
   INITIAL PSGC IMPORT TEMPLATE
========================================================= */

INSERT INTO enterprise_import_templates (
    template_code,
    template_name,
    target_module,
    target_entity,
    accepted_file_types,
    field_mapping_json,
    validation_rules_json,
    transformation_rules_json,
    duplicate_strategy,
    error_strategy,
    is_system_template,
    is_active
)
VALUES (
    'PGIE_PSGC_IMPORT',
    'Philippine Standard Geographic Code Import',
    'PGIE',
    'geo_units',
    '["csv","xlsx","json"]'::jsonb,
    '{
        "psgc_code": "official_code",
        "name": "unit_name",
        "geographic_level": "classification",
        "parent_code": "parent_official_code"
    }'::jsonb,
    '{
        "required_fields": [
            "psgc_code",
            "name",
            "geographic_level"
        ],
        "unique_fields": [
            "psgc_code"
        ]
    }'::jsonb,
    '{
        "trim_strings": true,
        "uppercase_codes": true
    }'::jsonb,
    'Update',
    'Continue',
    TRUE,
    TRUE
)
ON CONFLICT (template_code) DO NOTHING;

COMMIT;
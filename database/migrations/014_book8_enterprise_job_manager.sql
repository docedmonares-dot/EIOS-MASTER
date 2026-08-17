BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   ENTERPRISE JOB TYPES
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_types (
    job_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_type_code VARCHAR(120) NOT NULL UNIQUE,
    job_type_name VARCHAR(200) NOT NULL,
    job_category VARCHAR(100) NOT NULL,

    description TEXT,

    default_priority INTEGER NOT NULL DEFAULT 50,
    default_max_attempts INTEGER NOT NULL DEFAULT 3,
    default_timeout_seconds INTEGER,
    supports_progress BOOLEAN NOT NULL DEFAULT TRUE,
    supports_cancellation BOOLEAN NOT NULL DEFAULT TRUE,
    supports_retry BOOLEAN NOT NULL DEFAULT TRUE,

    handler_name VARCHAR(200),
    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_system_type BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_types_priority_check
        CHECK (default_priority BETWEEN 1 AND 100),

    CONSTRAINT enterprise_job_types_attempts_check
        CHECK (default_max_attempts >= 1),

    CONSTRAINT enterprise_job_types_timeout_check
        CHECK (
            default_timeout_seconds IS NULL
            OR default_timeout_seconds >= 1
        )
);

/* =========================================================
   ENTERPRISE JOB QUEUE
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_jobs (
    enterprise_job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_type_id UUID NOT NULL
        REFERENCES enterprise_job_types(job_type_id)
        ON DELETE RESTRICT,

    organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE SET NULL,

    requested_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    parent_job_id UUID
        REFERENCES enterprise_jobs(enterprise_job_id)
        ON DELETE SET NULL,

    correlation_id UUID,
    external_reference VARCHAR(200),

    job_name VARCHAR(250) NOT NULL,
    job_description TEXT,

    job_status VARCHAR(40) NOT NULL DEFAULT 'Queued',
    priority INTEGER NOT NULL DEFAULT 50,

    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    progress_message TEXT,

    current_attempt INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,

    scheduled_for TIMESTAMPTZ,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    timeout_seconds INTEGER,

    input_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    error_code VARCHAR(120),
    error_message TEXT,
    error_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    worker_id VARCHAR(150),
    queue_name VARCHAR(120) NOT NULL DEFAULT 'default',

    cancellation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_jobs_status_check
        CHECK (
            job_status IN (
                'Queued',
                'Scheduled',
                'Waiting',
                'Claimed',
                'Validating',
                'Processing',
                'Retrying',
                'Completed',
                'Completed With Errors',
                'Failed',
                'Cancelled',
                'Timed Out',
                'Archived'
            )
        ),

    CONSTRAINT enterprise_jobs_priority_check
        CHECK (priority BETWEEN 1 AND 100),

    CONSTRAINT enterprise_jobs_progress_check
        CHECK (progress_percentage BETWEEN 0 AND 100),

    CONSTRAINT enterprise_jobs_attempts_check
        CHECK (
            current_attempt >= 0
            AND max_attempts >= 1
            AND current_attempt <= max_attempts
        ),

    CONSTRAINT enterprise_jobs_timeout_check
        CHECK (
            timeout_seconds IS NULL
            OR timeout_seconds >= 1
        )
);

/* =========================================================
   ENTERPRISE JOB ATTEMPTS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_attempts (
    job_attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enterprise_job_id UUID NOT NULL
        REFERENCES enterprise_jobs(enterprise_job_id)
        ON DELETE CASCADE,

    attempt_number INTEGER NOT NULL,

    worker_id VARCHAR(150),
    attempt_status VARCHAR(40) NOT NULL DEFAULT 'Started',

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    heartbeat_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    duration_milliseconds BIGINT,

    input_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    error_code VARCHAR(120),
    error_message TEXT,
    error_details_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_attempts_unique
        UNIQUE (enterprise_job_id, attempt_number),

    CONSTRAINT enterprise_job_attempts_status_check
        CHECK (
            attempt_status IN (
                'Started',
                'Processing',
                'Completed',
                'Failed',
                'Cancelled',
                'Timed Out'
            )
        ),

    CONSTRAINT enterprise_job_attempts_number_check
        CHECK (attempt_number >= 1)
);

/* =========================================================
   ENTERPRISE JOB EVENTS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_events (
    enterprise_job_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enterprise_job_id UUID NOT NULL
        REFERENCES enterprise_jobs(enterprise_job_id)
        ON DELETE CASCADE,

    event_type VARCHAR(120) NOT NULL,
    event_level VARCHAR(30) NOT NULL DEFAULT 'Information',

    event_message TEXT,
    event_data_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_events_level_check
        CHECK (
            event_level IN (
                'Debug',
                'Information',
                'Warning',
                'Error',
                'Critical'
            )
        )
);

/* =========================================================
   ENTERPRISE JOB DEPENDENCIES
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_dependencies (
    job_dependency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enterprise_job_id UUID NOT NULL
        REFERENCES enterprise_jobs(enterprise_job_id)
        ON DELETE CASCADE,

    depends_on_job_id UUID NOT NULL
        REFERENCES enterprise_jobs(enterprise_job_id)
        ON DELETE CASCADE,

    dependency_type VARCHAR(40) NOT NULL DEFAULT 'Must Complete',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_dependencies_unique
        UNIQUE (
            enterprise_job_id,
            depends_on_job_id
        ),

    CONSTRAINT enterprise_job_dependencies_self_check
        CHECK (
            enterprise_job_id <> depends_on_job_id
        ),

    CONSTRAINT enterprise_job_dependencies_type_check
        CHECK (
            dependency_type IN (
                'Must Complete',
                'Must Succeed',
                'Must Fail',
                'Optional'
            )
        )
);

/* =========================================================
   ENTERPRISE WORKERS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_workers (
    worker_id VARCHAR(150) PRIMARY KEY,

    worker_name VARCHAR(200),
    queue_name VARCHAR(120) NOT NULL DEFAULT 'default',

    worker_status VARCHAR(40) NOT NULL DEFAULT 'Offline',

    hostname VARCHAR(200),
    process_id INTEGER,
    application_version VARCHAR(80),

    concurrent_capacity INTEGER NOT NULL DEFAULT 1,
    active_job_count INTEGER NOT NULL DEFAULT 0,

    capabilities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    last_heartbeat_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_workers_status_check
        CHECK (
            worker_status IN (
                'Online',
                'Busy',
                'Paused',
                'Offline',
                'Unhealthy'
            )
        ),

    CONSTRAINT enterprise_job_workers_capacity_check
        CHECK (
            concurrent_capacity >= 1
            AND active_job_count >= 0
        )
);

/* =========================================================
   SCHEDULED JOB DEFINITIONS
========================================================= */

CREATE TABLE IF NOT EXISTS enterprise_job_schedules (
    job_schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_type_id UUID NOT NULL
        REFERENCES enterprise_job_types(job_type_id)
        ON DELETE RESTRICT,

    organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE,

    schedule_code VARCHAR(120) NOT NULL,
    schedule_name VARCHAR(200) NOT NULL,

    cron_expression VARCHAR(120),
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Manila',

    input_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    priority INTEGER NOT NULL DEFAULT 50,
    max_attempts INTEGER NOT NULL DEFAULT 3,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT enterprise_job_schedules_unique
        UNIQUE (
            organization_id,
            schedule_code
        ),

    CONSTRAINT enterprise_job_schedules_priority_check
        CHECK (priority BETWEEN 1 AND 100),

    CONSTRAINT enterprise_job_schedules_attempts_check
        CHECK (max_attempts >= 1)
);

/* =========================================================
   LINK IMPORT JOBS TO ENTERPRISE JOBS
========================================================= */

ALTER TABLE enterprise_import_jobs
    ADD COLUMN IF NOT EXISTS enterprise_job_id UUID;

ALTER TABLE enterprise_import_jobs
    DROP CONSTRAINT IF EXISTS enterprise_import_jobs_enterprise_job_fk;

ALTER TABLE enterprise_import_jobs
    ADD CONSTRAINT enterprise_import_jobs_enterprise_job_fk
    FOREIGN KEY (enterprise_job_id)
    REFERENCES enterprise_jobs(enterprise_job_id)
    ON DELETE SET NULL;

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_enterprise_job_types_category
    ON enterprise_job_types(job_category);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_types_active
    ON enterprise_job_types(is_active);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_status
    ON enterprise_jobs(job_status);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_queue
    ON enterprise_jobs(queue_name);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_priority
    ON enterprise_jobs(priority DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_scheduled
    ON enterprise_jobs(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_requested_by
    ON enterprise_jobs(requested_by);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_organization
    ON enterprise_jobs(organization_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_parent
    ON enterprise_jobs(parent_job_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_correlation
    ON enterprise_jobs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_jobs_created_at
    ON enterprise_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_attempts_job
    ON enterprise_job_attempts(enterprise_job_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_events_job
    ON enterprise_job_events(enterprise_job_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_events_created_at
    ON enterprise_job_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_dependencies_job
    ON enterprise_job_dependencies(enterprise_job_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_dependencies_parent
    ON enterprise_job_dependencies(depends_on_job_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_workers_status
    ON enterprise_job_workers(worker_status);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_workers_queue
    ON enterprise_job_workers(queue_name);

CREATE INDEX IF NOT EXISTS idx_enterprise_job_schedules_next_run
    ON enterprise_job_schedules(next_run_at);

CREATE INDEX IF NOT EXISTS idx_enterprise_import_jobs_enterprise_job
    ON enterprise_import_jobs(enterprise_job_id);

/* =========================================================
   SYSTEM JOB TYPES
========================================================= */

INSERT INTO enterprise_job_types (
    job_type_code,
    job_type_name,
    job_category,
    description,
    default_priority,
    default_max_attempts,
    default_timeout_seconds,
    supports_progress,
    supports_cancellation,
    supports_retry,
    handler_name,
    is_system_type,
    is_active
)
VALUES
    (
        'ENTERPRISE_IMPORT',
        'Enterprise Data Import',
        'Import',
        'Processes validated enterprise data imports through the Universal Enterprise Import Engine.',
        60,
        3,
        7200,
        TRUE,
        TRUE,
        TRUE,
        'enterpriseImportHandler',
        TRUE,
        TRUE
    ),
    (
        'ENTERPRISE_EXPORT',
        'Enterprise Data Export',
        'Export',
        'Generates enterprise datasets and downloadable exports.',
        50,
        3,
        7200,
        TRUE,
        TRUE,
        TRUE,
        'enterpriseExportHandler',
        TRUE,
        TRUE
    ),
    (
        'REPORT_GENERATION',
        'Report Generation',
        'Report',
        'Generates operational, analytical, and executive reports.',
        55,
        3,
        3600,
        TRUE,
        TRUE,
        TRUE,
        'reportGenerationHandler',
        TRUE,
        TRUE
    ),
    (
        'ANALYTICS_REBUILD',
        'Analytics Rebuild',
        'Analytics',
        'Recalculates enterprise indicators, aggregates, and dashboard KPIs.',
        65,
        3,
        7200,
        TRUE,
        TRUE,
        TRUE,
        'analyticsRebuildHandler',
        TRUE,
        TRUE
    ),
    (
        'AI_PROCESSING',
        'AI Processing',
        'Artificial Intelligence',
        'Executes AI analysis, recommendations, classifications, and model processing.',
        70,
        3,
        10800,
        TRUE,
        TRUE,
        TRUE,
        'aiProcessingHandler',
        TRUE,
        TRUE
    ),
    (
        'DATABASE_BACKUP',
        'Database Backup',
        'Backup',
        'Creates and verifies an enterprise database backup.',
        80,
        2,
        14400,
        TRUE,
        FALSE,
        TRUE,
        'databaseBackupHandler',
        TRUE,
        TRUE
    ),
    (
        'OFFLINE_SYNC_REPAIR',
        'Offline Synchronization Repair',
        'Synchronization',
        'Retries, validates, and repairs failed or incomplete offline synchronization records.',
        75,
        5,
        7200,
        TRUE,
        TRUE,
        TRUE,
        'offlineSyncRepairHandler',
        TRUE,
        TRUE
    ),
    (
        'NOTIFICATION_DELIVERY',
        'Notification Delivery',
        'Notification',
        'Delivers queued email, SMS, push, and in-platform notifications.',
        40,
        5,
        1800,
        TRUE,
        TRUE,
        TRUE,
        'notificationDeliveryHandler',
        TRUE,
        TRUE
    )
ON CONFLICT (job_type_code) DO NOTHING;

COMMIT;
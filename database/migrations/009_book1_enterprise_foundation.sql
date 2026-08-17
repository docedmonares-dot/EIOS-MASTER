BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS enterprise_profile (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name VARCHAR(200) NOT NULL,
    organization_short_name VARCHAR(80),
    platform_name VARCHAR(200) NOT NULL DEFAULT 'Enterprise Intelligence and Operations System',
    platform_short_name VARCHAR(50) NOT NULL DEFAULT 'EIOS',
    mission TEXT,
    vision TEXT,
    official_tagline VARCHAR(250),
    country_code CHAR(2) NOT NULL DEFAULT 'PH',
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Manila',
    default_language VARCHAR(20) NOT NULL DEFAULT 'English',
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_profile_status_check
        CHECK (status IN ('Active', 'Inactive', 'Archived'))
);

CREATE TABLE IF NOT EXISTS enterprise_principles (
    principle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principle_code VARCHAR(80) NOT NULL UNIQUE,
    principle_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_system_principle BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(150) NOT NULL UNIQUE,
    setting_group VARCHAR(100) NOT NULL,
    setting_label VARCHAR(200) NOT NULL,
    setting_description TEXT,
    value_type VARCHAR(30) NOT NULL,
    setting_value TEXT,
    default_value TEXT,
    allowed_values JSONB,
    validation_rules JSONB,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT enterprise_settings_value_type_check
        CHECK (
            value_type IN (
                'string',
                'integer',
                'decimal',
                'boolean',
                'date',
                'datetime',
                'json'
            )
        )
);

CREATE TABLE IF NOT EXISTS enterprise_setting_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID NOT NULL
        REFERENCES enterprise_settings(setting_id)
        ON DELETE CASCADE,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_settings_group
    ON enterprise_settings(setting_group);

CREATE INDEX IF NOT EXISTS idx_enterprise_settings_active
    ON enterprise_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_enterprise_setting_history_setting
    ON enterprise_setting_history(setting_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_setting_history_changed_at
    ON enterprise_setting_history(changed_at DESC);

INSERT INTO enterprise_principles (
    principle_code,
    principle_name,
    description,
    display_order
)
VALUES
    (
        'ONE_SYSTEM',
        'One System',
        'All EIOS capabilities operate as modules of one unified enterprise platform.',
        1
    ),
    (
        'ONE_DATABASE',
        'One Database',
        'All authorized modules use shared enterprise master data and operational records.',
        2
    ),
    (
        'ONE_DASHBOARD',
        'One Dashboard',
        'The Executive Command Center is the unified operational view of the enterprise.',
        3
    ),
    (
        'ONE_TRUTH',
        'One Truth',
        'Operational decisions shall be based on validated and traceable enterprise data.',
        4
    ),
    (
        'CONFIGURABLE',
        'Administrator Configurable',
        'Business rules that may change shall be maintained through system settings instead of source-code changes.',
        5
    ),
    (
        'OFFLINE_FIRST',
        'Offline First',
        'Field operations shall remain functional during unstable or unavailable connectivity.',
        6
    ),
    (
        'REAL_TIME',
        'Real-Time Operations',
        'Operational events and authorized intelligence shall update monitoring views as quickly as practicable.',
        7
    ),
    (
        'AUDITABLE',
        'Auditable',
        'Material system actions and configuration changes shall be traceable.',
        8
    )
ON CONFLICT (principle_code) DO NOTHING;

INSERT INTO enterprise_settings (
    setting_key,
    setting_group,
    setting_label,
    setting_description,
    value_type,
    setting_value,
    default_value,
    validation_rules
)
VALUES
    (
        'field.supervisor_max_enumerators',
        'Field Operations',
        'Maximum Enumerators per Supervisor',
        'Default maximum number of enumerators assigned to one supervisor.',
        'integer',
        '10',
        '10',
        '{"minimum":1}'::jsonb
    ),
    (
        'field.enumerator_minimum_respondents',
        'Field Operations',
        'Minimum Respondents per Enumerator',
        'Default minimum respondent target assigned to one enumerator.',
        'integer',
        '30',
        '30',
        '{"minimum":1}'::jsonb
    ),
    (
        'gps.tracking_enabled',
        'GPS',
        'GPS Tracking Enabled',
        'Controls whether live GPS tracking is enabled by default for field operations.',
        'boolean',
        'true',
        'true',
        NULL
    ),
    (
        'gps.offline_threshold_seconds',
        'GPS',
        'Offline Threshold in Seconds',
        'Number of seconds without a valid update before tracked personnel are marked offline.',
        'integer',
        '60',
        '60',
        '{"minimum":10}'::jsonb
    ),
    (
        'sync.automatic_sync_enabled',
        'Synchronization',
        'Automatic Synchronization Enabled',
        'Controls whether field records automatically synchronize when connectivity is restored.',
        'boolean',
        'true',
        'true',
        NULL
    ),
    (
        'platform.default_timezone',
        'Platform',
        'Default Time Zone',
        'Default time zone used by EIOS.',
        'string',
        'Asia/Manila',
        'Asia/Manila',
        NULL
    )
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;
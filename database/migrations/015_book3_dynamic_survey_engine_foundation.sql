BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   SURVEY COVERAGE LEVEL MASTER

   These records are administrator-managed master data.
   The Survey Engine must read these definitions instead
   of hard-coding geographic survey levels in the frontend.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_coverage_levels (
    coverage_level_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    coverage_code VARCHAR(100) NOT NULL UNIQUE,
    coverage_name VARCHAR(180) NOT NULL,
    description TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    root_geo_type_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    selectable_geo_type_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    respondent_source_geo_type_codes JSONB
        NOT NULL DEFAULT '[]'::jsonb,

    requires_stratification BOOLEAN NOT NULL DEFAULT FALSE,
    allows_multiple_root_units BOOLEAN NOT NULL DEFAULT FALSE,
    allows_operational_subareas BOOLEAN NOT NULL DEFAULT TRUE,

    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_system_level BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* =========================================================
   EXTEND THE EXISTING SURVEYS TABLE
========================================================= */

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS coverage_level_id UUID;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS survey_purpose VARCHAR(180);

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS research_objectives TEXT;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS target_population TEXT;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS unit_of_analysis VARCHAR(150);

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS methodology_summary TEXT;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS planned_start_date DATE;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS planned_end_date DATE;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS actual_start_date DATE;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS actual_end_date DATE;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS project_owner_user_id UUID;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS is_multi_instrument BOOLEAN
        NOT NULL DEFAULT FALSE;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS configuration_json JSONB
        NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS publication_status VARCHAR(40)
        NOT NULL DEFAULT 'Draft';

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS published_by UUID;

/* =========================================================
   ADD FOREIGN KEYS SAFELY
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'surveys_organization_id_fkey'
    ) THEN
        ALTER TABLE surveys
            ADD CONSTRAINT surveys_organization_id_fkey
            FOREIGN KEY (organization_id)
            REFERENCES organizations(organization_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'surveys_coverage_level_id_fkey'
    ) THEN
        ALTER TABLE surveys
            ADD CONSTRAINT surveys_coverage_level_id_fkey
            FOREIGN KEY (coverage_level_id)
            REFERENCES survey_coverage_levels(coverage_level_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'surveys_project_owner_user_id_fkey'
    ) THEN
        ALTER TABLE surveys
            ADD CONSTRAINT surveys_project_owner_user_id_fkey
            FOREIGN KEY (project_owner_user_id)
            REFERENCES users(user_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'surveys_published_by_fkey'
    ) THEN
        ALTER TABLE surveys
            ADD CONSTRAINT surveys_published_by_fkey
            FOREIGN KEY (published_by)
            REFERENCES users(user_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

/* =========================================================
   SURVEY GEOGRAPHIC COVERAGE

   One survey may include one or many official PGIE units.
   This supports barangay, city, legislative district,
   provincial, and national survey configurations.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_geographic_coverage (
    survey_geographic_coverage_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    geo_unit_id UUID NOT NULL
        REFERENCES geo_units(geo_unit_id)
        ON DELETE RESTRICT,

    parent_coverage_id UUID
        REFERENCES survey_geographic_coverage(
            survey_geographic_coverage_id
        )
        ON DELETE CASCADE,

    coverage_role VARCHAR(60) NOT NULL DEFAULT 'Included',

    selection_method VARCHAR(80)
        NOT NULL DEFAULT 'Configured',

    stratum_code VARCHAR(100),
    stratum_name VARCHAR(180),

    allocation_weight NUMERIC(14, 6),
    target_respondents INTEGER,
    target_households INTEGER,

    is_sampling_domain BOOLEAN NOT NULL DEFAULT FALSE,
    is_required_coverage BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked_for_field_users BOOLEAN NOT NULL DEFAULT FALSE,

    display_order INTEGER NOT NULL DEFAULT 0,

    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_geo_coverage_unique
        UNIQUE (
            survey_id,
            geo_unit_id,
            coverage_role
        ),

    CONSTRAINT survey_geo_coverage_role_check
        CHECK (
            coverage_role IN (
                'Root',
                'Included',
                'Excluded',
                'Stratum',
                'Sampling Unit',
                'Reporting Unit',
                'Deployment Unit'
            )
        ),

    CONSTRAINT survey_geo_selection_method_check
        CHECK (
            selection_method IN (
                'Configured',
                'Complete Coverage',
                'Stratified',
                'Random',
                'Systematic',
                'Clustered',
                'Purposive',
                'Quota',
                'Operational Assignment'
            )
        ),

    CONSTRAINT survey_geo_coverage_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Archived'
            )
        ),

    CONSTRAINT survey_geo_target_respondents_check
        CHECK (
            target_respondents IS NULL
            OR target_respondents >= 0
        ),

    CONSTRAINT survey_geo_target_households_check
        CHECK (
            target_households IS NULL
            OR target_households >= 0
        )
);

/* =========================================================
   SURVEY SAMPLING CONFIGURATION

   Business rules remain editable per survey project.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_sampling_configurations (
    sampling_configuration_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    sampling_method VARCHAR(100) NOT NULL,

    confidence_level NUMERIC(6, 3),
    margin_of_error NUMERIC(6, 3),

    estimated_population BIGINT,
    calculated_sample_size INTEGER,
    approved_sample_size INTEGER,

    design_effect NUMERIC(10, 4),
    expected_response_rate NUMERIC(6, 3),
    oversampling_percentage NUMERIC(6, 3),

    allocation_method VARCHAR(100),
    respondent_selection_method VARCHAR(150),
    household_selection_method VARCHAR(150),

    replacement_policy TEXT,
    inclusion_criteria TEXT,
    exclusion_criteria TEXT,

    weighting_required BOOLEAN NOT NULL DEFAULT FALSE,
    stratification_required BOOLEAN NOT NULL DEFAULT FALSE,
    clustering_required BOOLEAN NOT NULL DEFAULT FALSE,

    methodology_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(30) NOT NULL DEFAULT 'Draft',

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_sampling_one_active_configuration
        UNIQUE (survey_id),

    CONSTRAINT survey_sampling_status_check
        CHECK (
            status IN (
                'Draft',
                'For Review',
                'Approved',
                'Active',
                'Superseded',
                'Archived'
            )
        ),

    CONSTRAINT survey_sampling_confidence_check
        CHECK (
            confidence_level IS NULL
            OR confidence_level BETWEEN 0 AND 100
        ),

    CONSTRAINT survey_sampling_margin_check
        CHECK (
            margin_of_error IS NULL
            OR margin_of_error BETWEEN 0 AND 100
        ),

    CONSTRAINT survey_sampling_response_rate_check
        CHECK (
            expected_response_rate IS NULL
            OR expected_response_rate BETWEEN 0 AND 100
        ),

    CONSTRAINT survey_sampling_oversampling_check
        CHECK (
            oversampling_percentage IS NULL
            OR oversampling_percentage >= 0
        )
);

/* =========================================================
   SURVEY OPERATIONAL CONFIGURATION

   Defaults may come from Book I settings but can be
   overridden per survey without changing source code.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_operational_configurations (
    operational_configuration_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    maximum_enumerators_per_supervisor INTEGER,
    minimum_respondents_per_enumerator INTEGER,

    planned_enumerator_count INTEGER,
    planned_supervisor_count INTEGER,
    planned_team_count INTEGER,

    daily_respondent_target INTEGER,
    fieldwork_days INTEGER,

    gps_required BOOLEAN,
    attendance_required BOOLEAN,
    offline_collection_enabled BOOLEAN,
    automatic_sync_enabled BOOLEAN,

    photo_capture_required BOOLEAN,
    respondent_signature_required BOOLEAN,
    supervisor_validation_required BOOLEAN,

    configuration_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(30) NOT NULL DEFAULT 'Draft',

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_operational_one_configuration
        UNIQUE (survey_id),

    CONSTRAINT survey_operational_status_check
        CHECK (
            status IN (
                'Draft',
                'Approved',
                'Active',
                'Superseded',
                'Archived'
            )
        ),

    CONSTRAINT survey_operational_enumerator_ratio_check
        CHECK (
            maximum_enumerators_per_supervisor IS NULL
            OR maximum_enumerators_per_supervisor >= 1
        ),

    CONSTRAINT survey_operational_respondent_target_check
        CHECK (
            minimum_respondents_per_enumerator IS NULL
            OR minimum_respondents_per_enumerator >= 1
        )
);

/* =========================================================
   SURVEY PUBLICATION WORKFLOW
========================================================= */

CREATE TABLE IF NOT EXISTS survey_publication_history (
    publication_history_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    survey_version_id UUID
        REFERENCES survey_versions(survey_version_id)
        ON DELETE SET NULL,

    previous_status VARCHAR(40),
    new_status VARCHAR(40) NOT NULL,

    publication_action VARCHAR(80) NOT NULL,
    action_reason TEXT,

    acted_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_survey_coverage_levels_active
    ON survey_coverage_levels(is_active);

CREATE INDEX IF NOT EXISTS idx_survey_coverage_levels_order
    ON survey_coverage_levels(display_order);

CREATE INDEX IF NOT EXISTS idx_surveys_organization
    ON surveys(organization_id);

CREATE INDEX IF NOT EXISTS idx_surveys_coverage_level
    ON surveys(coverage_level_id);

CREATE INDEX IF NOT EXISTS idx_surveys_project_owner
    ON surveys(project_owner_user_id);

CREATE INDEX IF NOT EXISTS idx_surveys_publication_status
    ON surveys(publication_status);

CREATE INDEX IF NOT EXISTS idx_survey_geo_coverage_survey
    ON survey_geographic_coverage(survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_geo_coverage_unit
    ON survey_geographic_coverage(geo_unit_id);

CREATE INDEX IF NOT EXISTS idx_survey_geo_coverage_parent
    ON survey_geographic_coverage(parent_coverage_id);

CREATE INDEX IF NOT EXISTS idx_survey_geo_coverage_status
    ON survey_geographic_coverage(status);

CREATE INDEX IF NOT EXISTS idx_survey_sampling_survey
    ON survey_sampling_configurations(survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_operational_survey
    ON survey_operational_configurations(survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_publication_history_survey
    ON survey_publication_history(survey_id);

CREATE INDEX IF NOT EXISTS idx_survey_publication_history_date
    ON survey_publication_history(acted_at DESC);

/* =========================================================
   FIVE APPROVED SURVEY COVERAGE LEVELS
========================================================= */

INSERT INTO survey_coverage_levels (
    coverage_code,
    coverage_name,
    description,
    display_order,
    root_geo_type_codes,
    selectable_geo_type_codes,
    respondent_source_geo_type_codes,
    requires_stratification,
    allows_multiple_root_units,
    allows_operational_subareas,
    configuration_json,
    is_system_level,
    is_active
)
VALUES
    (
        'BARANGAY',
        'Barangay Survey',
        'A survey limited to one barangay, with respondents allocated among its puroks, sitios, zones, or other configured local areas.',
        1,
        '["BARANGAY"]'::jsonb,
        '["BARANGAY","PUROK","SITIO","ZONE","OPERATIONAL_AREA"]'::jsonb,
        '["PUROK","SITIO","ZONE","OPERATIONAL_AREA"]'::jsonb,
        FALSE,
        FALSE,
        TRUE,
        '{
            "default_hierarchy": [
                "REGION",
                "PROVINCE_OR_HUC_OR_ICC",
                "MUNICIPALITY_OR_COMPONENT_CITY",
                "BARANGAY",
                "LOCAL_AREA"
            ]
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'MUNICIPALITY_CITY',
        'Municipality or City Survey',
        'A survey limited to one municipality or city, with respondents selected or allocated among its barangays.',
        2,
        '[
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "HIGHLY_URBANIZED_CITY",
            "INDEPENDENT_COMPONENT_CITY"
        ]'::jsonb,
        '[
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "HIGHLY_URBANIZED_CITY",
            "INDEPENDENT_COMPONENT_CITY",
            "BARANGAY",
            "PUROK",
            "SITIO",
            "ZONE"
        ]'::jsonb,
        '["BARANGAY","PUROK","SITIO","ZONE"]'::jsonb,
        FALSE,
        FALSE,
        TRUE,
        '{
            "barangay_selection": "configurable"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'LEGISLATIVE_DISTRICT',
        'Legislative District Survey',
        'A survey limited to one Philippine legislative district, with respondents drawn from its municipalities or cities and stratified barangays.',
        3,
        '["LEGISLATIVE_DISTRICT"]'::jsonb,
        '[
            "LEGISLATIVE_DISTRICT",
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "HIGHLY_URBANIZED_CITY",
            "INDEPENDENT_COMPONENT_CITY",
            "BARANGAY"
        ]'::jsonb,
        '["BARANGAY"]'::jsonb,
        TRUE,
        FALSE,
        TRUE,
        '{
            "requires_political_geography": true,
            "barangay_stratification": "configurable"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'PROVINCE',
        'Provincial Survey',
        'A survey limited to one province, with respondents drawn from stratified municipalities, component cities, and their barangays.',
        4,
        '["PROVINCE"]'::jsonb,
        '[
            "PROVINCE",
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "BARANGAY"
        ]'::jsonb,
        '["MUNICIPALITY","COMPONENT_CITY","BARANGAY"]'::jsonb,
        TRUE,
        FALSE,
        TRUE,
        '{
            "municipality_city_stratification": "configurable",
            "barangay_stratification": "configurable"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    (
        'NATIONAL',
        'National Survey',
        'A nationwide multistage survey covering regions, provinces, highly urbanized cities, independent component cities, municipalities, component cities, and barangays.',
        5,
        '["COUNTRY"]'::jsonb,
        '[
            "COUNTRY",
            "REGION",
            "PROVINCE",
            "HIGHLY_URBANIZED_CITY",
            "INDEPENDENT_COMPONENT_CITY",
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "BARANGAY"
        ]'::jsonb,
        '[
            "REGION",
            "PROVINCE",
            "HIGHLY_URBANIZED_CITY",
            "INDEPENDENT_COMPONENT_CITY",
            "MUNICIPALITY",
            "COMPONENT_CITY",
            "BARANGAY"
        ]'::jsonb,
        TRUE,
        TRUE,
        TRUE,
        '{
            "multistage_sampling": true,
            "huc_and_icc_belong_to_region": true,
            "huc_and_icc_have_no_provincial_parent": true
        }'::jsonb,
        TRUE,
        TRUE
    )
ON CONFLICT (coverage_code) DO NOTHING;

/* =========================================================
   PUBLICATION STATUS VALIDATION
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'surveys_publication_status_check'
    ) THEN
        ALTER TABLE surveys
            ADD CONSTRAINT surveys_publication_status_check
            CHECK (
                publication_status IN (
                    'Draft',
                    'For Review',
                    'Pilot',
                    'Approved',
                    'Published',
                    'Field Operations',
                    'Closed',
                    'Archived'
                )
            );
    END IF;
END
$$;

COMMIT;
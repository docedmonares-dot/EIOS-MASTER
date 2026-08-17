BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   SURVEY-LOCAL QUESTIONS

   These questions belong only to one survey unless they are
   later promoted into the Enterprise Question Bank.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_local_questions (
    local_question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    section_id UUID
        REFERENCES survey_sections(section_id)
        ON DELETE SET NULL,

    question_type_id UUID NOT NULL
        REFERENCES question_types(question_type_id)
        ON DELETE RESTRICT,

    choice_list_id UUID
        REFERENCES question_choice_lists(choice_list_id)
        ON DELETE SET NULL,

    question_code VARCHAR(120) NOT NULL,
    variable_name VARCHAR(120) NOT NULL,

    question_text TEXT NOT NULL,
    question_description TEXT,
    help_text TEXT,
    placeholder_text VARCHAR(250),

    required_flag BOOLEAN NOT NULL DEFAULT FALSE,

    default_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_rules_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    appearance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    logic_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    calculation_expression TEXT,

    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_personally_identifiable BOOLEAN NOT NULL DEFAULT FALSE,

    page_number INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,

    question_status VARCHAR(40) NOT NULL DEFAULT 'Draft',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    promoted_question_id UUID
        REFERENCES question_bank(question_id)
        ON DELETE SET NULL,

    promoted_at TIMESTAMPTZ,
    promoted_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_local_questions_code_unique
        UNIQUE (survey_id, question_code),

    CONSTRAINT survey_local_questions_variable_unique
        UNIQUE (survey_id, variable_name),

    CONSTRAINT survey_local_questions_status_check
        CHECK (
            question_status IN (
                'Draft',
                'Active',
                'Inactive',
                'Archived'
            )
        )
);

/* =========================================================
   QUESTIONNAIRE ITEMS

   One ordered stream combines:
   - Enterprise Question Bank items
   - Survey-local questions

   Exactly one source must be present per item.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_questionnaire_items (
    questionnaire_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    section_id UUID
        REFERENCES survey_sections(section_id)
        ON DELETE SET NULL,

    enterprise_question_id UUID
        REFERENCES question_bank(question_id)
        ON DELETE RESTRICT,

    local_question_id UUID
        REFERENCES survey_local_questions(local_question_id)
        ON DELETE CASCADE,

    item_source VARCHAR(40) NOT NULL,

    page_number INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,

    required_override BOOLEAN,
    label_override TEXT,

    item_settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_questionnaire_items_source_check
        CHECK (
            (
                item_source = 'Enterprise Question Bank'
                AND enterprise_question_id IS NOT NULL
                AND local_question_id IS NULL
            )
            OR
            (
                item_source = 'Survey Local'
                AND local_question_id IS NOT NULL
                AND enterprise_question_id IS NULL
            )
        ),

    CONSTRAINT survey_questionnaire_items_source_value_check
        CHECK (
            item_source IN (
                'Enterprise Question Bank',
                'Survey Local'
            )
        )
);

/* =========================================================
   LOCAL QUESTION CHOICES

   Used when a survey-local question has its own options and
   does not rely on a reusable enterprise choice list.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_local_question_choices (
    local_question_choice_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    local_question_id UUID NOT NULL
        REFERENCES survey_local_questions(local_question_id)
        ON DELETE CASCADE,

    choice_code VARCHAR(120) NOT NULL,
    choice_label VARCHAR(250) NOT NULL,

    numeric_value NUMERIC(18, 6),
    text_value TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    is_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_other_option BOOLEAN NOT NULL DEFAULT FALSE,
    is_none_option BOOLEAN NOT NULL DEFAULT FALSE,
    is_refuse_option BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_local_question_choices_unique
        UNIQUE (
            local_question_id,
            choice_code
        )
);

/* =========================================================
   DESIGNER DRAFT STATE

   Stores temporary visual-editor state, selected section,
   panel state, zoom, and unsaved layout preferences.
========================================================= */

CREATE TABLE IF NOT EXISTS survey_designer_states (
    designer_state_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    selected_section_id UUID
        REFERENCES survey_sections(section_id)
        ON DELETE SET NULL,

    selected_item_id UUID
        REFERENCES survey_questionnaire_items(
            questionnaire_item_id
        )
        ON DELETE SET NULL,

    designer_state_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_designer_states_unique
        UNIQUE (survey_id, user_id)
);

/* =========================================================
   QUESTIONNAIRE TEMPLATES
========================================================= */

CREATE TABLE IF NOT EXISTS survey_questionnaire_templates (
    questionnaire_template_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE,

    template_code VARCHAR(120) NOT NULL,
    template_name VARCHAR(220) NOT NULL,
    description TEXT,

    coverage_level_id UUID
        REFERENCES survey_coverage_levels(coverage_level_id)
        ON DELETE SET NULL,

    template_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    version_number INTEGER NOT NULL DEFAULT 1,

    template_status VARCHAR(40) NOT NULL DEFAULT 'Draft',

    is_system_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    updated_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT survey_questionnaire_templates_unique
        UNIQUE (organization_id, template_code),

    CONSTRAINT survey_questionnaire_templates_status_check
        CHECK (
            template_status IN (
                'Draft',
                'For Review',
                'Approved',
                'Published',
                'Archived'
            )
        )
);

/* =========================================================
   DESIGNER AUDIT EVENTS
========================================================= */

CREATE TABLE IF NOT EXISTS survey_designer_events (
    designer_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    survey_id UUID NOT NULL
        REFERENCES surveys(survey_id)
        ON DELETE CASCADE,

    section_id UUID
        REFERENCES survey_sections(section_id)
        ON DELETE SET NULL,

    questionnaire_item_id UUID
        REFERENCES survey_questionnaire_items(
            questionnaire_item_id
        )
        ON DELETE SET NULL,

    event_type VARCHAR(100) NOT NULL,
    event_message TEXT,

    previous_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    new_value_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    acted_by UUID
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* =========================================================
   EXTEND SURVEY SECTIONS
========================================================= */

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS section_type VARCHAR(60)
        NOT NULL DEFAULT 'Standard';

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS settings_json JSONB
        NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN
        NOT NULL DEFAULT FALSE;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS repeat_expression TEXT;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS visibility_expression TEXT;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS updated_by UUID;

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW();

ALTER TABLE survey_sections
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'survey_sections_section_type_check'
    ) THEN
        ALTER TABLE survey_sections
            ADD CONSTRAINT survey_sections_section_type_check
            CHECK (
                section_type IN (
                    'Cover',
                    'Standard',
                    'Roster',
                    'Repeat Group',
                    'Review',
                    'Closing'
                )
            );
    END IF;
END
$$;

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_local_questions_survey
    ON survey_local_questions(survey_id);

CREATE INDEX IF NOT EXISTS idx_local_questions_section
    ON survey_local_questions(section_id);

CREATE INDEX IF NOT EXISTS idx_local_questions_type
    ON survey_local_questions(question_type_id);

CREATE INDEX IF NOT EXISTS idx_local_questions_status
    ON survey_local_questions(question_status);

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_survey
    ON survey_questionnaire_items(survey_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_section
    ON survey_questionnaire_items(section_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_order
    ON survey_questionnaire_items(
        survey_id,
        section_id,
        page_number,
        sort_order
    );

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_enterprise
    ON survey_questionnaire_items(enterprise_question_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_items_local
    ON survey_questionnaire_items(local_question_id);

CREATE INDEX IF NOT EXISTS idx_local_question_choices_question
    ON survey_local_question_choices(local_question_id);

CREATE INDEX IF NOT EXISTS idx_local_question_choices_order
    ON survey_local_question_choices(
        local_question_id,
        display_order
    );

CREATE INDEX IF NOT EXISTS idx_designer_states_survey
    ON survey_designer_states(survey_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_org
    ON survey_questionnaire_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_templates_status
    ON survey_questionnaire_templates(template_status);

CREATE INDEX IF NOT EXISTS idx_designer_events_survey
    ON survey_designer_events(survey_id);

CREATE INDEX IF NOT EXISTS idx_designer_events_date
    ON survey_designer_events(acted_at DESC);

/* =========================================================
   BACKFILL EXISTING SURVEY QUESTIONS INTO UNIFIED ITEMS
========================================================= */

INSERT INTO survey_questionnaire_items (
    survey_id,
    section_id,
    enterprise_question_id,
    local_question_id,
    item_source,
    page_number,
    sort_order,
    required_override,
    label_override,
    item_settings_json,
    is_active
)
SELECT
    existing.survey_id,
    existing.section_id,
    existing.question_id,
    NULL,
    'Enterprise Question Bank',
    existing.page_number,
    existing.sort_order,
    existing.required_override,
    existing.question_label_override,
    existing.settings_json,
    existing.is_active
FROM survey_questions AS existing
WHERE NOT EXISTS (
    SELECT 1
    FROM survey_questionnaire_items AS unified
    WHERE unified.survey_id = existing.survey_id
      AND unified.enterprise_question_id =
          existing.question_id
);

COMMIT;
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   QUESTION TYPE MASTER
========================================================= */

CREATE TABLE IF NOT EXISTS question_types (
    question_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type_code VARCHAR(100) NOT NULL UNIQUE,
    type_name VARCHAR(160) NOT NULL,
    description TEXT,

    category_group VARCHAR(100) NOT NULL DEFAULT 'General',

    renderer_component VARCHAR(160) NOT NULL,
    editor_component VARCHAR(160),
    preview_component VARCHAR(160),

    response_data_type VARCHAR(60) NOT NULL,

    supports_options BOOLEAN NOT NULL DEFAULT FALSE,
    supports_validation BOOLEAN NOT NULL DEFAULT TRUE,
    supports_default_value BOOLEAN NOT NULL DEFAULT TRUE,
    supports_calculation BOOLEAN NOT NULL DEFAULT FALSE,
    supports_logic BOOLEAN NOT NULL DEFAULT TRUE,
    supports_media BOOLEAN NOT NULL DEFAULT FALSE,
    supports_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    supports_matrix BOOLEAN NOT NULL DEFAULT FALSE,
    supports_offline BOOLEAN NOT NULL DEFAULT TRUE,

    allowed_validation_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    allowed_option_settings JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    renderer_metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    display_order INTEGER NOT NULL DEFAULT 0,

    icon_name VARCHAR(100),
    help_text TEXT,

    is_system_type BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT question_types_response_data_type_check
        CHECK (
            response_data_type IN (
                'string',
                'text',
                'integer',
                'decimal',
                'boolean',
                'date',
                'time',
                'datetime',
                'json',
                'file',
                'location',
                'calculated',
                'none'
            )
        )
);

/* =========================================================
   EXTEND QUESTION BANK
========================================================= */

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS question_type_id UUID;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS variable_name VARCHAR(120);

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS help_text TEXT;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS placeholder_text VARCHAR(250);

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS default_value_json JSONB
        NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS validation_rules_json JSONB
        NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS appearance_json JSONB
        NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS logic_enabled BOOLEAN
        NOT NULL DEFAULT FALSE;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS calculation_expression TEXT;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN
        NOT NULL DEFAULT FALSE;

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS is_personally_identifiable BOOLEAN
        NOT NULL DEFAULT FALSE;

/* =========================================================
   ADD FOREIGN KEY SAFELY
========================================================= */

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'question_bank_question_type_id_fkey'
    ) THEN
        ALTER TABLE question_bank
            ADD CONSTRAINT question_bank_question_type_id_fkey
            FOREIGN KEY (question_type_id)
            REFERENCES question_types(question_type_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

/* =========================================================
   QUESTION CHOICE LISTS
========================================================= */

CREATE TABLE IF NOT EXISTS question_choice_lists (
    choice_list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    choice_list_code VARCHAR(120) NOT NULL UNIQUE,
    choice_list_name VARCHAR(200) NOT NULL,
    description TEXT,

    source_type VARCHAR(60) NOT NULL DEFAULT 'Manual',

    source_table VARCHAR(160),
    source_value_field VARCHAR(160),
    source_label_field VARCHAR(160),
    source_filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    allow_other_option BOOLEAN NOT NULL DEFAULT FALSE,
    allow_none_option BOOLEAN NOT NULL DEFAULT FALSE,
    allow_refuse_option BOOLEAN NOT NULL DEFAULT FALSE,

    is_system_list BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT question_choice_lists_source_type_check
        CHECK (
            source_type IN (
                'Manual',
                'Database',
                'PGIE',
                'API',
                'Calculated'
            )
        )
);

/* =========================================================
   QUESTION CHOICES
========================================================= */

CREATE TABLE IF NOT EXISTS question_choices (
    question_choice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    choice_list_id UUID NOT NULL
        REFERENCES question_choice_lists(choice_list_id)
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

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT question_choices_unique
        UNIQUE (
            choice_list_id,
            choice_code
        )
);

/* =========================================================
   LINK QUESTION BANK TO CHOICE LIST
========================================================= */

ALTER TABLE question_bank
    ADD COLUMN IF NOT EXISTS choice_list_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'question_bank_choice_list_id_fkey'
    ) THEN
        ALTER TABLE question_bank
            ADD CONSTRAINT question_bank_choice_list_id_fkey
            FOREIGN KEY (choice_list_id)
            REFERENCES question_choice_lists(choice_list_id)
            ON DELETE SET NULL;
    END IF;
END
$$;

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_question_types_active
    ON question_types(is_active);

CREATE INDEX IF NOT EXISTS idx_question_types_category
    ON question_types(category_group);

CREATE INDEX IF NOT EXISTS idx_question_types_order
    ON question_types(display_order);

CREATE INDEX IF NOT EXISTS idx_question_bank_type_id
    ON question_bank(question_type_id);

CREATE INDEX IF NOT EXISTS idx_question_bank_variable_name
    ON question_bank(variable_name);

CREATE INDEX IF NOT EXISTS idx_question_bank_choice_list
    ON question_bank(choice_list_id);

CREATE INDEX IF NOT EXISTS idx_question_choice_lists_active
    ON question_choice_lists(is_active);

CREATE INDEX IF NOT EXISTS idx_question_choices_list
    ON question_choices(choice_list_id);

CREATE INDEX IF NOT EXISTS idx_question_choices_order
    ON question_choices(choice_list_id, display_order);

/* =========================================================
   SYSTEM QUESTION TYPES
========================================================= */

INSERT INTO question_types (
    type_code,
    type_name,
    description,
    category_group,
    renderer_component,
    editor_component,
    preview_component,
    response_data_type,
    supports_options,
    supports_validation,
    supports_default_value,
    supports_calculation,
    supports_logic,
    supports_media,
    supports_repeat,
    supports_matrix,
    supports_offline,
    allowed_validation_rules,
    allowed_option_settings,
    default_settings_json,
    renderer_metadata_json,
    display_order,
    icon_name,
    help_text,
    is_system_type,
    is_active
)
VALUES
    (
        'SHORT_TEXT',
        'Short Text',
        'Single-line text response.',
        'Text',
        'ShortTextRenderer',
        'ShortTextEditor',
        'ShortTextPreview',
        'string',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","min_length","max_length","pattern"]'::jsonb,
        '[]'::jsonb,
        '{"max_length":255}'::jsonb,
        '{}'::jsonb,
        1,
        'Type',
        'Use for names, codes, and short written responses.',
        TRUE,
        TRUE
    ),
    (
        'LONG_TEXT',
        'Long Text',
        'Multi-line text response.',
        'Text',
        'LongTextRenderer',
        'LongTextEditor',
        'LongTextPreview',
        'text',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","min_length","max_length"]'::jsonb,
        '[]'::jsonb,
        '{"rows":4}'::jsonb,
        '{}'::jsonb,
        2,
        'AlignLeft',
        'Use for comments, narratives, and explanations.',
        TRUE,
        TRUE
    ),
    (
        'INTEGER',
        'Integer',
        'Whole-number response.',
        'Numeric',
        'IntegerRenderer',
        'NumericEditor',
        'IntegerPreview',
        'integer',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum","maximum"]'::jsonb,
        '[]'::jsonb,
        '{"step":1}'::jsonb,
        '{}'::jsonb,
        3,
        'Hash',
        'Use for age, household size, and counts.',
        TRUE,
        TRUE
    ),
    (
        'DECIMAL',
        'Decimal',
        'Decimal-number response.',
        'Numeric',
        'DecimalRenderer',
        'NumericEditor',
        'DecimalPreview',
        'decimal',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum","maximum","decimal_places"]'::jsonb,
        '[]'::jsonb,
        '{"step":"any"}'::jsonb,
        '{}'::jsonb,
        4,
        'Percent',
        'Use for measurements, rates, and decimal values.',
        TRUE,
        TRUE
    ),
    (
        'CURRENCY',
        'Currency',
        'Currency amount response.',
        'Numeric',
        'CurrencyRenderer',
        'CurrencyEditor',
        'CurrencyPreview',
        'decimal',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum","maximum"]'::jsonb,
        '[]'::jsonb,
        '{"currency":"PHP"}'::jsonb,
        '{}'::jsonb,
        5,
        'Banknote',
        'Use for income, expense, or financial amounts.',
        TRUE,
        TRUE
    ),
    (
        'YES_NO',
        'Yes / No',
        'Boolean yes-or-no response.',
        'Choice',
        'YesNoRenderer',
        'ChoiceEditor',
        'YesNoPreview',
        'boolean',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required"]'::jsonb,
        '["layout","labels"]'::jsonb,
        '{"yes_label":"Yes","no_label":"No"}'::jsonb,
        '{}'::jsonb,
        6,
        'ToggleLeft',
        'Use for binary questions.',
        TRUE,
        TRUE
    ),
    (
        'SINGLE_CHOICE',
        'Single Choice',
        'Select one option from a defined list.',
        'Choice',
        'SingleChoiceRenderer',
        'ChoiceEditor',
        'SingleChoicePreview',
        'string',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required"]'::jsonb,
        '["layout","shuffle","other_option"]'::jsonb,
        '{"layout":"vertical"}'::jsonb,
        '{}'::jsonb,
        7,
        'CircleDot',
        'Use where respondents may choose only one answer.',
        TRUE,
        TRUE
    ),
    (
        'MULTIPLE_CHOICE',
        'Multiple Choice',
        'Select one or more options from a defined list.',
        'Choice',
        'MultipleChoiceRenderer',
        'ChoiceEditor',
        'MultipleChoicePreview',
        'json',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum_selections","maximum_selections"]'::jsonb,
        '["layout","shuffle","other_option"]'::jsonb,
        '{"layout":"vertical"}'::jsonb,
        '{}'::jsonb,
        8,
        'ListChecks',
        'Use where respondents may choose several answers.',
        TRUE,
        TRUE
    ),
    (
        'DROPDOWN',
        'Dropdown',
        'Select one item from a dropdown list.',
        'Choice',
        'DropdownRenderer',
        'ChoiceEditor',
        'DropdownPreview',
        'string',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required"]'::jsonb,
        '["searchable","placeholder"]'::jsonb,
        '{"searchable":true}'::jsonb,
        '{}'::jsonb,
        9,
        'ListFilter',
        'Use for long lists such as locations and occupations.',
        TRUE,
        TRUE
    ),
    (
        'DATE',
        'Date',
        'Calendar date response.',
        'Date and Time',
        'DateRenderer',
        'DateEditor',
        'DatePreview',
        'date',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum_date","maximum_date"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        10,
        'CalendarDays',
        'Use for birthdays and event dates.',
        TRUE,
        TRUE
    ),
    (
        'TIME',
        'Time',
        'Clock time response.',
        'Date and Time',
        'TimeRenderer',
        'TimeEditor',
        'TimePreview',
        'time',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum_time","maximum_time"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        11,
        'Clock3',
        'Use for time-specific responses.',
        TRUE,
        TRUE
    ),
    (
        'DATETIME',
        'Date and Time',
        'Combined date and time response.',
        'Date and Time',
        'DateTimeRenderer',
        'DateTimeEditor',
        'DateTimePreview',
        'datetime',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum_datetime","maximum_datetime"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        12,
        'CalendarClock',
        'Use for timestamped events.',
        TRUE,
        TRUE
    ),
    (
        'LIKERT_SCALE',
        'Likert Scale',
        'Ordered response scale.',
        'Scale',
        'LikertRenderer',
        'LikertEditor',
        'LikertPreview',
        'integer',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required"]'::jsonb,
        '["minimum_label","maximum_label","points"]'::jsonb,
        '{"points":5}'::jsonb,
        '{}'::jsonb,
        13,
        'Gauge',
        'Use for satisfaction, agreement, and perception scales.',
        TRUE,
        TRUE
    ),
    (
        'RANKING',
        'Ranking',
        'Rank several items in order.',
        'Scale',
        'RankingRenderer',
        'RankingEditor',
        'RankingPreview',
        'json',
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","minimum_ranked","maximum_ranked"]'::jsonb,
        '["shuffle"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        14,
        'ListOrdered',
        'Use when respondents must prioritize choices.',
        TRUE,
        TRUE
    ),
    (
        'MATRIX',
        'Matrix',
        'Grid of rows and columns.',
        'Advanced',
        'MatrixRenderer',
        'MatrixEditor',
        'MatrixPreview',
        'json',
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        '["required","require_all_rows"]'::jsonb,
        '["rows","columns"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        15,
        'Table2',
        'Use for repeated rating items.',
        TRUE,
        TRUE
    ),
    (
        'GPS',
        'GPS Location',
        'Capture device geographic coordinates.',
        'Location and Media',
        'GpsRenderer',
        'GpsEditor',
        'GpsPreview',
        'location',
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["required","accuracy_threshold"]'::jsonb,
        '[]'::jsonb,
        '{"capture_accuracy":true}'::jsonb,
        '{}'::jsonb,
        16,
        'MapPin',
        'Use for live field-location capture.',
        TRUE,
        TRUE
    ),
    (
        'PHOTO',
        'Photo',
        'Capture or upload an image.',
        'Location and Media',
        'PhotoRenderer',
        'MediaEditor',
        'PhotoPreview',
        'file',
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        '["required","maximum_file_size"]'::jsonb,
        '["camera_only","gallery_allowed"]'::jsonb,
        '{"camera_only":false}'::jsonb,
        '{}'::jsonb,
        17,
        'Camera',
        'Use for documentary photo evidence.',
        TRUE,
        TRUE
    ),
    (
        'SIGNATURE',
        'Signature',
        'Capture a handwritten signature.',
        'Location and Media',
        'SignatureRenderer',
        'SignatureEditor',
        'SignaturePreview',
        'file',
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        '["required"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        18,
        'Signature',
        'Use for consent and acknowledgment.',
        TRUE,
        TRUE
    ),
    (
        'BARCODE_QR',
        'Barcode / QR',
        'Scan a barcode or QR code.',
        'Location and Media',
        'BarcodeRenderer',
        'BarcodeEditor',
        'BarcodePreview',
        'string',
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        '["required","pattern"]'::jsonb,
        '["allowed_formats"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        19,
        'QrCode',
        'Use for asset IDs and encoded references.',
        TRUE,
        TRUE
    ),
    (
        'FILE_UPLOAD',
        'File Upload',
        'Attach a document or other file.',
        'Location and Media',
        'FileUploadRenderer',
        'FileUploadEditor',
        'FileUploadPreview',
        'file',
        FALSE,
        TRUE,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        '["required","maximum_file_size"]'::jsonb,
        '["allowed_file_types"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        20,
        'Paperclip',
        'Use for documents and attachments.',
        TRUE,
        TRUE
    ),
    (
        'CALCULATED_FIELD',
        'Calculated Field',
        'Compute a value from other responses.',
        'Advanced',
        'CalculatedFieldRenderer',
        'CalculatedFieldEditor',
        'CalculatedFieldPreview',
        'calculated',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '["calculation_expression"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        21,
        'Calculator',
        'Use for totals, scores, and derived variables.',
        TRUE,
        TRUE
    ),
    (
        'HIDDEN_FIELD',
        'Hidden Field',
        'Store metadata without showing it to respondents.',
        'Advanced',
        'HiddenFieldRenderer',
        'HiddenFieldEditor',
        'HiddenFieldPreview',
        'json',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        22,
        'EyeOff',
        'Use for system values and derived metadata.',
        TRUE,
        TRUE
    ),
    (
        'HOUSEHOLD_ROSTER',
        'Household Roster',
        'Repeat structured questions for household members.',
        'Advanced',
        'HouseholdRosterRenderer',
        'HouseholdRosterEditor',
        'HouseholdRosterPreview',
        'json',
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        '["minimum_rows","maximum_rows"]'::jsonb,
        '["columns","member_identifier"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        23,
        'UsersRound',
        'Use for household-member listings.',
        TRUE,
        TRUE
    ),
    (
        'REPEAT_GROUP',
        'Repeat Group',
        'Repeat a group of questions dynamically.',
        'Advanced',
        'RepeatGroupRenderer',
        'RepeatGroupEditor',
        'RepeatGroupPreview',
        'json',
        FALSE,
        TRUE,
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        FALSE,
        TRUE,
        '["minimum_repeats","maximum_repeats"]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        24,
        'Repeat2',
        'Use for repeated entities, visits, or events.',
        TRUE,
        TRUE
    )
ON CONFLICT (type_code) DO NOTHING;

/* =========================================================
   BACKFILL EXISTING QUESTION BANK TYPES
========================================================= */

UPDATE question_bank AS question
SET question_type_id = type.question_type_id
FROM question_types AS type
WHERE question.question_type_id IS NULL
  AND UPPER(REPLACE(question.question_type, ' ', '_')) =
      type.type_code;

/* =========================================================
   VARIABLE NAME UNIQUE INDEX
========================================================= */

CREATE UNIQUE INDEX IF NOT EXISTS idx_question_bank_variable_name_unique
    ON question_bank(variable_name)
    WHERE variable_name IS NOT NULL;

COMMIT;
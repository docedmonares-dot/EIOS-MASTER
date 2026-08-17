/* ============================================================
   EIOS DATABASE MIGRATION 009
   ENTERPRISE CHOICE LIBRARY FOUNDATION

   Purpose:
   1. Extend question_choice_lists with category_code.
   2. Create question_choice_items.
   3. Support reusable, ordered, hierarchical choice values.
   4. Preserve auditability and future offline compilation.

   This migration is designed to be safely rerunnable.
============================================================ */

BEGIN;


/* ============================================================
   1. UUID SUPPORT
============================================================ */

CREATE EXTENSION IF NOT EXISTS pgcrypto;


/* ============================================================
   2. EXTEND EXISTING QUESTION CHOICE LISTS
============================================================ */

ALTER TABLE question_choice_lists
ADD COLUMN IF NOT EXISTS category_code
    VARCHAR(100);


/*
 * Existing choice lists must remain valid.
 * Lists without a category are assigned to CUSTOM.
 */
UPDATE question_choice_lists
SET category_code = 'CUSTOM'
WHERE category_code IS NULL
   OR BTRIM(category_code) = '';


ALTER TABLE question_choice_lists
ALTER COLUMN category_code
SET DEFAULT 'CUSTOM';


ALTER TABLE question_choice_lists
ALTER COLUMN category_code
SET NOT NULL;


/*
 * Normalize category codes for predictable filtering.
 */
UPDATE question_choice_lists
SET category_code =
    UPPER(
        REGEXP_REPLACE(
            BTRIM(category_code),
            '[^A-Za-z0-9]+',
            '_',
            'g'
        )
    );


/* ============================================================
   3. CREATE QUESTION CHOICE ITEMS
============================================================ */

CREATE TABLE IF NOT EXISTS question_choice_items (
    choice_item_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    choice_list_id UUID
        NOT NULL,

    parent_choice_item_id UUID
        NULL,

    choice_code VARCHAR(120)
        NOT NULL,

    choice_value VARCHAR(255)
        NOT NULL,

    display_label VARCHAR(255)
        NOT NULL,

    short_label VARCHAR(160)
        NULL,

    description TEXT
        NULL,

    sort_order INTEGER
        NOT NULL
        DEFAULT 0,

    is_default BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_exclusive BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_other_option BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_none_option BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_refuse_option BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,

    effective_from TIMESTAMPTZ
        NULL,

    effective_until TIMESTAMPTZ
        NULL,

    metadata_json JSONB
        NOT NULL
        DEFAULT '{}'::jsonb,

    created_by UUID
        NULL,

    updated_by UUID
        NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT fk_question_choice_items_list
        FOREIGN KEY (choice_list_id)
        REFERENCES question_choice_lists (
            choice_list_id
        )
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_question_choice_items_parent
        FOREIGN KEY (
            parent_choice_item_id
        )
        REFERENCES question_choice_items (
            choice_item_id
        )
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_question_choice_items_code
        UNIQUE (
            choice_list_id,
            choice_code
        ),

    CONSTRAINT ck_question_choice_items_code_not_blank
        CHECK (
            BTRIM(choice_code) <> ''
        ),

    CONSTRAINT ck_question_choice_items_value_not_blank
        CHECK (
            BTRIM(choice_value) <> ''
        ),

    CONSTRAINT ck_question_choice_items_label_not_blank
        CHECK (
            BTRIM(display_label) <> ''
        ),

    CONSTRAINT ck_question_choice_items_sort_order
        CHECK (
            sort_order >= 0
        ),

    CONSTRAINT ck_question_choice_items_effective_dates
        CHECK (
            effective_until IS NULL
            OR effective_from IS NULL
            OR effective_until >=
               effective_from
        ),

    CONSTRAINT ck_question_choice_items_parent_not_self
        CHECK (
            parent_choice_item_id IS NULL
            OR parent_choice_item_id <>
               choice_item_id
        )
);


/* ============================================================
   4. INDEXES FOR CHOICE LISTS
============================================================ */

CREATE INDEX IF NOT EXISTS
    idx_question_choice_lists_category
ON question_choice_lists (
    category_code
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_lists_category_active
ON question_choice_lists (
    category_code,
    is_active
);


/* ============================================================
   5. INDEXES FOR CHOICE ITEMS
============================================================ */

CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_list
ON question_choice_items (
    choice_list_id
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_list_active
ON question_choice_items (
    choice_list_id,
    is_active
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_list_order
ON question_choice_items (
    choice_list_id,
    sort_order,
    display_label
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_parent
ON question_choice_items (
    parent_choice_item_id
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_value
ON question_choice_items (
    choice_list_id,
    choice_value
);


CREATE INDEX IF NOT EXISTS
    idx_question_choice_items_metadata
ON question_choice_items
USING GIN (
    metadata_json
);


/* ============================================================
   6. UPDATED-AT TRIGGER
============================================================ */

CREATE OR REPLACE FUNCTION
    set_question_choice_item_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
    trg_question_choice_items_updated_at
ON question_choice_items;


CREATE TRIGGER
    trg_question_choice_items_updated_at
BEFORE UPDATE
ON question_choice_items
FOR EACH ROW
EXECUTE FUNCTION
    set_question_choice_item_updated_at();


/* ============================================================
   7. DOCUMENTATION COMMENTS
============================================================ */

COMMENT ON COLUMN
    question_choice_lists.category_code
IS
    'Logical category used to organize reusable choice lists, such as DEMOGRAPHICS, ELECTION, GEOGRAPHY, or CUSTOM.';


COMMENT ON TABLE
    question_choice_items
IS
    'Stores reusable selectable values belonging to an enterprise question choice list.';


COMMENT ON COLUMN
    question_choice_items.choice_code
IS
    'Stable machine-readable identifier unique within a choice list.';


COMMENT ON COLUMN
    question_choice_items.choice_value
IS
    'Canonical value saved with the respondent answer.';


COMMENT ON COLUMN
    question_choice_items.display_label
IS
    'Human-readable text displayed in the questionnaire.';


COMMENT ON COLUMN
    question_choice_items.parent_choice_item_id
IS
    'Optional parent item used for hierarchical or cascading choices.';


COMMENT ON COLUMN
    question_choice_items.is_exclusive
IS
    'When selected in a multiple-choice question, other selected choices should be cleared.';


COMMENT ON COLUMN
    question_choice_items.metadata_json
IS
    'Extensible metadata for election codes, icons, translations, PSGC references, grouping, and other configuration.';


COMMIT;
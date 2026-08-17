BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* =========================================================
   COUNTRY MASTER
========================================================= */

CREATE TABLE IF NOT EXISTS geo_countries (
    country_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    country_code CHAR(2) NOT NULL UNIQUE,
    country_code_3 CHAR(3),
    country_name VARCHAR(150) NOT NULL,
    official_name VARCHAR(250),

    default_timezone VARCHAR(80),
    default_language VARCHAR(50),
    currency_code CHAR(3),

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_countries_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Archived'
            )
        )
);

/* =========================================================
   GEOGRAPHIC UNIT TYPES
========================================================= */

CREATE TABLE IF NOT EXISTS geo_unit_types (
    geo_unit_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    country_id UUID NOT NULL
        REFERENCES geo_countries(country_id)
        ON DELETE CASCADE,

    type_code VARCHAR(80) NOT NULL,
    type_name VARCHAR(150) NOT NULL,

    hierarchy_level INTEGER NOT NULL,
    official_source VARCHAR(150),

    allows_children BOOLEAN NOT NULL DEFAULT TRUE,
    is_official BOOLEAN NOT NULL DEFAULT TRUE,
    is_operational BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_unit_types_unique
        UNIQUE (country_id, type_code),

    CONSTRAINT geo_unit_types_level_check
        CHECK (hierarchy_level >= 0)
);

/* =========================================================
   UNIFIED GEOGRAPHIC MASTER
========================================================= */

CREATE TABLE IF NOT EXISTS geo_units (
    geo_unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    country_id UUID NOT NULL
        REFERENCES geo_countries(country_id)
        ON DELETE CASCADE,

    geo_unit_type_id UUID NOT NULL
        REFERENCES geo_unit_types(geo_unit_type_id)
        ON DELETE RESTRICT,

    parent_geo_unit_id UUID
        REFERENCES geo_units(geo_unit_id)
        ON DELETE RESTRICT,

    official_code VARCHAR(30),
    local_code VARCHAR(80),

    unit_name VARCHAR(250) NOT NULL,
    official_name VARCHAR(250),
    short_name VARCHAR(120),

    classification VARCHAR(100),
    hierarchy_level INTEGER NOT NULL,

    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    area_square_km NUMERIC(18, 4),
    elevation_meters NUMERIC(12, 2),

    effective_date DATE,
    end_date DATE,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    is_official BOOLEAN NOT NULL DEFAULT TRUE,
    is_operational BOOLEAN NOT NULL DEFAULT FALSE,

    source_name VARCHAR(150),
    source_version VARCHAR(100),

    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_units_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Superseded',
                'Archived'
            )
        ),

    CONSTRAINT geo_units_level_check
        CHECK (hierarchy_level >= 0),

    CONSTRAINT geo_units_latitude_check
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT geo_units_longitude_check
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        )
);

/* =========================================================
   GEOGRAPHIC ALIASES
========================================================= */

CREATE TABLE IF NOT EXISTS geo_unit_aliases (
    geo_unit_alias_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    geo_unit_id UUID NOT NULL
        REFERENCES geo_units(geo_unit_id)
        ON DELETE CASCADE,

    alias_name VARCHAR(250) NOT NULL,
    alias_type VARCHAR(80) NOT NULL DEFAULT 'Alternative Name',
    language_code VARCHAR(20),

    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_unit_aliases_unique
        UNIQUE (
            geo_unit_id,
            alias_name,
            alias_type
        )
);

/* =========================================================
   OPERATIONAL GEOGRAPHIC GROUPS
========================================================= */

CREATE TABLE IF NOT EXISTS geo_operational_groups (
    geo_operational_group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE,

    group_code VARCHAR(100) NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    group_type VARCHAR(100) NOT NULL,

    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_operational_groups_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Archived'
            )
        ),

    CONSTRAINT geo_operational_groups_unique
        UNIQUE (
            organization_id,
            group_code
        )
);

/* =========================================================
   OPERATIONAL GROUP MEMBERS
========================================================= */

CREATE TABLE IF NOT EXISTS geo_operational_group_members (
    geo_operational_group_member_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    geo_operational_group_id UUID NOT NULL
        REFERENCES geo_operational_groups(
            geo_operational_group_id
        )
        ON DELETE CASCADE,

    geo_unit_id UUID NOT NULL
        REFERENCES geo_units(geo_unit_id)
        ON DELETE CASCADE,

    member_role VARCHAR(80) NOT NULL DEFAULT 'Member',

    allocation_weight NUMERIC(12, 4),
    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_operational_group_members_unique
        UNIQUE (
            geo_operational_group_id,
            geo_unit_id
        )
);

/* =========================================================
   GEOGRAPHIC INTELLIGENCE VALUES
========================================================= */

CREATE TABLE IF NOT EXISTS geo_intelligence_values (
    geo_intelligence_value_id UUID
        PRIMARY KEY DEFAULT gen_random_uuid(),

    geo_unit_id UUID NOT NULL
        REFERENCES geo_units(geo_unit_id)
        ON DELETE CASCADE,

    indicator_code VARCHAR(120) NOT NULL,
    indicator_name VARCHAR(200) NOT NULL,

    value_type VARCHAR(30) NOT NULL,
    numeric_value NUMERIC(24, 6),
    text_value TEXT,
    boolean_value BOOLEAN,
    json_value JSONB,

    reference_year INTEGER,
    reference_date DATE,

    source_name VARCHAR(200),
    source_version VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT geo_intelligence_value_type_check
        CHECK (
            value_type IN (
                'integer',
                'decimal',
                'percentage',
                'string',
                'boolean',
                'json'
            )
        ),

    CONSTRAINT geo_intelligence_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Archived'
            )
        )
);

/* =========================================================
   INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_geo_unit_types_country
    ON geo_unit_types(country_id);

CREATE INDEX IF NOT EXISTS idx_geo_unit_types_level
    ON geo_unit_types(hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_geo_units_country
    ON geo_units(country_id);

CREATE INDEX IF NOT EXISTS idx_geo_units_type
    ON geo_units(geo_unit_type_id);

CREATE INDEX IF NOT EXISTS idx_geo_units_parent
    ON geo_units(parent_geo_unit_id);

CREATE INDEX IF NOT EXISTS idx_geo_units_official_code
    ON geo_units(official_code);

CREATE INDEX IF NOT EXISTS idx_geo_units_name
    ON geo_units(unit_name);

CREATE INDEX IF NOT EXISTS idx_geo_units_level
    ON geo_units(hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_geo_units_status
    ON geo_units(status);

CREATE INDEX IF NOT EXISTS idx_geo_operational_groups_org
    ON geo_operational_groups(organization_id);

CREATE INDEX IF NOT EXISTS idx_geo_group_members_group
    ON geo_operational_group_members(
        geo_operational_group_id
    );

CREATE INDEX IF NOT EXISTS idx_geo_group_members_unit
    ON geo_operational_group_members(geo_unit_id);

CREATE INDEX IF NOT EXISTS idx_geo_intelligence_unit
    ON geo_intelligence_values(geo_unit_id);

CREATE INDEX IF NOT EXISTS idx_geo_intelligence_indicator
    ON geo_intelligence_values(indicator_code);

/* =========================================================
   PHILIPPINES SEED
========================================================= */

INSERT INTO geo_countries (
    country_code,
    country_code_3,
    country_name,
    official_name,
    default_timezone,
    default_language,
    currency_code,
    status
)
VALUES (
    'PH',
    'PHL',
    'Philippines',
    'Republic of the Philippines',
    'Asia/Manila',
    'English',
    'PHP',
    'Active'
)
ON CONFLICT (country_code) DO NOTHING;

/* =========================================================
   PHILIPPINE UNIT TYPES
========================================================= */

INSERT INTO geo_unit_types (
    country_id,
    type_code,
    type_name,
    hierarchy_level,
    official_source,
    allows_children,
    is_official,
    is_operational
)
SELECT
    country_id,
    values_data.type_code,
    values_data.type_name,
    values_data.hierarchy_level,
    'Philippine Statistics Authority - PSGC',
    values_data.allows_children,
    values_data.is_official,
    values_data.is_operational
FROM geo_countries
CROSS JOIN (
    VALUES
        ('COUNTRY', 'Country', 0, TRUE, TRUE, FALSE),
        ('REGION', 'Region', 1, TRUE, TRUE, FALSE),
        ('PROVINCE', 'Province', 2, TRUE, TRUE, FALSE),
        (
            'HIGHLY_URBANIZED_CITY',
            'Highly Urbanized City',
            2,
            TRUE,
            TRUE,
            FALSE
        ),
        (
            'INDEPENDENT_COMPONENT_CITY',
            'Independent Component City',
            2,
            TRUE,
            TRUE,
            FALSE
        ),
        ('MUNICIPALITY', 'Municipality', 3, TRUE, TRUE, FALSE),
        (
            'COMPONENT_CITY',
            'Component City',
            3,
            TRUE,
            TRUE,
            FALSE
        ),
        ('BARANGAY', 'Barangay', 4, TRUE, TRUE, FALSE),
        ('PUROK', 'Purok', 5, TRUE, FALSE, TRUE),
        ('SITIO', 'Sitio', 5, TRUE, FALSE, TRUE),
        ('ZONE', 'Zone', 5, TRUE, FALSE, TRUE),
        (
            'OPERATIONAL_AREA',
            'Operational Area',
            6,
            TRUE,
            FALSE,
            TRUE
        )
) AS values_data (
    type_code,
    type_name,
    hierarchy_level,
    allows_children,
    is_official,
    is_operational
)
WHERE geo_countries.country_code = 'PH'
ON CONFLICT (country_id, type_code) DO NOTHING;

/* =========================================================
   PHILIPPINES ROOT UNIT
========================================================= */

INSERT INTO geo_units (
    country_id,
    geo_unit_type_id,
    parent_geo_unit_id,
    official_code,
    unit_name,
    official_name,
    short_name,
    classification,
    hierarchy_level,
    status,
    is_official,
    is_operational,
    source_name
)
SELECT
    country.country_id,
    unit_type.geo_unit_type_id,
    NULL,
    'PH',
    'Philippines',
    'Republic of the Philippines',
    'Philippines',
    'Country',
    0,
    'Active',
    TRUE,
    FALSE,
    'Philippine Statistics Authority - PSGC'
FROM geo_countries AS country
JOIN geo_unit_types AS unit_type
    ON unit_type.country_id = country.country_id
   AND unit_type.type_code = 'COUNTRY'
WHERE country.country_code = 'PH'
  AND NOT EXISTS (
      SELECT 1
      FROM geo_units
      WHERE official_code = 'PH'
        AND country_id = country.country_id
  );

COMMIT;
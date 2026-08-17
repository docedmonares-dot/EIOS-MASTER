BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_organization_id UUID
        REFERENCES organizations(organization_id)
        ON DELETE SET NULL,

    organization_code VARCHAR(80) NOT NULL UNIQUE,
    organization_name VARCHAR(200) NOT NULL,
    organization_short_name VARCHAR(100),

    organization_type VARCHAR(80) NOT NULL,
    legal_name VARCHAR(250),
    registration_number VARCHAR(120),
    tax_identification_number VARCHAR(80),

    country_code CHAR(2) NOT NULL DEFAULT 'PH',
    region_code VARCHAR(20),
    province_code VARCHAR(20),
    city_municipality_code VARCHAR(20),
    barangay_code VARCHAR(20),

    address_line_1 VARCHAR(250),
    address_line_2 VARCHAR(250),
    postal_code VARCHAR(20),

    official_email VARCHAR(180),
    official_phone VARCHAR(50),
    website_url VARCHAR(250),

    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    is_primary_organization BOOLEAN NOT NULL DEFAULT FALSE,

    settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    branding_json JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Suspended',
                'Archived'
            )
        ),

    CONSTRAINT organizations_type_check
        CHECK (
            organization_type IN (
                'Research Firm',
                'Local Government Unit',
                'National Government Agency',
                'Educational Institution',
                'Non-Government Organization',
                'Private Company',
                'Political Organization',
                'International Organization',
                'Other'
            )
        )
);

CREATE TABLE IF NOT EXISTS organization_units (
    organization_unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE,

    parent_unit_id UUID
        REFERENCES organization_units(organization_unit_id)
        ON DELETE SET NULL,

    unit_code VARCHAR(80) NOT NULL,
    unit_name VARCHAR(200) NOT NULL,
    unit_type VARCHAR(80) NOT NULL,

    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organization_units_unique_code
        UNIQUE (organization_id, unit_code),

    CONSTRAINT organization_units_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Archived'
            )
        )
);

CREATE TABLE IF NOT EXISTS organization_memberships (
    membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES organizations(organization_id)
        ON DELETE CASCADE,

    organization_unit_id UUID
        REFERENCES organization_units(organization_unit_id)
        ON DELETE SET NULL,

    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    membership_type VARCHAR(80) NOT NULL DEFAULT 'Member',
    position_title VARCHAR(150),

    is_primary_membership BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    start_date DATE,
    end_date DATE,

    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organization_memberships_unique
        UNIQUE (organization_id, user_id),

    CONSTRAINT organization_memberships_status_check
        CHECK (
            status IN (
                'Active',
                'Inactive',
                'Suspended',
                'Archived'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_organizations_parent
    ON organizations(parent_organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_type
    ON organizations(organization_type);

CREATE INDEX IF NOT EXISTS idx_organizations_status
    ON organizations(status);

CREATE INDEX IF NOT EXISTS idx_organization_units_organization
    ON organization_units(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_units_parent
    ON organization_units(parent_unit_id);

CREATE INDEX IF NOT EXISTS idx_organization_memberships_organization
    ON organization_memberships(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_memberships_user
    ON organization_memberships(user_id);

INSERT INTO organizations (
    organization_code,
    organization_name,
    organization_short_name,
    organization_type,
    country_code,
    status,
    is_primary_organization
)
SELECT
    'GZRC',
    'Global Zenith Research and Consulting, Inc.',
    'GZRC',
    'Research Firm',
    'PH',
    'Active',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM organizations
    WHERE organization_code = 'GZRC'
);

COMMIT;
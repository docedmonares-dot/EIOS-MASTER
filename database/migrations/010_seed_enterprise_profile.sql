BEGIN;

INSERT INTO enterprise_profile (
    organization_name,
    organization_short_name,
    platform_name,
    platform_short_name,
    mission,
    vision,
    official_tagline,
    country_code,
    timezone,
    default_language,
    status
)
SELECT
    'Global Zenith Research and Consulting, Inc.',
    'GZRC',
    'Enterprise Intelligence and Operations System',
    'EIOS',
    'To provide a unified, configurable, secure, real-time, and intelligence-driven enterprise platform for planning, managing, monitoring, validating, analyzing, and reporting survey, census, research, and field operations from the barangay level to nationwide operations.',
    'To become a trusted Philippine enterprise platform for evidence-based field operations, research intelligence, and executive decision support.',
    'One System. One Database. One Dashboard. One Truth.',
    'PH',
    'Asia/Manila',
    'English',
    'Active'
WHERE NOT EXISTS (
    SELECT 1
    FROM enterprise_profile
    WHERE status = 'Active'
);

COMMIT;
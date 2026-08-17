const pool = require("../config/database");

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* =========================================================
   GEOGRAPHIC SUMMARY
========================================================= */

exports.getGeographicSummary = async (req, res) => {
    try {
        const countryResult = await pool.query(`
            SELECT
                country_id,
                country_code,
                country_name,
                official_name,
                status
            FROM geo_countries
            WHERE country_code = 'PH'
            LIMIT 1
        `);

        const unitTypesResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS total
            FROM geo_unit_types
            WHERE country_id = (
                SELECT country_id
                FROM geo_countries
                WHERE country_code = 'PH'
            )
              AND is_active = TRUE
        `);

        const geographicUnitsResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS total
            FROM geo_units
            WHERE country_id = (
                SELECT country_id
                FROM geo_countries
                WHERE country_code = 'PH'
            )
              AND status = 'Active'
        `);

        const officialUnitsResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS total
            FROM geo_units
            WHERE country_id = (
                SELECT country_id
                FROM geo_countries
                WHERE country_code = 'PH'
            )
              AND status = 'Active'
              AND is_official = TRUE
        `);

        const operationalGroupsResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS total
            FROM geo_operational_groups
            WHERE status = 'Active'
        `);

        return res.json({
            success: true,
            data: {
                country: countryResult.rows[0] || null,
                total_unit_types:
                    unitTypesResult.rows[0]?.total || 0,
                total_geographic_units:
                    geographicUnitsResult.rows[0]?.total || 0,
                total_official_units:
                    officialUnitsResult.rows[0]?.total || 0,
                total_operational_groups:
                    operationalGroupsResult.rows[0]?.total || 0,
                executive_integration: "Connected"
            }
        });
    } catch (error) {
        console.error(
            "GET GEOGRAPHIC SUMMARY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load geographic summary.",
            error: error.message
        });
    }
};

/* =========================================================
   GEOGRAPHIC ROOT UNITS
========================================================= */

exports.getGeographicRoots = async (req, res) => {
    try {
        const countryCode = String(
            req.query.country_code || "PH"
        )
            .trim()
            .toUpperCase();

        const result = await pool.query(
            `
            SELECT
                unit.geo_unit_id,
                unit.parent_geo_unit_id,
                unit.official_code,
                unit.local_code,
                unit.unit_name,
                unit.official_name,
                unit.short_name,
                unit.classification,
                unit.hierarchy_level,
                unit.latitude,
                unit.longitude,
                unit.status,
                unit.is_official,
                unit.is_operational,
                type.type_code,
                type.type_name,
                country.country_code,
                country.country_name
            FROM geo_units AS unit
            JOIN geo_unit_types AS type
                ON type.geo_unit_type_id =
                   unit.geo_unit_type_id
            JOIN geo_countries AS country
                ON country.country_id =
                   unit.country_id
            WHERE unit.parent_geo_unit_id IS NULL
              AND unit.status = 'Active'
              AND country.country_code = $1
            ORDER BY
                unit.hierarchy_level,
                unit.unit_name
            `,
            [countryCode]
        );

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET GEOGRAPHIC ROOTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load geographic root units.",
            error: error.message
        });
    }
};

/* =========================================================
   GEOGRAPHIC CHILDREN
========================================================= */

exports.getGeographicChildren = async (req, res) => {
    try {
        const parentGeoUnitId = String(
            req.params.parentGeoUnitId || ""
        ).trim();

        if (!UUID_PATTERN.test(parentGeoUnitId)) {
            return res.status(400).json({
                success: false,
                message: "A valid parent geographic unit ID is required."
            });
        }

        const parentResult = await pool.query(
            `
            SELECT
                geo_unit_id,
                unit_name,
                hierarchy_level,
                status
            FROM geo_units
            WHERE geo_unit_id = $1
            LIMIT 1
            `,
            [parentGeoUnitId]
        );

        if (parentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Parent geographic unit was not found."
            });
        }

        const result = await pool.query(
            `
            SELECT
                unit.geo_unit_id,
                unit.parent_geo_unit_id,
                unit.official_code,
                unit.local_code,
                unit.unit_name,
                unit.official_name,
                unit.short_name,
                unit.classification,
                unit.hierarchy_level,
                unit.latitude,
                unit.longitude,
                unit.status,
                unit.is_official,
                unit.is_operational,
                type.type_code,
                type.type_name,
                type.allows_children
            FROM geo_units AS unit
            JOIN geo_unit_types AS type
                ON type.geo_unit_type_id =
                   unit.geo_unit_type_id
            WHERE unit.parent_geo_unit_id = $1
              AND unit.status = 'Active'
            ORDER BY
                unit.hierarchy_level,
                unit.unit_name
            `,
            [parentGeoUnitId]
        );

        return res.json({
            success: true,
            parent: parentResult.rows[0],
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET GEOGRAPHIC CHILDREN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load geographic child units.",
            error: error.message
        });
    }
};

/* =========================================================
   GEOGRAPHIC UNIT DETAILS
========================================================= */

exports.getGeographicUnitById = async (req, res) => {
    try {
        const geoUnitId = String(
            req.params.geoUnitId || ""
        ).trim();

        if (!UUID_PATTERN.test(geoUnitId)) {
            return res.status(400).json({
                success: false,
                message: "A valid geographic unit ID is required."
            });
        }

        const result = await pool.query(
            `
            SELECT
                unit.geo_unit_id,
                unit.parent_geo_unit_id,
                unit.official_code,
                unit.local_code,
                unit.unit_name,
                unit.official_name,
                unit.short_name,
                unit.classification,
                unit.hierarchy_level,
                unit.latitude,
                unit.longitude,
                unit.area_square_km,
                unit.elevation_meters,
                unit.effective_date,
                unit.end_date,
                unit.status,
                unit.is_official,
                unit.is_operational,
                unit.source_name,
                unit.source_version,
                unit.metadata_json,
                type.type_code,
                type.type_name,
                country.country_code,
                country.country_name
            FROM geo_units AS unit
            JOIN geo_unit_types AS type
                ON type.geo_unit_type_id =
                   unit.geo_unit_type_id
            JOIN geo_countries AS country
                ON country.country_id =
                   unit.country_id
            WHERE unit.geo_unit_id = $1
            LIMIT 1
            `,
            [geoUnitId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Geographic unit was not found."
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "GET GEOGRAPHIC UNIT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load geographic unit.",
            error: error.message
        });
    }
};
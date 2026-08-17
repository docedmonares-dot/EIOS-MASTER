const pool = require("../config/database");

/* ======================
   ENTERPRISE PROFILE
====================== */

exports.getEnterpriseProfile = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                profile_id,
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
                status,
                created_at,
                updated_at
            FROM enterprise_profile
            WHERE status = 'Active'
            ORDER BY created_at DESC
            LIMIT 1
        `);

        return res.json({
            success: true,
            data: result.rows[0] || null
        });
    } catch (error) {
        console.error("GET ENTERPRISE PROFILE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise profile.",
            error: error.message
        });
    }
};

/* ======================
   ENTERPRISE PRINCIPLES
====================== */

exports.getEnterprisePrinciples = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                principle_id,
                principle_code,
                principle_name,
                description,
                display_order,
                is_active,
                is_system_principle
            FROM enterprise_principles
            WHERE is_active = TRUE
            ORDER BY display_order, principle_name
        `);

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error("GET ENTERPRISE PRINCIPLES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise principles.",
            error: error.message
        });
    }
};

/* ======================
   ENTERPRISE SETTINGS
====================== */

exports.getEnterpriseSettings = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                setting_id,
                setting_key,
                setting_group,
                setting_label,
                setting_description,
                value_type,
                setting_value,
                default_value,
                allowed_values,
                validation_rules,
                is_sensitive,
                is_editable,
                is_active,
                updated_at
            FROM enterprise_settings
            WHERE is_active = TRUE
            ORDER BY setting_group, setting_label
        `);

        const groupedSettings = result.rows.reduce((groups, setting) => {
            const groupName = setting.setting_group;

            if (!groups[groupName]) {
                groups[groupName] = [];
            }

            groups[groupName].push(setting);

            return groups;
        }, {});

        return res.json({
            success: true,
            data: result.rows,
            grouped: groupedSettings
        });
    } catch (error) {
        console.error("GET ENTERPRISE SETTINGS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise settings.",
            error: error.message
        });
    }
};
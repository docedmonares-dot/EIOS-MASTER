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

function normalizeSettingValue(valueType, value) {
    const rawValue = String(value ?? "").trim();

    if (valueType === "boolean") {
        if (!["true", "false"].includes(rawValue.toLowerCase())) {
            throw new Error("The value must be true or false.");
        }
        return rawValue.toLowerCase();
    }

    if (valueType === "integer") {
        if (!/^-?\d+$/.test(rawValue)) {
            throw new Error("The value must be a whole number.");
        }
        return String(Number.parseInt(rawValue, 10));
    }

    if (valueType === "decimal") {
        const parsedValue = Number(rawValue);
        if (!Number.isFinite(parsedValue)) {
            throw new Error("The value must be a number.");
        }
        return String(parsedValue);
    }

    if (valueType === "json") {
        try {
            return JSON.stringify(JSON.parse(rawValue));
        } catch {
            throw new Error("The value must contain valid JSON.");
        }
    }

    if (!rawValue) {
        throw new Error("A setting value is required.");
    }

    if (valueType === "date" && Number.isNaN(Date.parse(`${rawValue}T00:00:00Z`))) {
        throw new Error("The value must be a valid date.");
    }

    if (valueType === "datetime" && Number.isNaN(Date.parse(rawValue))) {
        throw new Error("The value must be a valid date and time.");
    }

    return rawValue;
}

exports.updateEnterpriseSetting = async (req, res) => {
    const client = await pool.connect();

    try {
        const { settingId } = req.params;
        const { setting_value: submittedValue, change_reason: changeReason } = req.body;

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(settingId)) {
            return res.status(400).json({ success: false, message: "A valid setting ID is required." });
        }

        if (!String(changeReason || "").trim()) {
            return res.status(400).json({ success: false, message: "A change reason is required for the audit history." });
        }

        await client.query("BEGIN");

        const settingResult = await client.query(`
            SELECT setting_id, setting_key, value_type, setting_value,
                   allowed_values, validation_rules, is_editable, is_active
            FROM enterprise_settings
            WHERE setting_id = $1
            FOR UPDATE
        `, [settingId]);
        const setting = settingResult.rows[0];

        if (!setting || !setting.is_active) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Enterprise setting was not found." });
        }

        if (!setting.is_editable) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "This enterprise setting is read-only." });
        }

        let normalizedValue;
        try {
            normalizedValue = normalizeSettingValue(setting.value_type, submittedValue);
        } catch (validationError) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: validationError.message });
        }

        const allowedValues = Array.isArray(setting.allowed_values) ? setting.allowed_values.map(String) : [];
        if (allowedValues.length > 0 && !allowedValues.includes(normalizedValue)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "The value is not permitted for this setting." });
        }

        const numericValue = Number(normalizedValue);
        const rules = setting.validation_rules || {};
        if (["integer", "decimal"].includes(setting.value_type)) {
            if (rules.minimum != null && numericValue < Number(rules.minimum)) {
                await client.query("ROLLBACK");
                return res.status(400).json({ success: false, message: `The minimum permitted value is ${rules.minimum}.` });
            }
            if (rules.maximum != null && numericValue > Number(rules.maximum)) {
                await client.query("ROLLBACK");
                return res.status(400).json({ success: false, message: `The maximum permitted value is ${rules.maximum}.` });
            }
        }

        if (normalizedValue !== setting.setting_value) {
            await client.query(`
                INSERT INTO enterprise_setting_history
                    (setting_id, old_value, new_value, change_reason, changed_by)
                VALUES ($1, $2, $3, $4, $5)
            `, [settingId, setting.setting_value, normalizedValue, String(changeReason).trim(), req.user.user_id]);

            await client.query(`
                UPDATE enterprise_settings
                SET setting_value = $1, updated_by = $2, updated_at = NOW()
                WHERE setting_id = $3
            `, [normalizedValue, req.user.user_id, settingId]);
        }

        await client.query("COMMIT");
        return res.json({
            success: true,
            message: "Enterprise setting updated successfully.",
            data: { setting_id: settingId, setting_key: setting.setting_key, setting_value: normalizedValue }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("UPDATE ENTERPRISE SETTING ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to update enterprise setting." });
    } finally {
        client.release();
    }
};

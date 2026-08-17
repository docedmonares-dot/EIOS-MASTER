const pool = require("../config/database");

exports.getAllQuestionTypes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        question_type_id,
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
        is_active,
        created_by,
        updated_by,
        created_at,
        updated_at
      FROM question_types
      WHERE is_active = TRUE
      ORDER BY
        category_group,
        display_order,
        type_name
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Loading Question Types failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load Question Types.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};
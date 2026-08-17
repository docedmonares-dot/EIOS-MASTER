/* =========================================================
   BOOK III - GEOGRAPHIC MASTER QUESTION TYPE

   Registers the reusable Geographic Master selector in the
   enterprise question-type registry. Runtime behavior is
   resolved from this metadata, never from a question code.
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
VALUES (
    'GEOGRAPHIC_SELECTOR',
    'Geographic Selector',
    'Select an official location from the Enterprise Geographic Master hierarchy.',
    'Location and Media',
    'GeographicSelectorRenderer',
    'GeographicSelectorEditor',
    'GeographicSelectorPreview',
    'json',
    FALSE,
    TRUE,
    FALSE,
    FALSE,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    '["required"]'::jsonb,
    '{}'::jsonb,
    '{"country_code":"PH","root_label":"Select geographic area"}'::jsonb,
    '{"answer_schema":"eios.geographic-selection.v1","data_source":"ENTERPRISE_GEOGRAPHIC_MASTER"}'::jsonb,
    17,
    'MapPinned',
    'Use for official Philippine region, province, city/municipality, and barangay selection.',
    TRUE,
    TRUE
)
ON CONFLICT (type_code) DO UPDATE SET
    type_name = EXCLUDED.type_name,
    description = EXCLUDED.description,
    category_group = EXCLUDED.category_group,
    renderer_component = EXCLUDED.renderer_component,
    editor_component = EXCLUDED.editor_component,
    preview_component = EXCLUDED.preview_component,
    response_data_type = EXCLUDED.response_data_type,
    supports_offline = EXCLUDED.supports_offline,
    allowed_validation_rules = EXCLUDED.allowed_validation_rules,
    default_settings_json = EXCLUDED.default_settings_json,
    renderer_metadata_json = EXCLUDED.renderer_metadata_json,
    icon_name = EXCLUDED.icon_name,
    help_text = EXCLUDED.help_text,
    is_active = TRUE;

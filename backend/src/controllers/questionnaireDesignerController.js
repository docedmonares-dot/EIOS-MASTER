const pool = require("../config/database");

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const cleanedValue = String(value).trim();

    return cleanedValue || null;
}

function normalizeVariableName(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

async function getSurveyById(client, surveyId) {
    const result = await client.query(
        `
        SELECT
            survey.survey_id,
            survey.survey_code,
            survey.survey_name,
            survey.description,
            survey.survey_purpose,
            survey.publication_status,
            survey.status,
            survey.current_version_number,
            survey.planned_start_date,
            survey.planned_end_date,
            survey.organization_id,
            survey.coverage_level_id,
            survey.configuration_json,
            survey.created_at,
            survey.updated_at,

            coverage.coverage_code,
            coverage.coverage_name,

            organization.organization_name,
            organization.organization_short_name
        FROM surveys AS survey
        LEFT JOIN survey_coverage_levels AS coverage
            ON coverage.coverage_level_id =
               survey.coverage_level_id
        LEFT JOIN organizations AS organization
            ON organization.organization_id =
               survey.organization_id
        WHERE survey.survey_id = $1
        LIMIT 1
        `,
        [surveyId]
    );

    return result.rows[0] || null;
}

/* =========================================================
   DESIGNER WORKSPACE
========================================================= */

exports.getDesignerWorkspace = async (req, res) => {
    try {
        const surveyId = cleanText(req.params.surveyId);

        if (!surveyId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID is required."
            });
        }

        const survey = await getSurveyById(pool, surveyId);

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: "Survey project was not found."
            });
        }

        const sectionsResult = await pool.query(
            `
            SELECT
                section_id,
                survey_id,
                section_code,
                section_title,
                section_description,
                section_type,
                page_number,
                sort_order,
                is_repeatable,
                repeat_expression,
                visibility_expression,
                settings_json,
                is_active,
                created_at,
                updated_at
            FROM survey_sections
            WHERE survey_id = $1
              AND is_active = TRUE
            ORDER BY
                page_number,
                sort_order,
                section_title
            `,
            [surveyId]
        );

        const itemsResult = await pool.query(
            `
            SELECT
                item.questionnaire_item_id,
                item.survey_id,
                item.section_id,
                item.item_source,
                item.page_number,
                item.sort_order,
                item.required_override,
                item.label_override,
                item.item_settings_json,
                item.is_active,

                item.enterprise_question_id,
                item.local_question_id,

                COALESCE(
                    local.question_code,
                    bank.question_code
                ) AS question_code,

                COALESCE(
                    local.variable_name,
                    bank.variable_name
                ) AS variable_name,

                COALESCE(
                    local.question_text,
                    bank.question_text
                ) AS question_text,

                COALESCE(
                    local.question_description,
                    bank.question_description
                ) AS question_description,

                COALESCE(
                    local.help_text,
                    bank.help_text
                ) AS help_text,

                COALESCE(
                    local.placeholder_text,
                    bank.placeholder_text
                ) AS placeholder_text,

                COALESCE(
                    item.required_override,
                    local.required_flag,
                    bank.required_flag,
                    FALSE
                ) AS required_flag,

                COALESCE(
                    local.validation_rules_json,
                    bank.validation_rules_json,
                    '[]'::jsonb
                ) AS validation_rules_json,

                COALESCE(
                    local.appearance_json,
                    bank.appearance_json,
                    '{}'::jsonb
                ) AS appearance_json,

                COALESCE(
                    local.default_value_json,
                    bank.default_value_json,
                    '{}'::jsonb
                ) AS default_value_json,

                COALESCE(
                    local.settings_json,
                    bank.metadata_json,
                    '{}'::jsonb
                ) AS settings_json,

                COALESCE(
                    local.logic_enabled,
                    bank.logic_enabled,
                    FALSE
                ) AS logic_enabled,

                COALESCE(
                    local.calculation_expression,
                    bank.calculation_expression
                ) AS calculation_expression,

                COALESCE(
                    local.is_sensitive,
                    bank.is_sensitive,
                    FALSE
                ) AS is_sensitive,

                COALESCE(
                    local.is_personally_identifiable,
                    bank.is_personally_identifiable,
                    FALSE
                ) AS is_personally_identifiable,

                type.question_type_id,
                type.type_code,
                type.type_name,
                type.category_group,
                type.renderer_component,
                type.editor_component,
                type.preview_component,
                type.response_data_type,
                type.supports_options,
                type.supports_validation,
                type.supports_default_value,
                type.supports_calculation,
                type.supports_logic,
                type.supports_media,
                type.supports_repeat,
                type.supports_matrix,
                type.supports_offline,
                type.allowed_validation_rules,
                type.allowed_option_settings,
                type.default_settings_json,
                type.renderer_metadata_json,
                type.icon_name,

                COALESCE(
                    local.choice_list_id,
                    bank.choice_list_id
                ) AS choice_list_id,

                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'option_code', choice.choice_code,
                                'option_value', COALESCE(choice.text_value, choice.choice_code),
                                'option_label', choice.choice_label,
                                'sort_order', choice.display_order,
                                'is_none_option', choice.is_none_option,
                                'is_active', choice.is_active
                            )
                            ORDER BY choice.display_order, choice.choice_label
                        )
                        FROM question_choices AS choice
                        WHERE choice.choice_list_id = COALESCE(
                            local.choice_list_id,
                            bank.choice_list_id
                        )
                          AND choice.is_active = TRUE
                    ),
                    '[]'::jsonb
                ) AS choice_options
            FROM survey_questionnaire_items AS item
            LEFT JOIN survey_local_questions AS local
                ON local.local_question_id =
                   item.local_question_id
            LEFT JOIN question_bank AS bank
                ON bank.question_id =
                   item.enterprise_question_id
            LEFT JOIN question_types AS type
                ON type.question_type_id =
                   COALESCE(
                       local.question_type_id,
                       bank.question_type_id
                   )
            WHERE item.survey_id = $1
              AND item.is_active = TRUE
            ORDER BY
                item.page_number,
                item.sort_order,
                item.created_at
            `,
            [surveyId]
        );

        const toolboxResult = await pool.query(`
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
                help_text
            FROM question_types
            WHERE is_active = TRUE
            ORDER BY
                category_group,
                display_order,
                type_name
        `);

        const questionBankResult = await pool.query(`
            SELECT
                question.question_id,
                question.question_code,
                question.variable_name,
                question.question_text,
                question.question_description,
                question.help_text,
                question.placeholder_text,
                question.required_flag,
                question.options_json,
                question.default_value_json,
                question.validation_rules_json,
                question.appearance_json,
                question.logic_enabled,
                question.calculation_expression,
                question.is_sensitive,
                question.is_personally_identifiable,
                question.choice_list_id,
                question.question_status,
                question.question_group,
                question.question_module,
                question.version_number,

                category.category_id,
                category.category_code,
                category.category_name,

                type.question_type_id,
                type.type_code,
                type.type_name,
                type.category_group,
                type.icon_name
            FROM question_bank AS question
            LEFT JOIN question_categories AS category
                ON category.category_id =
                   question.question_category_id
            LEFT JOIN question_types AS type
                ON type.question_type_id =
                   question.question_type_id
            WHERE question.question_status = 'Active'
            ORDER BY
                category.sort_order NULLS LAST,
                question.question_text
        `);

        const designerStateResult = await pool.query(
            `
            SELECT
                designer_state_id,
                selected_section_id,
                selected_item_id,
                designer_state_json,
                last_saved_at
            FROM survey_designer_states
            WHERE survey_id = $1
              AND user_id = $2
            LIMIT 1
            `,
            [
                surveyId,
                req.user?.user_id ??
                    req.user?.id ??
                    null
            ]
        );

        return res.json({
            success: true,
            data: {
                survey,
                sections: sectionsResult.rows,
                questionnaire_items: itemsResult.rows,
                question_types: toolboxResult.rows,
                question_bank: questionBankResult.rows,
                designer_state:
                    designerStateResult.rows[0] || null
            }
        });
    } catch (error) {
        console.error(
            "GET QUESTIONNAIRE DESIGNER WORKSPACE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load the questionnaire designer workspace.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE SECTION
========================================================= */

exports.createSection = async (req, res) => {
    try {
        const surveyId = cleanText(req.params.surveyId);
        const sectionTitle = cleanText(
            req.body?.section_title
        );

        if (!surveyId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID is required."
            });
        }

        if (!sectionTitle) {
            return res.status(400).json({
                success: false,
                message: "Section title is required."
            });
        }

        const survey = await getSurveyById(pool, surveyId);

        if (!survey) {
            return res.status(404).json({
                success: false,
                message: "Survey project was not found."
            });
        }

        const sectionType =
            cleanText(req.body?.section_type) ||
            "Standard";

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const nextOrderResult = await pool.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                    AS next_sort_order
            FROM survey_sections
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        const result = await pool.query(
            `
            INSERT INTO survey_sections (
                survey_id,
                section_code,
                section_title,
                section_description,
                section_type,
                page_number,
                sort_order,
                is_repeatable,
                repeat_expression,
                visibility_expression,
                settings_json,
                is_active,
                created_by,
                updated_by
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11::jsonb,
                TRUE,
                $12,
                $12
            )
            RETURNING *
            `,
            [
                surveyId,
                cleanText(req.body?.section_code),
                sectionTitle,
                cleanText(req.body?.section_description),
                sectionType,
                Number(req.body?.page_number) || 1,
                nextOrderResult.rows[0]
                    ?.next_sort_order || 1,
                Boolean(req.body?.is_repeatable),
                cleanText(req.body?.repeat_expression),
                cleanText(
                    req.body?.visibility_expression
                ),
                JSON.stringify(
                    req.body?.settings_json || {}
                ),
                requestedBy
            ]
        );

        const createdSection = result.rows[0];

        await pool.query(
            `
            INSERT INTO survey_designer_events (
                survey_id,
                section_id,
                event_type,
                event_message,
                new_value_json,
                acted_by
            )
            VALUES (
                $1,
                $2,
                'SECTION_CREATED',
                'Questionnaire section created.',
                $3::jsonb,
                $4
            )
            `,
            [
                surveyId,
                createdSection.section_id,
                JSON.stringify(createdSection),
                requestedBy
            ]
        );

        const io = req.app.get("io");

        if (io) {
            io.emit(
                "questionnaire-section-created",
                createdSection
            );
        }

        return res.status(201).json({
            success: true,
            message: "Section created successfully.",
            data: createdSection
        });
    } catch (error) {
        console.error(
            "CREATE QUESTIONNAIRE SECTION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create questionnaire section.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE SURVEY-LOCAL QUESTION
========================================================= */

exports.createLocalQuestion = async (req, res) => {
    const client = await pool.connect();

    try {
        const surveyId = cleanText(req.params.surveyId);
        const sectionId = cleanText(req.body?.section_id);
        const questionTypeId = cleanText(
            req.body?.question_type_id
        );
        const questionText = cleanText(
            req.body?.question_text
        );

        if (!surveyId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID is required."
            });
        }

        if (!questionTypeId) {
            return res.status(400).json({
                success: false,
                message: "Question type is required."
            });
        }

        if (!questionText) {
            return res.status(400).json({
                success: false,
                message: "Question text is required."
            });
        }

        const variableName = normalizeVariableName(
            req.body?.variable_name ||
                questionText
        );

        if (!variableName) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid variable name could not be generated."
            });
        }

        await client.query("BEGIN");

        const survey = await getSurveyById(client, surveyId);

        if (!survey) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Survey project was not found."
            });
        }

        const questionTypeResult =
            await client.query(
                `
                SELECT
                    question_type_id,
                    type_code,
                    type_name,
                    default_settings_json
                FROM question_types
                WHERE question_type_id = $1
                  AND is_active = TRUE
                LIMIT 1
                `,
                [questionTypeId]
            );

        if (questionTypeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "The selected question type was not found."
            });
        }

        if (sectionId) {
            const sectionResult = await client.query(
                `
                SELECT section_id
                FROM survey_sections
                WHERE section_id = $1
                  AND survey_id = $2
                  AND is_active = TRUE
                LIMIT 1
                `,
                [sectionId, surveyId]
            );

            if (sectionResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "The selected questionnaire section was not found."
                });
            }
        }

        const duplicateVariableResult =
            await client.query(
                `
                SELECT local_question_id
                FROM survey_local_questions
                WHERE survey_id = $1
                  AND LOWER(variable_name) =
                      LOWER($2)
                LIMIT 1
                `,
                [surveyId, variableName]
            );

        if (
            duplicateVariableResult.rows.length > 0
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "The variable name is already used in this survey."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const nextOrderResult = await client.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                    AS next_sort_order
            FROM survey_questionnaire_items
            WHERE survey_id = $1
              AND (
                    section_id = $2
                    OR (
                        section_id IS NULL
                        AND $2 IS NULL
                    )
                  )
            `,
            [surveyId, sectionId]
        );

        const questionCode =
            cleanText(req.body?.question_code) ||
            `Q-${Date.now()}`;

        const defaultSettings =
            questionTypeResult.rows[0]
                ?.default_settings_json || {};

        const localQuestionResult =
            await client.query(
                `
                INSERT INTO survey_local_questions (
                    survey_id,
                    section_id,
                    question_type_id,
                    choice_list_id,
                    question_code,
                    variable_name,
                    question_text,
                    question_description,
                    help_text,
                    placeholder_text,
                    required_flag,
                    default_value_json,
                    validation_rules_json,
                    appearance_json,
                    settings_json,
                    metadata_json,
                    logic_enabled,
                    calculation_expression,
                    is_sensitive,
                    is_personally_identifiable,
                    page_number,
                    sort_order,
                    question_status,
                    is_active,
                    created_by,
                    updated_by
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11,
                    $12::jsonb,
                    $13::jsonb,
                    $14::jsonb,
                    $15::jsonb,
                    $16::jsonb,
                    $17,
                    $18,
                    $19,
                    $20,
                    $21,
                    $22,
                    'Draft',
                    TRUE,
                    $23,
                    $23
                )
                RETURNING *
                `,
                [
                    surveyId,
                    sectionId,
                    questionTypeId,
                    cleanText(req.body?.choice_list_id),
                    questionCode,
                    variableName,
                    questionText,
                    cleanText(
                        req.body?.question_description
                    ),
                    cleanText(req.body?.help_text),
                    cleanText(
                        req.body?.placeholder_text
                    ),
                    Boolean(req.body?.required_flag),
                    JSON.stringify(
                        req.body?.default_value_json || {}
                    ),
                    JSON.stringify(
                        req.body
                            ?.validation_rules_json || []
                    ),
                    JSON.stringify(
                        req.body?.appearance_json || {}
                    ),
                    JSON.stringify({
                        ...defaultSettings,
                        ...(req.body?.settings_json || {})
                    }),
                    JSON.stringify(
                        req.body?.metadata_json || {}
                    ),
                    Boolean(req.body?.logic_enabled),
                    cleanText(
                        req.body
                            ?.calculation_expression
                    ),
                    Boolean(req.body?.is_sensitive),
                    Boolean(
                        req.body
                            ?.is_personally_identifiable
                    ),
                    Number(req.body?.page_number) || 1,
                    nextOrderResult.rows[0]
                        ?.next_sort_order || 1,
                    requestedBy
                ]
            );

        const localQuestion =
            localQuestionResult.rows[0];

        const itemResult = await client.query(
            `
            INSERT INTO survey_questionnaire_items (
                survey_id,
                section_id,
                enterprise_question_id,
                local_question_id,
                item_source,
                page_number,
                sort_order,
                required_override,
                label_override,
                item_settings_json,
                is_active,
                created_by,
                updated_by
            )
            VALUES (
                $1,
                $2,
                NULL,
                $3,
                'Survey Local',
                $4,
                $5,
                NULL,
                NULL,
                '{}'::jsonb,
                TRUE,
                $6,
                $6
            )
            RETURNING *
            `,
            [
                surveyId,
                sectionId,
                localQuestion.local_question_id,
                localQuestion.page_number,
                localQuestion.sort_order,
                requestedBy
            ]
        );

        await client.query(
            `
            INSERT INTO survey_designer_events (
                survey_id,
                section_id,
                questionnaire_item_id,
                event_type,
                event_message,
                new_value_json,
                acted_by
            )
            VALUES (
                $1,
                $2,
                $3,
                'LOCAL_QUESTION_CREATED',
                'Survey-local question created.',
                $4::jsonb,
                $5
            )
            `,
            [
                surveyId,
                sectionId,
                itemResult.rows[0]
                    .questionnaire_item_id,
                JSON.stringify({
                    question: localQuestion,
                    item: itemResult.rows[0]
                }),
                requestedBy
            ]
        );

        await client.query("COMMIT");

        const io = req.app.get("io");

        if (io) {
            io.emit(
                "questionnaire-item-created",
                {
                    question: localQuestion,
                    item: itemResult.rows[0]
                }
            );
        }

        return res.status(201).json({
            success: true,
            message:
                "Survey-local question created successfully.",
            data: {
                question: localQuestion,
                item: itemResult.rows[0],
                question_type:
                    questionTypeResult.rows[0]
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "CREATE SURVEY LOCAL QUESTION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create the survey-local question.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

/* =========================================================
   ADD ENTERPRISE QUESTION TO SURVEY
========================================================= */

exports.addEnterpriseQuestion = async (req, res) => {
    try {
        const surveyId = cleanText(req.params.surveyId);
        const questionId = cleanText(
            req.body?.question_id
        );
        const sectionId = cleanText(
            req.body?.section_id
        );

        if (!surveyId || !questionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Survey ID and enterprise question ID are required."
            });
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const questionResult = await pool.query(
            `
            SELECT
                question_id,
                question_code,
                question_text,
                question_type_id,
                required_flag
            FROM question_bank
            WHERE question_id = $1
              AND question_status = 'Active'
            LIMIT 1
            `,
            [questionId]
        );

        if (questionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Enterprise question was not found."
            });
        }

        const duplicateResult = await pool.query(
            `
            SELECT questionnaire_item_id
            FROM survey_questionnaire_items
            WHERE survey_id = $1
              AND enterprise_question_id = $2
              AND is_active = TRUE
            LIMIT 1
            `,
            [surveyId, questionId]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This enterprise question is already in the survey."
            });
        }

        const nextOrderResult = await pool.query(
            `
            SELECT
                COALESCE(MAX(sort_order), 0) + 1
                    AS next_sort_order
            FROM survey_questionnaire_items
            WHERE survey_id = $1
              AND (
                    section_id = $2
                    OR (
                        section_id IS NULL
                        AND $2 IS NULL
                    )
                  )
            `,
            [surveyId, sectionId]
        );

        const result = await pool.query(
            `
            INSERT INTO survey_questionnaire_items (
                survey_id,
                section_id,
                enterprise_question_id,
                local_question_id,
                item_source,
                page_number,
                sort_order,
                required_override,
                label_override,
                item_settings_json,
                is_active,
                created_by,
                updated_by
            )
            VALUES (
                $1,
                $2,
                $3,
                NULL,
                'Enterprise Question Bank',
                1,
                $4,
                NULL,
                NULL,
                '{}'::jsonb,
                TRUE,
                $5,
                $5
            )
            RETURNING *
            `,
            [
                surveyId,
                sectionId,
                questionId,
                nextOrderResult.rows[0]
                    ?.next_sort_order || 1,
                requestedBy
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Enterprise question added successfully.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error(
            "ADD ENTERPRISE QUESTION ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to add the enterprise question.",
            error: error.message
        });
    }
};

/* =========================================================
   UPDATE QUESTIONNAIRE ITEM
========================================================= */

exports.updateQuestionnaireItem = async (req, res) => {
    const client = await pool.connect();

    try {
        const surveyId = cleanText(req.params.surveyId);
        const itemId = cleanText(req.params.itemId);

        if (!surveyId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID is required."
            });
        }

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Questionnaire item ID is required."
            });
        }

        await client.query("BEGIN");

        const itemResult = await client.query(
            `
            SELECT
                item.questionnaire_item_id,
                item.survey_id,
                item.section_id,
                item.enterprise_question_id,
                item.local_question_id,
                item.item_source,
                item.page_number,
                item.sort_order,
                item.required_override,
                item.label_override,
                item.item_settings_json,
                item.is_active
                ,local.choice_list_id
                ,local.settings_json AS question_settings_json
            FROM survey_questionnaire_items AS item
            LEFT JOIN survey_local_questions AS local
                ON local.local_question_id = item.local_question_id
            WHERE item.questionnaire_item_id = $1
              AND item.survey_id = $2
              AND item.is_active = TRUE
            LIMIT 1
            `,
            [itemId, surveyId]
        );

        if (itemResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Questionnaire item was not found."
            });
        }

        const existingItem = itemResult.rows[0];

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const requestedSectionId = cleanText(
            req.body?.section_id
        );

        if (requestedSectionId) {
            const sectionResult = await client.query(
                `
                SELECT section_id
                FROM survey_sections
                WHERE section_id = $1
                  AND survey_id = $2
                  AND is_active = TRUE
                LIMIT 1
                `,
                [requestedSectionId, surveyId]
            );

            if (sectionResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "The selected questionnaire section was not found."
                });
            }
        }

        let updatedQuestion = null;

        if (
            existingItem.item_source === "Survey Local" &&
            existingItem.local_question_id
        ) {
            const questionTypeId = cleanText(
                req.body?.question_type_id
            );

            if (!questionTypeId) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Question type is required."
                });
            }

            const questionText = cleanText(
                req.body?.question_text
            );

            if (!questionText) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Question text is required."
                });
            }

            const variableName = normalizeVariableName(
                req.body?.variable_name ||
                    questionText
            );

            if (!variableName) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "A valid variable name could not be generated."
                });
            }

            const questionTypeResult =
                await client.query(
                    `
                    SELECT question_type_id
                    FROM question_types
                    WHERE question_type_id = $1
                      AND is_active = TRUE
                    LIMIT 1
                    `,
                    [questionTypeId]
                );

            if (
                questionTypeResult.rows.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "The selected question type was not found."
                });
            }

            const duplicateVariableResult =
                await client.query(
                    `
                    SELECT local_question_id
                    FROM survey_local_questions
                    WHERE survey_id = $1
                      AND LOWER(variable_name) =
                          LOWER($2)
                      AND local_question_id <> $3
                    LIMIT 1
                    `,
                    [
                        surveyId,
                        variableName,
                        existingItem.local_question_id
                    ]
                );

            if (
                duplicateVariableResult.rows.length > 0
            ) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message:
                        "The variable name is already used in this survey."
                });
            }

            const localQuestionResult =
                await client.query(
                    `
                    UPDATE survey_local_questions
                    SET
                        section_id = $1,
                        question_type_id = $2,
                        choice_list_id = COALESCE($3, choice_list_id),
                        question_text = $4,
                        question_description = $5,
                        variable_name = $6,
                        help_text = $7,
                        placeholder_text = $8,
                        required_flag = $9,
                        default_value_json = $10::jsonb,
                        validation_rules_json = $11::jsonb,
                        appearance_json = $12::jsonb,
                        settings_json = $13::jsonb,
                        metadata_json = $14::jsonb,
                        logic_enabled = $15,
                        calculation_expression = $16,
                        is_sensitive = $17,
                        is_personally_identifiable = $18,
                        page_number = $19,
                        sort_order = $20,
                        updated_by = $21,
                        updated_at = NOW()
                    WHERE local_question_id = $22
                      AND survey_id = $23
                      AND is_active = TRUE
                    RETURNING *
                    `,
                    [
                        requestedSectionId,
                        questionTypeId,
                        cleanText(
                            req.body?.choice_list_id ||
                                existingItem.choice_list_id
                        ),
                        questionText,
                        cleanText(
                            req.body
                                ?.question_description
                        ),
                        variableName,
                        cleanText(req.body?.help_text),
                        cleanText(
                            req.body?.placeholder_text
                        ),
                        Boolean(
                            req.body?.required_flag
                        ),
                        JSON.stringify(
                            req.body
                                ?.default_value_json || {}
                        ),
                        JSON.stringify(
                            req.body
                                ?.validation_rules_json || []
                        ),
                        JSON.stringify(
                            req.body?.appearance_json || {}
                        ),
                        JSON.stringify(
                            req.body?.settings_json || {}
                        ),
                        JSON.stringify(
                            req.body?.metadata_json || {}
                        ),
                        Boolean(
                            req.body?.logic_enabled
                        ),
                        cleanText(
                            req.body
                                ?.calculation_expression
                        ),
                        Boolean(
                            req.body?.is_sensitive
                        ),
                        Boolean(
                            req.body
                                ?.is_personally_identifiable
                        ),
                        Number(req.body?.page_number) ||
                            existingItem.page_number ||
                            1,
                        Number(req.body?.sort_order) ||
                            existingItem.sort_order ||
                            0,
                        requestedBy,
                        existingItem.local_question_id,
                        surveyId
                    ]
                );

            updatedQuestion =
                localQuestionResult.rows[0] || null;

            const electionPosition =
                req.body?.settings_json
                    ?.election_position;

            if (
                electionPosition?.position_code &&
                typeof electionPosition.is_applicable === "boolean"
            ) {
                await client.query(
                    `
                    UPDATE survey_local_questions
                    SET
                        settings_json = jsonb_set(
                            COALESCE(settings_json, '{}'::jsonb),
                            '{election_position,is_applicable}',
                            to_jsonb($1::boolean),
                            TRUE
                        ),
                        updated_by = $2,
                        updated_at = NOW()
                    WHERE survey_id = $3
                      AND is_active = TRUE
                      AND settings_json
                          -> 'election_position'
                          ->> 'position_code' = $4
                    `,
                    [
                        electionPosition.is_applicable,
                        requestedBy,
                        surveyId,
                        electionPosition.position_code
                    ]
                );
            }

            if (
                Array.isArray(req.body?.choice_options) &&
                existingItem.choice_list_id
            ) {
                const editableListResult = await client.query(
                    `SELECT choice_list_id
                     FROM question_choice_lists
                     WHERE choice_list_id = $1
                       AND is_system_list = FALSE
                       AND is_active = TRUE
                     LIMIT 1`,
                    [existingItem.choice_list_id]
                );

                if (editableListResult.rows.length === 0) {
                    throw new Error(
                        "This question uses a governed system choice list that cannot be edited here."
                    );
                }

                await client.query(
                    "DELETE FROM question_choices WHERE choice_list_id = $1",
                    [existingItem.choice_list_id]
                );

                for (const [optionIndex, option] of req.body.choice_options.entries()) {
                    const optionCode = normalizeVariableName(
                        option?.option_code ||
                            `candidate_${optionIndex + 1}`
                    ).toUpperCase();
                    const optionLabel = cleanText(
                        option?.option_label
                    );

                    if (!optionCode || !optionLabel) {
                        throw new Error(
                            "Every candidate option requires a stable code and display label."
                        );
                    }

                    await client.query(
                        `INSERT INTO question_choices (
                            choice_list_id, choice_code, choice_label,
                            text_value, display_order, is_none_option,
                            is_active, metadata_json, created_by, updated_by
                         ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, '{}'::jsonb, $7, $7)`,
                        [
                            existingItem.choice_list_id,
                            optionCode,
                            optionLabel,
                            optionCode,
                            optionIndex + 1,
                            optionCode === "UNDECIDED",
                            requestedBy
                        ]
                    );
                }
            }
        }

        const itemSettingsJson =
            req.body?.item_settings_json ||
            existingItem.item_settings_json ||
            {};

        const itemUpdateResult =
            await client.query(
                `
                UPDATE survey_questionnaire_items
                SET
                    section_id = $1,
                    page_number = $2,
                    sort_order = $3,
                    required_override = $4,
                    label_override = $5,
                    item_settings_json = $6::jsonb,
                    updated_by = $7,
                    updated_at = NOW()
                WHERE questionnaire_item_id = $8
                  AND survey_id = $9
                  AND is_active = TRUE
                RETURNING *
                `,
                [
                    requestedSectionId,
                    Number(req.body?.page_number) ||
                        existingItem.page_number ||
                        1,
                    Number(req.body?.sort_order) ||
                        existingItem.sort_order ||
                        0,
                    req.body?.required_override !==
                    undefined
                        ? Boolean(
                            req.body
                                .required_override
                        )
                        : req.body?.required_flag !==
                          undefined
                            ? Boolean(
                                req.body
                                    .required_flag
                            )
                            : existingItem
                                .required_override,
                    cleanText(
                        req.body?.label_override
                    ),
                    JSON.stringify(
                        itemSettingsJson
                    ),
                    requestedBy,
                    itemId,
                    surveyId
                ]
            );

        const updatedItem =
            itemUpdateResult.rows[0];

        await client.query(
            `
            INSERT INTO survey_designer_events (
                survey_id,
                section_id,
                questionnaire_item_id,
                event_type,
                event_message,
                previous_value_json,
                new_value_json,
                acted_by
            )
            VALUES (
                $1,
                $2,
                $3,
                'QUESTIONNAIRE_ITEM_UPDATED',
                'Questionnaire item updated.',
                $4::jsonb,
                $5::jsonb,
                $6
            )
            `,
            [
                surveyId,
                requestedSectionId,
                itemId,
                JSON.stringify(existingItem),
                JSON.stringify({
                    item: updatedItem,
                    question: updatedQuestion
                }),
                requestedBy
            ]
        );

        await client.query("COMMIT");

        const io = req.app.get("io");

        if (io) {
            io.emit(
                "questionnaire-item-updated",
                {
                    survey_id: surveyId,
                    questionnaire_item_id:
                        itemId,
                    item: updatedItem,
                    question: updatedQuestion
                }
            );
        }

        return res.json({
            success: true,
            message:
                "Questionnaire item updated successfully.",
            data: {
                item: updatedItem,
                question: updatedQuestion
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "UPDATE QUESTIONNAIRE ITEM ERROR:",
            error
        );

        if (
            error.code === "23505"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "The question code or variable name is already used in this survey.",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to update the questionnaire item.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

exports.updateSection = async (req, res) => {
    try {
        const surveyId = cleanText(req.params?.surveyId);
        const sectionId = cleanText(req.params?.sectionId);

        if (!surveyId || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID and section ID are required."
            });
        }

        const existingResult = await pool.query(
            `SELECT * FROM survey_sections
             WHERE survey_id = $1 AND section_id = $2 AND is_active = TRUE
             LIMIT 1`,
            [surveyId, sectionId]
        );
        const existing = existingResult.rows[0];

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Questionnaire section was not found."
            });
        }

        const nextSettings = {
            ...(existing.settings_json || {}),
            ...(req.body?.settings_json || {})
        };
        const requestedBy = req.user?.user_id || existing.updated_by;

        const result = await pool.query(
            `UPDATE survey_sections
             SET section_title = $1,
                 section_description = $2,
                 section_type = $3,
                 settings_json = $4::jsonb,
                 updated_by = $5,
                 updated_at = NOW()
             WHERE survey_id = $6 AND section_id = $7 AND is_active = TRUE
             RETURNING *`,
            [
                cleanText(req.body?.section_title) || existing.section_title,
                req.body?.section_description !== undefined
                    ? cleanText(req.body.section_description)
                    : existing.section_description,
                cleanText(req.body?.section_type) || existing.section_type,
                JSON.stringify(nextSettings),
                requestedBy,
                surveyId,
                sectionId
            ]
        );

        return res.json({
            success: true,
            message: nextSettings.is_applicable === false
                ? "Section excluded from the compiled instrument."
                : "Section included in the compiled instrument.",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("UPDATE QUESTIONNAIRE SECTION ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update the questionnaire section.",
            error: error.message
        });
    }
};

exports.deleteQuestionnaireItem = async (req, res) => {
    const client = await pool.connect();

    try {
        const surveyId = cleanText(req.params?.surveyId);
        const itemId = cleanText(req.params?.itemId);

        if (!surveyId || !itemId) {
            return res.status(400).json({
                success: false,
                message: "Survey ID and questionnaire item ID are required."
            });
        }

        await client.query("BEGIN");
        const itemResult = await client.query(
            `SELECT * FROM survey_questionnaire_items
             WHERE survey_id = $1
               AND questionnaire_item_id = $2
               AND is_active = TRUE
             FOR UPDATE`,
            [surveyId, itemId]
        );
        const item = itemResult.rows[0];

        if (!item) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Questionnaire item was not found."
            });
        }

        const requestedBy = req.user?.user_id || req.user?.id || null;

        await client.query(
            `UPDATE survey_questionnaire_items
             SET is_active = FALSE, updated_by = $1, updated_at = NOW()
             WHERE questionnaire_item_id = $2`,
            [requestedBy, itemId]
        );

        if (item.item_source === "Survey Local" && item.local_question_id) {
            await client.query(
                `UPDATE survey_local_questions
                 SET is_active = FALSE, updated_by = $1, updated_at = NOW()
                 WHERE local_question_id = $2 AND survey_id = $3`,
                [requestedBy, item.local_question_id, surveyId]
            );
        }

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Question removed from the draft instrument.",
            data: { questionnaire_item_id: itemId, archived: true }
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("DELETE QUESTIONNAIRE ITEM ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove the questionnaire item.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

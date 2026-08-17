function toIsoString(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function normalizeJson(value, fallback) {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    return value;
}

function buildQuestionTypeDefinition(
    questionType
) {
    if (!questionType) {
        return null;
    }

    return {
        question_type_id:
            questionType.question_type_id,

        type_code:
            questionType.type_code,

        type_name:
            questionType.type_name,

        category_group:
            questionType.category_group,

        response_data_type:
            questionType.response_data_type,

        renderer_component:
            questionType.renderer_component,

        preview_component:
            questionType.preview_component,

        supports_options:
            Boolean(
                questionType.supports_options
            ),

        supports_validation:
            Boolean(
                questionType.supports_validation
            ),

        supports_default_value:
            Boolean(
                questionType.supports_default_value
            ),

        supports_calculation:
            Boolean(
                questionType.supports_calculation
            ),

        supports_logic:
            Boolean(
                questionType.supports_logic
            ),

        supports_media:
            Boolean(
                questionType.supports_media
            ),

        supports_repeat:
            Boolean(
                questionType.supports_repeat
            ),

        supports_matrix:
            Boolean(
                questionType.supports_matrix
            ),

        supports_offline:
            Boolean(
                questionType.supports_offline
            ),

        allowed_validation_rules:
            normalizeJson(
                questionType
                    .allowed_validation_rules,
                []
            ),

        allowed_option_settings:
            normalizeJson(
                questionType
                    .allowed_option_settings,
                {}
            ),

        default_settings:
            normalizeJson(
                questionType
                    .default_settings_json,
                {}
            ),

        renderer_metadata:
            normalizeJson(
                questionType
                    .renderer_metadata_json,
                {}
            ),

        icon_name:
            questionType.icon_name || null,
    };
}

function buildQuestionDefinition(item) {
    const question = item.question;

    if (!question) {
        return null;
    }

    return {
        questionnaire_item_id:
            item.questionnaire_item_id,

        item_source:
            item.item_source,

        local_question_id:
            question.local_question_id ||
            null,

        enterprise_question_id:
            question.question_id ||
            null,

        section_id:
            item.section_id,

        page_number:
            Number(item.page_number || 1),

        sort_order:
            Number(item.sort_order || 0),

        question_code:
            question.question_code || null,

        variable_name:
            question.variable_name || null,

        question_text:
            question.question_text || "",

        question_description:
            question.question_description ||
            null,

        help_text:
            question.help_text || null,

        placeholder_text:
            question.placeholder_text ||
            null,

        required:
            Boolean(
                question.required_flag
            ),

        choice_list_id:
            question.choice_list_id || null,

        default_value:
            normalizeJson(
                question.default_value_json,
                {}
            ),

        validation_rules:
            normalizeJson(
                question.validation_rules_json,
                []
            ),

        appearance:
            normalizeJson(
                question.appearance_json,
                {}
            ),

        settings: {
            ...normalizeJson(
                question.settings_json,
                {}
            ),

            ...normalizeJson(
                question.item_settings_json,
                {}
            ),
        },

        metadata:
            normalizeJson(
                question.metadata_json,
                {}
            ),

        logic_enabled:
            Boolean(
                question.logic_enabled
            ),

        calculation_expression:
            question.calculation_expression ||
            null,

        is_sensitive:
            Boolean(
                question.is_sensitive
            ),

        is_personally_identifiable:
            Boolean(
                question
                    .is_personally_identifiable
            ),

        question_type:
            buildQuestionTypeDefinition(
                item.question_type
            ),

        runtime: item.question_type
            ? {
                type_code:
                    item.question_type.type_code,
                renderer_component:
                    item.question_type.renderer_component,
                preview_component:
                    item.question_type.preview_component,
                response_data_type:
                    item.question_type.response_data_type,
                renderer_metadata:
                    normalizeJson(
                        item.question_type.renderer_metadata_json,
                        {}
                    ),
            }
            : null,

        choice_list:
            item.choice_list
                ? {
                    ...item.choice_list,

                    settings_json:
                        normalizeJson(
                            item.choice_list
                                .settings_json,
                            {}
                        ),
                }
                : null,
    };
}

function buildSectionDefinition(
    section,
    resolvedItems
) {
    const sectionItems = resolvedItems
        .filter(
            (item) =>
                item.section_id ===
                section.section_id
        )
        .sort((leftItem, rightItem) => {
            const pageDifference =
                Number(
                    leftItem.page_number || 1
                ) -
                Number(
                    rightItem.page_number || 1
                );

            if (pageDifference !== 0) {
                return pageDifference;
            }

            return (
                Number(
                    leftItem.sort_order || 0
                ) -
                Number(
                    rightItem.sort_order || 0
                )
            );
        })
        .map(buildQuestionDefinition)
        .filter(Boolean);

    return {
        section_id:
            section.section_id,

        section_code:
            section.section_code || null,

        section_title:
            section.section_title || "",

        section_description:
            section.section_description ||
            null,

        section_type:
            section.section_type ||
            "Standard",

        page_number:
            Number(section.page_number || 1),

        sort_order:
            Number(section.sort_order || 0),

        is_repeatable:
            Boolean(
                section.is_repeatable
            ),

        repeat_expression:
            section.repeat_expression ||
            null,

        visibility_expression:
            section.visibility_expression ||
            null,

        settings:
            normalizeJson(
                section.settings_json,
                {}
            ),

        questions: sectionItems,
    };
}

function buildUnassignedSection(
    resolvedItems
) {
    const questions = resolvedItems
        .filter((item) => !item.section_id)
        .sort(
            (leftItem, rightItem) =>
                Number(
                    leftItem.sort_order || 0
                ) -
                Number(
                    rightItem.sort_order || 0
                )
        )
        .map(buildQuestionDefinition)
        .filter(Boolean);

    if (questions.length === 0) {
        return null;
    }

    return {
        section_id: null,
        section_code: "UNASSIGNED",
        section_title:
            "Unassigned Questions",
        section_description:
            "Questions not assigned to an active section.",
        section_type: "System",
        page_number: 0,
        sort_order: 0,
        is_repeatable: false,
        repeat_expression: null,
        visibility_expression: null,
        settings: {
            system_generated: true,
        },
        questions,
    };
}

function buildVariableIndex(sections) {
    const variableIndex = {};

    sections.forEach((section) => {
        section.questions.forEach(
            (question) => {
                if (!question.variable_name) {
                    return;
                }

                variableIndex[
                    question.variable_name
                ] = {
                    questionnaire_item_id:
                        question
                            .questionnaire_item_id,

                    section_id:
                        section.section_id,

                    question_type:
                        question.question_type
                            ?.type_code ||
                        null,

                    response_data_type:
                        question.question_type
                            ?.response_data_type ||
                        null,

                    required:
                        question.required,
                };
            }
        );
    });

    return variableIndex;
}

function buildCompiledPackage({
    metadata,
    validationReport,
    schemaHash = null,
}) {
    if (!metadata?.survey) {
        throw new Error(
            "Survey metadata is required to build the compiled package."
        );
    }

    const activeSections =
        (metadata.sections || [])
            .filter(
                (section) =>
                    section.is_active !==
                    false
            )
            .sort(
                (
                    leftSection,
                    rightSection
                ) => {
                    const pageDifference =
                        Number(
                            leftSection
                                .page_number || 1
                        ) -
                        Number(
                            rightSection
                                .page_number || 1
                        );

                    if (
                        pageDifference !== 0
                    ) {
                        return pageDifference;
                    }

                    return (
                        Number(
                            leftSection
                                .sort_order || 0
                        ) -
                        Number(
                            rightSection
                                .sort_order || 0
                        )
                    );
                }
            );

    const resolvedItems =
        metadata.resolvedItems || [];

    const sections = activeSections.map(
        (section) =>
            buildSectionDefinition(
                section,
                resolvedItems
            )
    );

    const unassignedSection =
        buildUnassignedSection(
            resolvedItems
        );

    if (unassignedSection) {
        sections.unshift(
            unassignedSection
        );
    }

    const totalQuestions =
        sections.reduce(
            (total, section) =>
                total +
                section.questions.length,
            0
        );

    const survey = metadata.survey;

    return {
        package_format:
            "EIOS_COMPILED_FORM",

        package_format_version:
            "1.0.0",

        compiler: {
            name:
                "EIOS Metadata Compiler",
            version: "1.0.0",
            compiled_at:
                new Date().toISOString(),
        },

        manifest: {
            survey_id:
                survey.survey_id,

            survey_code:
                survey.survey_code,

            current_version_number:
                Number(
                    survey
                        .current_version_number ||
                    0
                ),

            publication_status:
                survey.publication_status ||
                "Draft",

            schema_hash:
                schemaHash,

            section_count:
                sections.length,

            question_count:
                totalQuestions,

            validation_status:
                validationReport?.valid
                    ? "Valid"
                    : "Invalid",

            error_count:
                validationReport?.summary
                    ?.error_count || 0,

            warning_count:
                validationReport?.summary
                    ?.warning_count || 0,

            offline_ready:
                Boolean(
                    validationReport?.valid
                ) &&
                !(
                    validationReport?.warnings ||
                    []
                ).some(
                    (warning) =>
                        warning.code ===
                        "QUESTION_TYPE_NOT_OFFLINE_READY"
                ),
        },

        form: {
            form_id:
                survey.survey_id,

            form_code:
                survey.survey_code,

            form_name:
                survey.survey_name,

            form_type: "Survey",

            description:
                survey.description || null,

            purpose:
                survey.survey_purpose ||
                null,

            organization_id:
                survey.organization_id ||
                null,

            coverage_level_id:
                survey.coverage_level_id ||
                null,

            status:
                survey.status || null,

            publication_status:
                survey.publication_status ||
                "Draft",

            current_version_number:
                Number(
                    survey
                        .current_version_number ||
                    0
                ),

            planned_start_date:
                toIsoString(
                    survey.planned_start_date
                ),

            planned_end_date:
                toIsoString(
                    survey.planned_end_date
                ),

            configuration:
                normalizeJson(
                    survey.configuration_json,
                    {}
                ),

            created_at:
                toIsoString(
                    survey.created_at
                ),

            updated_at:
                toIsoString(
                    survey.updated_at
                ),
        },

        sections,

        indexes: {
            variables:
                buildVariableIndex(
                    sections
                ),
        },

        validation:
            validationReport || {
                valid: false,
                errors: [],
                warnings: [],
                summary: {},
            },
    };
}

module.exports = {
    buildCompiledPackage,
};

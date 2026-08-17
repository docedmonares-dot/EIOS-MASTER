function createIssue({
    code,
    severity = "error",
    message,
    questionnaireItemId = null,
    sectionId = null,
    variableName = null,
    metadata = {},
}) {
    return {
        code,
        severity,
        message,
        questionnaire_item_id:
            questionnaireItemId,
        section_id:
            sectionId,
        variable_name:
            variableName,
        metadata,
    };
}

function validateSurveyExists(metadata, issues) {
    if (!metadata?.survey) {
        issues.push(
            createIssue({
                code: "SURVEY_NOT_FOUND",
                message:
                    "The survey project could not be found.",
            })
        );
    }
}

function validateSections(metadata, issues) {
    const activeSections =
        (metadata.sections || []).filter(
            (section) =>
                section.is_active !== false
        );

    if (activeSections.length === 0) {
        issues.push(
            createIssue({
                code: "NO_ACTIVE_SECTIONS",
                severity: "warning",
                message:
                    "The instrument has no active sections.",
            })
        );
    }

    activeSections.forEach((section) => {
        if (
            !String(
                section.section_title || ""
            ).trim()
        ) {
            issues.push(
                createIssue({
                    code:
                        "SECTION_TITLE_REQUIRED",
                    message:
                        "An active section has no title.",
                    sectionId:
                        section.section_id,
                })
            );
        }
    });
}

function validateResolvedItems(metadata, issues) {
    const items =
        metadata.resolvedItems || [];

    if (items.length === 0) {
        issues.push(
            createIssue({
                code:
                    "NO_QUESTIONNAIRE_ITEMS",
                message:
                    "The instrument contains no active questionnaire items.",
            })
        );

        return;
    }

    items.forEach((item) => {
        const question = item.question;
        const questionType =
            item.question_type;

        if (!question) {
            issues.push(
                createIssue({
                    code:
                        "QUESTION_DEFINITION_MISSING",
                    message:
                        "A questionnaire item has no resolvable question definition.",
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                })
            );

            return;
        }

        if (
            !String(
                question.question_text || ""
            ).trim()
        ) {
            issues.push(
                createIssue({
                    code:
                        "QUESTION_TEXT_REQUIRED",
                    message:
                        "Question text is required.",
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                    variableName:
                        question.variable_name,
                })
            );
        }

        if (
            !String(
                question.variable_name || ""
            ).trim()
        ) {
            issues.push(
                createIssue({
                    code:
                        "VARIABLE_NAME_REQUIRED",
                    message:
                        "Variable name is required.",
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                })
            );
        }

        if (!questionType) {
            issues.push(
                createIssue({
                    code:
                        "QUESTION_TYPE_MISSING",
                    message:
                        "The question type could not be resolved.",
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                    variableName:
                        question.variable_name,
                })
            );

            return;
        }

        if (
            questionType.supports_offline ===
            false
        ) {
            issues.push(
                createIssue({
                    code:
                        "QUESTION_TYPE_NOT_OFFLINE_READY",
                    severity: "warning",
                    message:
                        `${questionType.type_name} is not marked as offline-capable.`,
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                    variableName:
                        question.variable_name,
                })
            );
        }

        if (
            questionType.supports_options &&
            !question.choice_list_id &&
            !Array.isArray(
                question.options_json
            )
        ) {
            issues.push(
                createIssue({
                    code:
                        "QUESTION_OPTIONS_MISSING",
                    message:
                        `${questionType.type_name} requires answer options or a choice list.`,
                    questionnaireItemId:
                        item.questionnaire_item_id,
                    sectionId:
                        item.section_id,
                    variableName:
                        question.variable_name,
                })
            );
        }
    });
}

function validateDuplicateVariables(
    metadata,
    issues
) {
    const variableMap = new Map();

    (metadata.resolvedItems || []).forEach(
        (item) => {
            const variableName =
                String(
                    item.question
                        ?.variable_name || ""
                )
                    .trim()
                    .toLowerCase();

            if (!variableName) {
                return;
            }

            if (
                !variableMap.has(variableName)
            ) {
                variableMap.set(
                    variableName,
                    [
                        item
                            .questionnaire_item_id,
                    ]
                );

                return;
            }

            variableMap
                .get(variableName)
                .push(
                    item
                        .questionnaire_item_id
                );
        }
    );

    variableMap.forEach(
        (itemIds, variableName) => {
            if (itemIds.length < 2) {
                return;
            }

            issues.push(
                createIssue({
                    code:
                        "DUPLICATE_VARIABLE_NAME",
                    message:
                        `Variable name "${variableName}" is used by multiple questionnaire items.`,
                    variableName,
                    metadata: {
                        questionnaire_item_ids:
                            itemIds,
                    },
                })
            );
        }
    );
}

function validateSectionReferences(
    metadata,
    issues
) {
    const sectionIds = new Set(
        (metadata.sections || [])
            .filter(
                (section) =>
                    section.is_active !==
                    false
            )
            .map(
                (section) =>
                    section.section_id
            )
    );

    (metadata.resolvedItems || []).forEach(
        (item) => {
            if (!item.section_id) {
                issues.push(
                    createIssue({
                        code:
                            "QUESTION_UNASSIGNED",
                        severity: "warning",
                        message:
                            "A questionnaire item is not assigned to a section.",
                        questionnaireItemId:
                            item.questionnaire_item_id,
                        variableName:
                            item.question
                                ?.variable_name,
                    })
                );

                return;
            }

            if (
                !sectionIds.has(
                    item.section_id
                )
            ) {
                issues.push(
                    createIssue({
                        code:
                            "SECTION_REFERENCE_INVALID",
                        message:
                            "A questionnaire item references a missing or inactive section.",
                        questionnaireItemId:
                            item.questionnaire_item_id,
                        sectionId:
                            item.section_id,
                        variableName:
                            item.question
                                ?.variable_name,
                    })
                );
            }
        }
    );
}

function compileValidationReport(metadata) {
    if (!metadata) {
        throw new Error(
            "Resolved metadata is required for validation."
        );
    }

    const issues = [];

    validateSurveyExists(
        metadata,
        issues
    );

    validateSections(
        metadata,
        issues
    );

    validateResolvedItems(
        metadata,
        issues
    );

    validateDuplicateVariables(
        metadata,
        issues
    );

    validateSectionReferences(
        metadata,
        issues
    );

    const errors = issues.filter(
        (issue) =>
            issue.severity === "error"
    );

    const warnings = issues.filter(
        (issue) =>
            issue.severity === "warning"
    );

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
            error_count: errors.length,
            warning_count:
                warnings.length,
            questionnaire_item_count:
                (
                    metadata.resolvedItems ||
                    []
                ).length,
            section_count:
                (
                    metadata.sections ||
                    []
                ).filter(
                    (section) =>
                        section.is_active !==
                        false
                ).length,
        },
    };
}

module.exports = {
    compileValidationReport,
};
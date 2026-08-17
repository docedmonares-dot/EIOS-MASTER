function createMap(items, key) {
    return new Map(
        (items || []).map((item) => [
            item[key],
            item,
        ])
    );
}

function resolveQuestionDefinition({
    questionnaireItem,
    localQuestionMap,
    enterpriseQuestionMap,
}) {
    if (
        questionnaireItem.item_source ===
        "Survey Local"
    ) {
        return localQuestionMap.get(
            questionnaireItem.local_question_id
        ) || null;
    }

    if (
        questionnaireItem.item_source ===
        "Enterprise Question Bank"
    ) {
        return enterpriseQuestionMap.get(
            questionnaireItem.enterprise_question_id
        ) || null;
    }

    return null;
}

function resolveQuestionType({
    questionDefinition,
    questionTypeMap,
}) {
    if (!questionDefinition?.question_type_id) {
        return null;
    }

    return (
        questionTypeMap.get(
            questionDefinition.question_type_id
        ) || null
    );
}

function applyQuestionnaireOverrides({
    questionnaireItem,
    questionDefinition,
}) {
    if (!questionDefinition) {
        return null;
    }

    const requiredFlag =
        questionnaireItem.required_override !== null &&
        questionnaireItem.required_override !== undefined
            ? Boolean(
                questionnaireItem.required_override
            )
            : Boolean(
                questionDefinition.required_flag
            );

    const questionText =
        questionnaireItem.label_override ||
        questionDefinition.question_text ||
        "";

    return {
        ...questionDefinition,

        question_text: questionText,
        required_flag: requiredFlag,

        questionnaire_item_id:
            questionnaireItem.questionnaire_item_id,

        item_source:
            questionnaireItem.item_source,

        section_id:
            questionnaireItem.section_id ||
            questionDefinition.section_id ||
            null,

        page_number:
            questionnaireItem.page_number ||
            questionDefinition.page_number ||
            1,

        sort_order:
            questionnaireItem.sort_order ??
            questionDefinition.sort_order ??
            0,

        item_settings_json:
            questionnaireItem.item_settings_json ||
            {},
    };
}

function resolveChoiceList({
    questionDefinition,
    choiceListMap,
}) {
    if (!questionDefinition?.choice_list_id) {
        return null;
    }

    return (
        choiceListMap.get(
            questionDefinition.choice_list_id
        ) || null
    );
}

function resolveSurveyReferences(metadata) {
    if (!metadata) {
        throw new Error(
            "Metadata is required for reference resolution."
        );
    }

    const localQuestionMap = createMap(
        metadata.localQuestions,
        "local_question_id"
    );

    const enterpriseQuestionMap = createMap(
        metadata.enterpriseQuestions,
        "question_id"
    );

    const questionTypeMap = createMap(
        metadata.questionTypes,
        "question_type_id"
    );

    const choiceListMap = createMap(
        metadata.choiceLists,
        "choice_list_id"
    );

    const resolvedItems =
        metadata.questionnaireItems
            .filter(
                (item) => item.is_active !== false
            )
            .map((questionnaireItem) => {
                const questionDefinition =
                    resolveQuestionDefinition({
                        questionnaireItem,
                        localQuestionMap,
                        enterpriseQuestionMap,
                    });

                const resolvedQuestion =
                    applyQuestionnaireOverrides({
                        questionnaireItem,
                        questionDefinition,
                    });

                const questionType =
                    resolveQuestionType({
                        questionDefinition:
                            resolvedQuestion,
                        questionTypeMap,
                    });

                const choiceList =
                    resolveChoiceList({
                        questionDefinition:
                            resolvedQuestion,
                        choiceListMap,
                    });

                return {
                    questionnaire_item_id:
                        questionnaireItem.questionnaire_item_id,

                    survey_id:
                        questionnaireItem.survey_id,

                    section_id:
                        resolvedQuestion?.section_id ||
                        null,

                    page_number:
                        resolvedQuestion?.page_number ||
                        1,

                    sort_order:
                        resolvedQuestion?.sort_order ??
                        0,

                    item_source:
                        questionnaireItem.item_source,

                    question:
                        resolvedQuestion,

                    question_type:
                        questionType,

                    choice_list:
                        choiceList,

                    resolution_status:
                        resolvedQuestion
                            ? "Resolved"
                            : "Missing Question Definition",
                };
            });

    return {
        ...metadata,
        resolvedItems,
    };
}

module.exports = {
    resolveSurveyReferences,
};
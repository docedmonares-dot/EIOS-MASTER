const db = require("../../config/database");

/**
 * Reads all metadata required to compile
 * a complete questionnaire package.
 */
async function readSurveyMetadata(surveyId) {
    if (!surveyId) {
        throw new Error("Survey ID is required.");
    }

    const surveyPromise = db.query(
        `
        SELECT *
        FROM surveys
        WHERE survey_id = $1
        `,
        [surveyId]
    );

    const sectionsPromise = db.query(
        `
        SELECT *
        FROM survey_sections
        WHERE survey_id = $1
          AND COALESCE(
              (settings_json ->> 'is_applicable')::boolean,
              TRUE
          ) = TRUE
        ORDER BY page_number, sort_order
        `,
        [surveyId]
    );

    const questionnaireItemsPromise = db.query(
        `
        SELECT *
        FROM survey_questionnaire_items
        WHERE survey_id = $1
        ORDER BY page_number, sort_order
        `,
        [surveyId]
    );

    const localQuestionsPromise = db.query(
        `
        SELECT *
        FROM survey_local_questions
        WHERE survey_id = $1
        `,
        [surveyId]
    );

    const enterpriseQuestionsPromise = db.query(
        `
        SELECT *
        FROM question_bank
        WHERE question_id IN (
            SELECT enterprise_question_id
            FROM survey_questionnaire_items
            WHERE survey_id = $1
              AND enterprise_question_id IS NOT NULL
        )
        `,
        [surveyId]
    );

    const questionTypesPromise = db.query(
        `
        SELECT *
        FROM question_types
        WHERE is_active = TRUE
        ORDER BY display_order
        `
    );

    const choiceListsPromise = db.query(
        `
        SELECT *
        FROM question_choice_lists
        WHERE is_active = TRUE
        `
    );

    const choiceOptionsPromise = db.query(
        `
        SELECT
            question_choice_id AS choice_id,
            choice_list_id,
            choice_code AS option_code,
            COALESCE(text_value, choice_code) AS option_value,
            choice_label AS option_label,
            display_order AS sort_order,
            is_exclusive,
            is_other_option,
            is_none_option,
            is_refuse_option,
            is_active,
            metadata_json
        FROM question_choices
        WHERE is_active = TRUE
        ORDER BY choice_list_id, display_order, choice_label
        `
    );

    const [
        survey,
        sections,
        questionnaireItems,
        localQuestions,
        enterpriseQuestions,
        questionTypes,
        choiceLists,
        choiceOptions,
    ] = await Promise.all([
        surveyPromise,
        sectionsPromise,
        questionnaireItemsPromise,
        localQuestionsPromise,
        enterpriseQuestionsPromise,
        questionTypesPromise,
        choiceListsPromise,
        choiceOptionsPromise,
    ]);

    const optionsByChoiceList =
        choiceOptions.rows.reduce(
            (optionsMap, option) => {
                const existingOptions =
                    optionsMap.get(
                        option.choice_list_id
                    ) || [];

                existingOptions.push(option);
                optionsMap.set(
                    option.choice_list_id,
                    existingOptions
                );

                return optionsMap;
            },
            new Map()
        );

    const resolvedChoiceLists =
        choiceLists.rows.map((choiceList) => ({
            ...choiceList,
            choices:
                optionsByChoiceList.get(
                    choiceList.choice_list_id
                ) || [],
        }));

    return {
        survey: survey.rows[0] || null,
        sections: sections.rows,
        questionnaireItems: questionnaireItems.rows,
        localQuestions: localQuestions.rows,
        enterpriseQuestions: enterpriseQuestions.rows,
        questionTypes: questionTypes.rows,
        choiceLists: resolvedChoiceLists,
    };
}

module.exports = {
    readSurveyMetadata,
};

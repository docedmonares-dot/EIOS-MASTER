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

    const [
        survey,
        sections,
        questionnaireItems,
        localQuestions,
        enterpriseQuestions,
        questionTypes,
        choiceLists,
    ] = await Promise.all([
        surveyPromise,
        sectionsPromise,
        questionnaireItemsPromise,
        localQuestionsPromise,
        enterpriseQuestionsPromise,
        questionTypesPromise,
        choiceListsPromise,
    ]);

    return {
        survey: survey.rows[0] || null,
        sections: sections.rows,
        questionnaireItems: questionnaireItems.rows,
        localQuestions: localQuestions.rows,
        enterpriseQuestions: enterpriseQuestions.rows,
        questionTypes: questionTypes.rows,
        choiceLists: choiceLists.rows,
    };
}

module.exports = {
    readSurveyMetadata,
};
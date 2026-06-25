const pool = require('../config/database');

exports.getSurveyPreview = async (req, res) => {
    try {

        const surveyResult = await pool.query(
            `
            SELECT *
            FROM surveys
            WHERE survey_id = $1
            `,
            [req.params.id]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found'
            });
        }

        const sectionsResult = await pool.query(
            `
            SELECT *
            FROM survey_sections
            WHERE survey_id = $1
            AND is_active = true
            ORDER BY page_number, sort_order
            `,
            [req.params.id]
        );

        const questionsResult = await pool.query(
            `
            SELECT
                sq.*,
                qb.question_code,
                qb.question_text,
                qb.question_type,
                qb.options_json
            FROM survey_questions sq
            LEFT JOIN question_bank qb
                ON sq.question_id = qb.question_id
            WHERE sq.survey_id = $1
            AND sq.is_active = true
            ORDER BY sq.page_number, sq.sort_order
            `,
            [req.params.id]
        );

        const sections = sectionsResult.rows.map(section => ({
            ...section,
            questions: questionsResult.rows.filter(
                q => q.section_id === section.section_id
            )
        }));

        res.json({
            survey: surveyResult.rows[0],
            sections
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }
};
const pool = require('../config/database');

exports.getAllSurveyQuestions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sq.*,
                s.survey_code,
                s.survey_name,
                ss.section_code,
                ss.section_title,
                qb.question_code,
                qb.question_text,
                qb.question_type
            FROM survey_questions sq
            LEFT JOIN surveys s
                ON sq.survey_id = s.survey_id
            LEFT JOIN survey_sections ss
                ON sq.section_id = ss.section_id
            LEFT JOIN question_bank qb
                ON sq.question_id = qb.question_id
            ORDER BY sq.page_number, sq.sort_order
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.addQuestionToSurvey = async (req, res) => {
    try {
        const {
            survey_id,
            section_id,
            question_id,
            page_number,
            sort_order,
            required_override
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO survey_questions
            (
                survey_id,
                section_id,
                question_id,
                page_number,
                sort_order,
                required_override
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                survey_id,
                section_id,
                question_id,
                page_number,
                sort_order,
                required_override
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
const pool = require('../config/database');

exports.publishSurveyVersion = async (req, res) => {
    try {
        const surveyId = req.params.id;

        const surveyResult = await pool.query(
            `
            SELECT *
            FROM surveys
            WHERE survey_id = $1
            `,
            [surveyId]
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
            ORDER BY page_number, sort_order
            `,
            [surveyId]
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
            ORDER BY sq.page_number, sq.sort_order
            `,
            [surveyId]
        );

        const versionResult = await pool.query(
            `
            SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
            FROM survey_versions
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        const nextVersion = versionResult.rows[0].next_version;

        await pool.query(
            `
            UPDATE survey_versions
            SET is_active_version = false
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        const insertResult = await pool.query(
            `
            INSERT INTO survey_versions
            (
                survey_id,
                version_number,
                version_label,
                survey_snapshot,
                question_snapshot,
                logic_snapshot,
                publish_notes,
                is_active_version
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,true)
            RETURNING *
            `,
       [
    surveyId,
    nextVersion,
    `Version ${nextVersion}`,
    JSON.stringify(surveyResult.rows[0]),
    JSON.stringify(questionsResult.rows),
    JSON.stringify([]),
    'Published through EIOS API'
]
        );

        res.json({
            success: true,
            message: 'Survey version published successfully',
            version: insertResult.rows[0],
            sections_count: sectionsResult.rows.length,
            questions_count: questionsResult.rows.length
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.getSurveyVersions = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM survey_versions
            WHERE survey_id = $1
            ORDER BY version_number DESC
            `,
            [req.params.id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
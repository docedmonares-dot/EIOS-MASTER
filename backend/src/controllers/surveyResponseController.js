const pool = require('../config/database');

exports.getAllResponses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sr.*,
                s.survey_code,
                s.survey_name,
                sv.version_number,
                sv.version_label,
                sw.wave_code,
                sw.wave_name
            FROM survey_responses sr
            LEFT JOIN surveys s
                ON sr.survey_id = s.survey_id
            LEFT JOIN survey_versions sv
                ON sr.survey_version_id = sv.survey_version_id
            LEFT JOIN survey_waves sw
                ON sr.wave_id = sw.wave_id
            ORDER BY sr.submitted_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.createResponse = async (req, res) => {
    try {
        const {
            survey_id,
            survey_version_id,
            wave_id,
            deployment_id,
            enumerator_id,
            respondent_code,
            answers_json,
            metadata_json
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO survey_responses
            (
                survey_id,
                survey_version_id,
                wave_id,
                deployment_id,
                enumerator_id,
                respondent_code,
                answers_json,
                metadata_json,
                submitted_at
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
            RETURNING *
            `,
            [
                survey_id,
                survey_version_id,
                wave_id,
                deployment_id,
                enumerator_id || null,
                respondent_code,
                JSON.stringify(answers_json),
                JSON.stringify(metadata_json)
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
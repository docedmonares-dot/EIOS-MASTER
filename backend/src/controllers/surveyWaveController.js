const pool = require('../config/database');

exports.getAllWaves = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sw.*,
                s.survey_code,
                s.survey_name
            FROM survey_waves sw
            LEFT JOIN surveys s
                ON sw.survey_id = s.survey_id
            ORDER BY sw.survey_date DESC, sw.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.createWave = async (req, res) => {
    try {
        const {
            survey_id,
            wave_code,
            wave_name,
            survey_date,
            status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO survey_waves
            (
                survey_id,
                wave_code,
                wave_name,
                survey_date,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5)
            RETURNING *
            `,
            [
                survey_id,
                wave_code,
                wave_name,
                survey_date,
                status
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
const pool = require('../config/database');

exports.getAllSurveys = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM surveys
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.createSurvey = async (req, res) => {
    try {

        const {
            survey_code,
            survey_name,
            election_type,
            geographic_scope,
            description,
            status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO surveys
            (
                survey_code,
                survey_name,
                election_type,
                geographic_scope,
                description,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                survey_code,
                survey_name,
                election_type,
                geographic_scope,
                description,
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
exports.updateSurvey = async (req, res) => {
    try {

        const {
            survey_name,
            election_type,
            geographic_scope,
            description,
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE surveys
            SET
                survey_name = $1,
                election_type = $2,
                geographic_scope = $3,
                description = $4,
                status = $5,
                updated_at = NOW()
            WHERE survey_id = $6
            RETURNING *
            `,
            [
                survey_name,
                election_type,
                geographic_scope,
                description,
                status,
                req.params.id
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
exports.deleteSurvey = async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM surveys
            WHERE survey_id = $1
            RETURNING *
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found'
            });
        }

        res.json({
            success: true,
            deleted: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
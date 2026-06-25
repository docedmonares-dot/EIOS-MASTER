const pool = require('../config/database');

exports.getAllEnumerators = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                personnel_id,
                full_name,
                role,
                mobile_number,
                email,
                team_name,
                status
            FROM personnel
            WHERE role ILIKE '%enumerator%'
            ORDER BY full_name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.createEnumerator = async (req, res) => {
    try {
        const {
            full_name,
            role,
            mobile_number,
            email,
            team_name,
            status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO personnel
            (
                full_name,
                role,
                mobile_number,
                email,
                team_name,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                full_name,
                role,
                mobile_number,
                email,
                team_name,
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
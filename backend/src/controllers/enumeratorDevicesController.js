const pool = require('../config/database');

exports.getAllDevices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ed.*,
                p.full_name,
                p.mobile_number,
                p.team_name
            FROM enumerator_devices ed
            LEFT JOIN personnel p
                ON ed.personnel_id = p.personnel_id
            ORDER BY ed.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.registerDevice = async (req, res) => {
    try {
        const {
            personnel_id,
            device_name,
            device_fingerprint,
            platform,
            browser,
            os_version,
            status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO enumerator_devices
            (
                personnel_id,
                device_name,
                device_fingerprint,
                platform,
                browser,
                os_version,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *
            `,
            [
                personnel_id,
                device_name,
                device_fingerprint,
                platform,
                browser,
                os_version,
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
exports.approveDevice = async (req, res) => {
    try {
        const result = await pool.query(
            `
            UPDATE enumerator_devices
            SET
                approved = TRUE,
                approved_at = NOW(),
                status = 'Approved'
            WHERE device_id = $1
            RETURNING *
            `,
            [req.params.id]
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
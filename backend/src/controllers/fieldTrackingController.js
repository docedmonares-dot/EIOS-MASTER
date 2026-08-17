const pool = require('../config/database');

// 📍 Save GPS location (offline or online sync)
exports.saveLocation = async (req, res) => {
    try {
        const {
            enumerator_id,
            deployment_id,
            latitude,
            longitude,
            barangay,
            city,
            province,
            sync_status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO field_tracking
            (
                enumerator_id,
                deployment_id,
                latitude,
                longitude,
                barangay,
                city,
                province,
                sync_status,
                timestamp
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
            RETURNING *
            `,
            [
                enumerator_id,
                deployment_id,
                latitude,
                longitude,
                barangay,
                city,
                province,
                sync_status || 'offline'
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

// 📊 Get field coverage map data
exports.getFieldMap = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM field_tracking
            ORDER BY timestamp DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};
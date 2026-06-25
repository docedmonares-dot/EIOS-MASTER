const pool = require('../config/database');

exports.getFieldMap = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ea.enumerator_id,
                p.full_name,
                ea.attendance_status,
                ea.clock_in_time,
                ea.clock_out_time,
                ea.clock_in_gps
            FROM enumerator_attendance ea
            LEFT JOIN personnel p
                ON ea.enumerator_id = p.personnel_id
            WHERE ea.clock_in_time IS NOT NULL
        `);

        const mapData = result.rows.map(row => {
            return {
                enumerator_id: row.enumerator_id,
                full_name: row.full_name,
                status: row.attendance_status,
                clock_in_time: row.clock_in_time,
                clock_out_time: row.clock_out_time,
                gps: row.clock_in_gps
            };
        });

        res.json({
            success: true,
            message: "EIOS Live Field Map v1",
            data: mapData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
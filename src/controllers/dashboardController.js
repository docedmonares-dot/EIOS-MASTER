const pool = require('../config/database');

exports.getExecutiveDashboard = async (req, res) => {
    try {
        // Total enumerators
        const enumerators = await pool.query(`
            SELECT COUNT(*) FROM personnel WHERE role = 'Enumerator'
        `);

        // Active deployments
        const deployments = await pool.query(`
            SELECT COUNT(*) FROM survey_deployments
        `);

        // Attendance today
        const attendance = await pool.query(`
            SELECT COUNT(*) 
            FROM enumerator_attendance
            WHERE DATE(clock_in_time) = CURRENT_DATE
        `);

        // Active (clocked-in)
        const active = await pool.query(`
            SELECT COUNT(*)
            FROM enumerator_attendance
            WHERE attendance_status = 'Clocked-In'
        `);

        // KPI average
        const kpi = await pool.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (clock_out_time - clock_in_time))/3600) as avg_hours
            FROM enumerator_attendance
            WHERE clock_out_time IS NOT NULL
        `);

        res.json({
            success: true,
            message: "EIOS Executive Dashboard v1",
            data: {
                total_enumerators: parseInt(enumerators.rows[0].count),
                total_deployments: parseInt(deployments.rows[0].count),
                today_attendance: parseInt(attendance.rows[0].count),
                active_enumerators: parseInt(active.rows[0].count),
                average_hours: parseFloat(kpi.rows[0].avg_hours || 0)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
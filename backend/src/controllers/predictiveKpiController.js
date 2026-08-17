const pool = require('../config/database');

exports.predictEnumeratorPerformance = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ea.enumerator_id,
                p.full_name,
                COUNT(ea.attendance_id) AS sessions,
                SUM(EXTRACT(EPOCH FROM (ea.clock_out_time - ea.clock_in_time))/3600) AS hours
            FROM enumerator_attendance ea
            LEFT JOIN personnel p
                ON ea.enumerator_id = p.personnel_id
            GROUP BY ea.enumerator_id, p.full_name
        `);

        const predictions = result.rows.map(row => {
            const hours = parseFloat(row.hours || 0);
            const sessions = parseInt(row.sessions || 0);

            // SIMPLE AI MODEL (baseline predictive scoring)
            const productivity = hours * 10 + sessions * 5;

            let future_risk = "Low Risk";
            let trend = "Stable";

            if (productivity < 20) {
                future_risk = "High Risk";
                trend = "Declining";
            } else if (productivity < 50) {
                future_risk = "Medium Risk";
                trend = "Unstable";
            }

            return {
                enumerator_id: row.enumerator_id,
                full_name: row.full_name,
                sessions,
                hours,
                productivity_score: Math.round(productivity),
                predicted_risk: future_risk,
                performance_trend: trend
            };
        });

        res.json({
            success: true,
            message: "EIOS Predictive KPI Engine v1",
            data: predictions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
const pool = require('../config/database');

exports.getEnumeratorKPI = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ea.enumerator_id,
                p.full_name,
                COUNT(ea.attendance_id) AS total_sessions,
                SUM(
                    EXTRACT(EPOCH FROM (ea.clock_out_time - ea.clock_in_time))/3600
                ) AS total_hours
            FROM enumerator_attendance ea
            LEFT JOIN personnel p
                ON ea.enumerator_id = p.personnel_id
            GROUP BY ea.enumerator_id, p.full_name
        `);

      const kpi = result.rows.map(row => {
    const hours = parseFloat(row.total_hours || 0);
    const sessions = parseInt(row.total_sessions || 0);

    const productivity_score = Math.min(100, Math.round(hours * 10 + sessions * 5));

    let rank = "Bronze";
    let risk = "Normal";

    if (productivity_score >= 80) rank = "Gold";
    else if (productivity_score >= 50) rank = "Silver";

    if (productivity_score < 20) risk = "At Risk";

    return {
        enumerator_id: row.enumerator_id,
        full_name: row.full_name,
        total_sessions: sessions,
        total_hours: hours,
        productivity_score,
        rank,
        risk
    };
});
        res.json({
            success: true,
            message: "EIOS KPI Engine v1",
            data: kpi
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
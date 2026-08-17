const pool = require('../config/database');

// 📊 BI: Field Coverage Summary
exports.getCoverageSummary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_locations,
                COUNT(DISTINCT enumerator_id) as active_enumerators,
                COUNT(DISTINCT barangay) as barangays_covered,
                COUNT(DISTINCT city) as cities_covered
            FROM field_tracking
        `);

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

// 📊 BI: Response Density (Survey Activity)
exports.getResponseDensity = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                barangay,
                COUNT(*) as responses
            FROM survey_responses sr
            LEFT JOIN field_tracking ft
                ON sr.enumerator_id = ft.enumerator_id
            GROUP BY barangay
            ORDER BY responses DESC
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

// 📊 BI: Live Enumerator Activity
exports.getEnumeratorActivity = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                enumerator_id,
                COUNT(*) as total_submissions,
                MAX(timestamp) as last_activity
            FROM field_tracking
            GROUP BY enumerator_id
            ORDER BY last_activity DESC
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
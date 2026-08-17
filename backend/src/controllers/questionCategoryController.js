const pool = require('../config/database');

exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM question_categories
            ORDER BY sort_order
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
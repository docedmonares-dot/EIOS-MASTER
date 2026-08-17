const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');

/* ======================
   DASHBOARD ANALYTICS
====================== */
router.get('/', verifyToken, async (req, res) => {

    try {

        // surveys
        const surveys = await pool.query(`SELECT COUNT(*) FROM surveys`);

        // users
        const users = await pool.query(`SELECT COUNT(*) FROM users`);

        // enumerators (role-based)
        const enumerators = await pool.query(
            `SELECT COUNT(*) FROM users WHERE role = 'enumerator'`
        );

        // voters (if you have voters table)
        let voters = { rows: [{ count: 0 }] };
        try {
            voters = await pool.query(`SELECT COUNT(*) FROM voters`);
        } catch (e) {
            voters = { rows: [{ count: 0 }] };
        }

        // responses (fallback = surveys for now)
        const responses = surveys;

        return res.json({
            surveys: parseInt(surveys.rows[0].count),
            responses: parseInt(responses.rows[0].count),
            votes: 0,
            users: parseInt(users.rows[0].count),
            voters: parseInt(voters.rows[0].count),
            enumerators: parseInt(enumerators.rows[0].count)
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;
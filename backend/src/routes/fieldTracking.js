const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken } = require('../middleware/authMiddleware');

/* ======================
   GPS UPDATE (LIVE + SAVE)
====================== */
router.post('/update', verifyToken, async (req, res) => {
    try {

        const { latitude, longitude, user_id, barangay } = req.body;

        // =========================
        // 1. SAVE TO DATABASE
        // =========================
        await pool.query(
            `INSERT INTO field_locations (user_id, latitude, longitude, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [user_id, latitude, longitude]
        );

        // =========================
        // 2. COVERAGE TRACKING (NEW)
        // =========================
        const brgy = barangay || "UNKNOWN";

        if (!global.barangayCoverage) {
            global.barangayCoverage = {};
        }

        if (!global.barangayCoverage[brgy]) {
            global.barangayCoverage[brgy] = {
                total: 0,
                enumerators: {}
            };
        }

        global.barangayCoverage[brgy].total++;
        global.barangayCoverage[brgy].enumerators[user_id] = true;

        // broadcast coverage update
        req.app.get('io').emit('coverage-update', global.barangayCoverage);

        // =========================
        // 3. GPS LIVE BROADCAST
        // =========================
        req.app.get('io').emit('gps-update', {
            user_id,
            latitude,
            longitude,
            time: new Date()
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ======================
   GPS HISTORY (REPLAY SYSTEM)
====================== */
router.get('/history/:user_id', verifyToken, async (req, res) => {
    try {

        const { user_id } = req.params;

        const result = await pool.query(
            `SELECT latitude, longitude, created_at
             FROM field_locations
             WHERE user_id = $1
             ORDER BY created_at ASC`,
            [user_id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
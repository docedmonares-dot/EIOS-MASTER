const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/analyticsController');

router.get(
    '/frequencies',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst'),
    controller.getFrequencies
);

module.exports = router;
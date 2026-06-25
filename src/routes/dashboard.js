const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/dashboardController');

router.get(
    '/executive',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst', 'Supervisor'),
    controller.getExecutiveDashboard
);

module.exports = router;
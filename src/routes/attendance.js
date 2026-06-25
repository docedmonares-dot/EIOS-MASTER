const express = require('express');
const router = express.Router();

const controller = require('../controllers/attendanceController');

const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Clock-in (only authenticated users)
router.post(
    '/clock-in',
    verifyToken,
    requireRole('Enumerator', 'Supervisor', 'Admin', 'Super Admin'),
    controller.clockIn
);

// Clock-out (only authenticated users)
router.post(
    '/clock-out',
    verifyToken,
    requireRole('Enumerator', 'Supervisor', 'Admin', 'Super Admin'),
    controller.clockOut
);

module.exports = router;
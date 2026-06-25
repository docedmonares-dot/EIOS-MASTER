const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/fieldMapController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor', 'Analyst'),
    controller.getFieldMap
);

module.exports = router;
const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/kpiController');

router.get(
    '/enumerators',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst', 'Supervisor'),
    controller.getEnumeratorKPI
);

module.exports = router;
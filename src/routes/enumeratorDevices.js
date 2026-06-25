const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/enumeratorDevicesController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor'),
    controller.getAllDevices
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.registerDevice
);

router.put(
    '/:id/approve',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.approveDevice
);

module.exports = router;
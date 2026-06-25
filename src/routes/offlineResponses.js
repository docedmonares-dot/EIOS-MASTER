const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/offlineResponseController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor'),
    controller.getAllOfflineResponses
);

router.post(
    '/',
    verifyToken,
    requireRole('Enumerator', 'Supervisor', 'Admin', 'Super Admin'),
    controller.createOfflineResponse
);

router.post(
    '/sync/:id',
    verifyToken,
    requireRole('Supervisor', 'Admin', 'Super Admin'),
    controller.syncOfflineResponse
);

module.exports = router;
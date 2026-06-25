const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/deploymentPersonnelController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor'),
    controller.getAllDeploymentPersonnel
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.assignPersonnel
);

module.exports = router;
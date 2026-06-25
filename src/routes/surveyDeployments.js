const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/surveyDeploymentController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor'),
    controller.getAllDeployments
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.createDeployment
);

module.exports = router;
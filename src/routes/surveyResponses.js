const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/surveyResponseController');

router.get(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst', 'Supervisor'),
    controller.getAllResponses
);

router.post(
    '/',
    verifyToken,
    requireRole('Enumerator', 'Supervisor', 'Admin', 'Super Admin'),
    controller.createResponse
);

module.exports = router;
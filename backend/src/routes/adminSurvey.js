const express = require('express');
const router = express.Router();

const adminSurveyController = require('../controllers/adminSurveyController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// 📋 Admin: Get all surveys
router.get(
    '/',
    verifyToken,
    requireRole('ADMIN'),
    adminSurveyController.getAllSurveysAdmin
);

// 📊 Admin: Get survey details
router.get(
    '/:id',
    verifyToken,
    requireRole('ADMIN'),
    adminSurveyController.getSurveyDetailsAdmin
);

// 🛠️ Admin: Update survey status
router.put(
    '/:id/status',
    verifyToken,
    requireRole('ADMIN'),
    adminSurveyController.updateSurveyStatus
);

module.exports = router;
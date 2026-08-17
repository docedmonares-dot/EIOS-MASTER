const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const controller = require('../controllers/surveyController');

router.get(
    '/',
    verifyToken,
    controller.getAllSurveys
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.createSurvey
);

router.put(
    '/:id',
    verifyToken,
    requireRole('Super Admin', 'Admin'),
    controller.updateSurvey
);

router.delete(
    '/:id',
    verifyToken,
    requireRole('Super Admin'),
    controller.deleteSurvey
);

module.exports = router;
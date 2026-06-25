const express = require('express');
const router = express.Router();

const controller = require('../controllers/questionBankController');

const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get(
    '/',
    verifyToken,
    controller.getAllQuestions
);

router.get(
    '/:id',
    verifyToken,
    controller.getQuestionById
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst'),
    controller.createQuestion
);

router.put(
    '/:id',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Analyst'),
    controller.updateQuestion
);

router.delete(
    '/:id',
    verifyToken,
    requireRole('Super Admin'),
    controller.deleteQuestion
);
module.exports = router;
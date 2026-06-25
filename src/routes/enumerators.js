const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const controller = require('../controllers/enumeratorsController');

router.get(
    '/',
    verifyToken,
    controller.getAllEnumerators
);

router.post(
    '/',
    verifyToken,
    requireRole('Super Admin', 'Admin', 'Supervisor'),
    controller.createEnumerator
);
module.exports = router;
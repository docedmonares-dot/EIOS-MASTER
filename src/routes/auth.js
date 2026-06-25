const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/health', authController.healthCheck);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.get(
    '/admin-test',
    verifyToken,
    requireRole('Super Admin'),
    (req, res) => {
        res.json({
            message: 'Super Admin access granted',
            user: req.user
        });
    }
);

module.exports = router;
const express = require('express');
const router = express.Router();

const voteController = require('../controllers/voteController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// 🗳️ Submit vote
router.post(
    '/submit',
    verifyToken,
    voteController.submitVote
);

// 📊 Get results (Admin only)
router.get(
    '/results/:election_id',
    verifyToken,
    requireRole('ADMIN'),
    voteController.getResults
);

module.exports = router;
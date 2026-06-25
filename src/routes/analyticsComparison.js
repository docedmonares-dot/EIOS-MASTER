const express = require('express');
const router = express.Router();

const controller = require('../controllers/analyticsComparisonController');

router.get('/compare-waves', controller.compareByWave);

module.exports = router;
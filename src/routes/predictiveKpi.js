const express = require('express');
const router = express.Router();

const controller = require('../controllers/predictiveKpiController');

router.get('/predict', controller.predictEnumeratorPerformance);

module.exports = router;
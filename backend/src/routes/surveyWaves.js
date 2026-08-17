const express = require('express');
const router = express.Router();

const controller = require('../controllers/surveyWaveController');

router.get('/', controller.getAllWaves);
router.post('/', controller.createWave);

module.exports = router;
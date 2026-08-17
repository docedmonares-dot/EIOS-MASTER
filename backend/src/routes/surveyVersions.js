const express = require('express');
const router = express.Router();

const controller = require('../controllers/surveyVersionController');

router.get('/:id', controller.getSurveyVersions);
router.post('/:id/publish', controller.publishSurveyVersion);

module.exports = router;
const express = require('express');
const router = express.Router();

const controller = require('../controllers/surveyPreviewController');

router.get('/:id', controller.getSurveyPreview);

module.exports = router;
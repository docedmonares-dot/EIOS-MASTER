const express = require('express');
const router = express.Router();

const controller = require('../controllers/surveySectionController');

router.get('/', controller.getAllSections);

module.exports = router;
router.post('/', controller.createSection);
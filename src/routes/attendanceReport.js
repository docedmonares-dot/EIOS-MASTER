const express = require('express');
const router = express.Router();

const controller = require('../controllers/attendanceReportController');

router.get('/daily', controller.getDailyAttendanceReport);

module.exports = router;
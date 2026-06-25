const express = require('express');
const router = express.Router();
const auth = require('./auth');

const analytics = require('./analytics');
const fieldMap = require('./fieldMap');
const predictiveKpi = require('./predictiveKpi');
const dashboard = require('./dashboard');
const kpi = require('./kpi');
const attendanceReport = require('./attendanceReport');
const attendance = require('./attendance');
const enumeratorDevices = require('./enumeratorDevices');
const deploymentPersonnel = require('./deploymentPersonnel');
const offlineResponses = require('./offlineResponses');
const surveyResponses = require('./surveyResponses');
const surveyDeployments = require('./surveyDeployments');
const surveyWaves = require('./surveyWaves');
const surveyPreview = require('./surveyPreview');
const surveyQuestions = require('./surveyQuestions');
const surveySections = require('./surveySections');
const surveyVersions = require('./surveyVersions');
const questionBank = require('./questionBank');
const questionCategories = require('./questionCategories');
const surveys = require('./surveys');
const pool = require('../config/database');
const analyticsComparison = require('./analyticsComparison');
const enumerators = require('./enumerators');

router.get('/', (req, res) => {
  res.json({
    system: 'EIOS V2',
    status: 'Running',
    version: '2.0'
  });
});

router.use('/api/auth', auth);
router.get('/dbtest', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database()');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use('/api/question-categories', questionCategories);
router.use('/api/analytics', analytics);
router.use('/api/question-bank', questionBank);
router.use('/api/survey-questions', surveyQuestions);
router.use('/api/survey-sections', surveySections);
router.use('/api/survey-preview', surveyPreview);
router.use('/api/survey-versions', surveyVersions);
router.use('/api/survey-waves', surveyWaves);
router.use('/api/survey-deployments', surveyDeployments);
router.use('/api/survey-responses', surveyResponses);
router.use('/api/offline-responses', offlineResponses);
router.use('/api/surveys', surveys);
router.use('/api/analytics', analyticsComparison);
router.use('/api/enumerators', enumerators);
router.use('/api/deployment-personnel', deploymentPersonnel);
router.use('/api/enumerator-devices', enumeratorDevices);
router.use('/api/attendance', attendance);
router.use('/api/attendance-report', attendanceReport);
router.use('/api/kpi', kpi);
router.use('/api/dashboard', dashboard);
router.use('/api/kpi/predictive', predictiveKpi);
router.use('/api/field-map', fieldMap);
module.exports = router;
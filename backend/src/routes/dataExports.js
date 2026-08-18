const express = require("express");
const controller = require("../controllers/dataExportController");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const PERMISSIONS = require("../security/permissions");

const router = express.Router();

router.get(
    "/surveys/:surveyId/excel",
    verifyToken,
    requirePermission(PERMISSIONS.ANALYTICS.ANALYZE),
    controller.exportExcel
);

router.get(
    "/surveys/:surveyId/spss",
    verifyToken,
    requirePermission(PERMISSIONS.ANALYTICS.ANALYZE),
    controller.exportSpss
);

module.exports = router;

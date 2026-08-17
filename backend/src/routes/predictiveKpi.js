const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/predictiveKpiController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   PREDICTIVE ENUMERATOR KPI
========================================================= */

router.get(
    "/predict",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    controller.predictEnumeratorPerformance
);

module.exports = router;
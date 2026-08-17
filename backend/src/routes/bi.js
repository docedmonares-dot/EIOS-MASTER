const express = require("express");

const router = express.Router();

const biController = require(
    "../controllers/biController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   BUSINESS INTELLIGENCE
========================================================= */

// Coverage Summary
router.get(
    "/coverage",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    biController.getCoverageSummary
);

// Response Density Map
router.get(
    "/density",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    biController.getResponseDensity
);

// Enumerator Activity
router.get(
    "/activity",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    biController.getEnumeratorActivity
);

module.exports = router;
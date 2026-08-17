const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/analyticsController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ANALYTICS
========================================================= */

// Frequency Distribution
router.get(
    "/frequencies",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    controller.getFrequencies
);

module.exports = router;
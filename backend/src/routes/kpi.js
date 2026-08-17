const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/kpiController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENUMERATOR KPI
========================================================= */

router.get(
    "/enumerators",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    controller.getEnumeratorKPI
);

module.exports = router;
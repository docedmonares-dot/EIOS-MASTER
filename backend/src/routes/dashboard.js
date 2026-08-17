const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/dashboardController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   EXECUTIVE DASHBOARD
========================================================= */

router.get(
    "/executive",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getExecutiveDashboard
);

module.exports = router;
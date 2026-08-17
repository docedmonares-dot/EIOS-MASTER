const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/attendanceController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   CLOCK IN
========================================================= */

router.post(
    "/clock-in",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.clockIn
);

/* =========================================================
   CLOCK OUT
========================================================= */

router.post(
    "/clock-out",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.clockOut
);

module.exports = router;
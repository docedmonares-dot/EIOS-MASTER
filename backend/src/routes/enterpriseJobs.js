const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/enterpriseJobController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   JOB MANAGER SUMMARY
========================================================= */

router.get(
    "/summary",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getJobSummary
);

/* =========================================================
   ACTIVE JOB TYPES
========================================================= */

router.get(
    "/types",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getJobTypes
);

/* =========================================================
   RECENT JOBS
========================================================= */

router.get(
    "/recent",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getRecentJobs
);

module.exports = router;

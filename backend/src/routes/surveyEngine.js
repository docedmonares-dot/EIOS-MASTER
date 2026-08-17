const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/surveyEngineController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   SURVEY ENGINE SUMMARY
========================================================= */

router.get(
    "/summary",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getSurveyEngineSummary
);

/* =========================================================
   SURVEY COVERAGE LEVELS
========================================================= */

router.get(
    "/coverage-levels",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getSurveyCoverageLevels
);

/* =========================================================
   SURVEY PROJECT REGISTRY
========================================================= */

router.get(
    "/projects",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getSurveyProjects
);

/* =========================================================
   CREATE SURVEY PROJECT
========================================================= */

router.post(
    "/projects",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createSurveyProject
);

module.exports = router;
const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/surveyResponseController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   SURVEY RESPONSES
========================================================= */

// View Survey Responses
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    controller.getAllResponses
);

// Submit Survey Response
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.createResponse
);

module.exports = router;
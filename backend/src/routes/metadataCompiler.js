const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/metadataCompilerController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   COMPILE DRAFT FOR PREVIEW
========================================================= */

router.get(
    "/:surveyId/preview",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.compilePreview
);

/* =========================================================
   STRICT PUBLICATION READINESS COMPILATION
========================================================= */

router.get(
    "/:surveyId/publication",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.compilePublication
);

module.exports = router;
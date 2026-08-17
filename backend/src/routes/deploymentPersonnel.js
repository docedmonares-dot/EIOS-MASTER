const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/deploymentPersonnelController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   DEPLOYMENT PERSONNEL
========================================================= */

// View Deployment Personnel
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.getAllDeploymentPersonnel
);

// Assign Deployment Personnel

router.get(
    "/my-assignments",
    verifyToken,
    controller.getMyAssignments
);

router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.assignPersonnel
);

module.exports = router;
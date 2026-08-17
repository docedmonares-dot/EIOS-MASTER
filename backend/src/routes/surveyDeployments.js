const express = require("express");

const router = express.Router();

const {
    verifyToken,
    requireAnyPermission,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require("../security/permissions");

const controller = require(
    "../controllers/surveyDeploymentController"
);

router.get(
    "/",
    verifyToken,
    requireAnyPermission(
        PERMISSIONS.OPERATIONS.MANAGE,
        PERMISSIONS.SUPERVISION.MONITOR,
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getAllDeployments
);

router.get(
    "/:id",
    verifyToken,
    requireAnyPermission(
        PERMISSIONS.OPERATIONS.MANAGE,
        PERMISSIONS.SUPERVISION.MONITOR,
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getDeploymentById
);

router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createDeployment
);

router.post(
    "/:id/assign-enumerator",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.assignDeploymentToEnumerator
);

module.exports = router;

const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/areaAssignmentController"
);

const {
    verifyToken,
    requirePermission
} = require(
    "../middleware/authMiddleware"
);

const PERMISSIONS = require(
    "../security/permissions"
);

// Operations views all
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.getAllAreaAssignments
);

// Enumerator views own
router.get(
    "/mine",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.getOwnAreaAssignments
);

// Operations creates assignment
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createAreaAssignment
);

module.exports = router;
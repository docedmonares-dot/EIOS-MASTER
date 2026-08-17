const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/enumeratorsController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENUMERATOR MANAGEMENT
========================================================= */

// View Enumerators
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.getAllEnumerators
);

// Create Enumerator
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createEnumerator
);

module.exports = router;
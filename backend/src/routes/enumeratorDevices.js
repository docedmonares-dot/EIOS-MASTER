const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/enumeratorDevicesController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENUMERATOR DEVICES
========================================================= */

// View Registered Devices
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.getAllDevices
);

// Register Device
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.registerDevice
);

// Approve Device
router.put(
    "/:id/approve",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.approveDevice
);

module.exports = router;
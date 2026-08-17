const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/offlineResponseController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   OFFLINE RESPONSE MANAGEMENT
========================================================= */

// View Offline Responses
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.getAllOfflineResponses
);

// Enumerator Views Own Offline Responses
router.get(
    "/mine",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.getOwnOfflineResponses
);

// Enumerator Saves Offline Response
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.createOfflineResponse
);

// Enumerator Synchronizes Own Offline Response
router.post(
    "/sync-own/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.syncOwnOfflineResponse
);

// Synchronize Offline Response
router.post(
    "/sync/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.syncOfflineResponse
);

module.exports = router;
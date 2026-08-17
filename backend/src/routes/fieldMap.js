const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/fieldMapController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   FIELD MAP
========================================================= */

router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.ANALYTICS.ANALYZE
    ),
    controller.getFieldMap
);

module.exports = router;
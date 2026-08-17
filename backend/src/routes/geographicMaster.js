const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/geographicMasterController"
);

const {
    verifyToken,
    requirePermission,
    requireAnyPermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   GEOGRAPHIC SUMMARY
========================================================= */

router.get(
    "/summary",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getGeographicSummary
);

/* =========================================================
   GEOGRAPHIC ROOTS
========================================================= */

router.get(
    "/roots",
    verifyToken,
    requireAnyPermission(
        PERMISSIONS.EXECUTIVE.VIEW,
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.getGeographicRoots
);

/* =========================================================
   GEOGRAPHIC CHILDREN
========================================================= */

router.get(
    "/children/:parentGeoUnitId",
    verifyToken,
    requireAnyPermission(
        PERMISSIONS.EXECUTIVE.VIEW,
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.getGeographicChildren
);

/* =========================================================
   GEOGRAPHIC UNIT DETAILS
========================================================= */

router.get(
    "/units/:geoUnitId",
    verifyToken,
    requireAnyPermission(
        PERMISSIONS.EXECUTIVE.VIEW,
        PERMISSIONS.ENUMERATION.COLLECT
    ),
    controller.getGeographicUnitById
);

module.exports = router;

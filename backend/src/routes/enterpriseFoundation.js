const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/enterpriseFoundationController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENTERPRISE PROFILE
========================================================= */

router.get(
    "/profile",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getEnterpriseProfile
);

/* =========================================================
   ENTERPRISE PRINCIPLES
========================================================= */

router.get(
    "/principles",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getEnterprisePrinciples
);

/* =========================================================
   ENTERPRISE SETTINGS
========================================================= */

router.get(
    "/settings",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.VIEW
    ),
    controller.getEnterpriseSettings
);

router.patch(
    "/settings/:settingId",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.UPDATE
    ),
    controller.updateEnterpriseSetting
);

module.exports = router;

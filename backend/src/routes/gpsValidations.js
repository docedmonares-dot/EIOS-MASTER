const express = require("express");
const router = express.Router();
const controller = require("../controllers/gpsValidationController");
const { verifyToken, requireAnyPermission, requirePermission } = require("../middleware/authMiddleware");
const PERMISSIONS = require("../security/permissions");

router.get(
    "/",
    verifyToken,
    requireAnyPermission(PERMISSIONS.SUPERVISION.MONITOR, PERMISSIONS.EXECUTIVE.VIEW),
    controller.getValidations
);

router.post(
    "/:id/review",
    verifyToken,
    requirePermission(PERMISSIONS.SUPERVISION.MONITOR),
    controller.reviewValidation
);

module.exports = router;

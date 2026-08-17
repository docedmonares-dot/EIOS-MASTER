const express = require("express");
const router = express.Router();
const controller = require("../controllers/systemHealthController");
const { verifyToken, requirePermission } = require("../middleware/authMiddleware");
const PERMISSIONS = require("../security/permissions");

router.get(
    "/",
    verifyToken,
    requirePermission(PERMISSIONS.EXECUTIVE.VIEW),
    controller.getSystemHealth
);

module.exports = router;

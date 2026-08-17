const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require("../security/permissions");

/*
=========================================================
ADMIN DASHBOARD
=========================================================
*/

router.get(
    "/dashboard",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    adminController.getDashboardSummary
);

module.exports = router;
const express = require("express");
const router = express.Router();

const adminUserController = require("../controllers/adminUserController");

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require("../security/permissions");

/*
=========================================================
USER MANAGEMENT
=========================================================
*/

// View Users
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.VIEW
    ),
    adminUserController.getAllUsers
);

// Create User
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.CREATE
    ),
    adminUserController.createUser
);

// Update User
router.put(
    "/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.UPDATE
    ),
    adminUserController.updateUser
);

// Reset User Password
router.post(
    "/:id/reset-password",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.UPDATE
    ),
    adminUserController.resetPassword
);

// Disable/Delete User
router.delete(
    "/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.DISABLE
    ),
    adminUserController.deleteUser
);

module.exports = router;
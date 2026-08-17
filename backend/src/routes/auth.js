const express = require("express");

const router = express.Router();

const authController = require(
    "../controllers/authController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions");

/* =========================================================
   HEALTH CHECK
========================================================= */

router.get(
    "/health",
    authController.healthCheck
);

router.post(
    "/change-password",
    verifyToken,
    authController.changePassword
);

/* =========================================================
   AUTHENTICATION
========================================================= */

router.post(
    "/login",
    authController.login
);

router.post(
    "/register",
    authController.register
);

router.get(
    "/me",
    verifyToken,
    authController.me
);

/* =========================================================
   ADMIN SECURITY TEST
========================================================= */

router.get(
    "/admin-test",
    verifyToken,
    requirePermission(
        PERMISSIONS.IAM.USER.VIEW
    ),
    (req, res) => {

        res.json({

            success: true,

            message:
                "Enterprise IAM authorization successful.",

            user: req.user

        });

    }
);

module.exports = router;

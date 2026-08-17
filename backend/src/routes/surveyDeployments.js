const express = require("express");

const router = express.Router();

const {
    verifyToken,
    requireRole
} = require("../middleware/authMiddleware");

const controller = require(
    "../controllers/surveyDeploymentController"
);

router.get(
    "/",
    verifyToken,
    requireRole(
        "Super Admin",
        "Admin",
        "Supervisor"
    ),
    controller.getAllDeployments
);

router.get(
    "/:id",
    verifyToken,
    requireRole(
        "Super Admin",
        "Admin",
        "Supervisor"
    ),
    controller.getDeploymentById
);

router.post(
    "/",
    verifyToken,
    requireRole(
        "Super Admin",
        "Admin"
    ),
    controller.createDeployment
);

router.post(
    "/:id/assign-enumerator",
    verifyToken,
    requireRole(
        "Super Admin",
        "Admin"
    ),
    controller.assignDeploymentToEnumerator
);

module.exports = router;

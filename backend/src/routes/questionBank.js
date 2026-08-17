const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/questionBankController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENTERPRISE QUESTION BANK
========================================================= */

// View All Questions
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getAllQuestions
);

// View Single Question
router.get(
    "/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getQuestionById
);

// Create Question
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createQuestion
);

// Update Question
router.put(
    "/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.updateQuestion
);

// Delete Question
router.delete(
    "/:id",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.deleteQuestion
);

module.exports = router;
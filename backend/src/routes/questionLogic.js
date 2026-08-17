const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/questionLogicController"
);

const {
  verifyToken,
  requirePermission,
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
  "../security/permissions"
);

/* =========================================================
   QUESTION LOGIC
========================================================= */

// View All Question Logic
router.get(
  "/",
  verifyToken,
  requirePermission(
    PERMISSIONS.EXECUTIVE.VIEW
  ),
  controller.getAllQuestionLogic
);

// View Logic for One Question
router.get(
  "/question/:questionId",
  verifyToken,
  requirePermission(
    PERMISSIONS.EXECUTIVE.VIEW
  ),
  controller.getQuestionLogicByQuestionId
);

// View Single Logic Record
router.get(
  "/:id",
  verifyToken,
  requirePermission(
    PERMISSIONS.EXECUTIVE.VIEW
  ),
  controller.getQuestionLogicById
);

// Create Question Logic
router.post(
  "/",
  verifyToken,
  requirePermission(
    PERMISSIONS.OPERATIONS.MANAGE
  ),
  controller.createQuestionLogic
);

// Update Question Logic
router.put(
  "/:id",
  verifyToken,
  requirePermission(
    PERMISSIONS.OPERATIONS.MANAGE
  ),
  controller.updateQuestionLogic
);

// Delete Question Logic
router.delete(
  "/:id",
  verifyToken,
  requirePermission(
    PERMISSIONS.OPERATIONS.MANAGE
  ),
  controller.deleteQuestionLogic
);

module.exports = router;
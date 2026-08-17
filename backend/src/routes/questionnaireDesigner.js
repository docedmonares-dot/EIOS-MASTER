const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/questionnaireDesignerController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   DESIGNER WORKSPACE
========================================================= */

router.get(
    "/:surveyId/workspace",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getDesignerWorkspace
);

/* =========================================================
   CREATE SECTION
========================================================= */

router.post(
    "/:surveyId/sections",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createSection
);

/* =========================================================
   CREATE SURVEY-LOCAL QUESTION
========================================================= */

router.post(
    "/:surveyId/local-questions",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createLocalQuestion
);

/* =========================================================
   ADD ENTERPRISE QUESTION
========================================================= */

router.post(
    "/:surveyId/enterprise-questions",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.addEnterpriseQuestion
);

/* =========================================================
   UPDATE QUESTIONNAIRE ITEM
========================================================= */

router.put(
    "/:surveyId/items/:itemId",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.updateQuestionnaireItem
);

module.exports = router;
const express = require("express");

const router = express.Router();

const controller = require(
    "../controllers/choiceLibraryController"
);

const {
    verifyToken,
    requirePermission
} = require("../middleware/authMiddleware");

const PERMISSIONS = require(
    "../security/permissions"
);

/* =========================================================
   ENTERPRISE CHOICE LIBRARY
========================================================= */

// View Choice Libraries
router.get(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getChoiceLists
);

// Create Choice Library
router.post(
    "/",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createChoiceList
);

// Create Choice Item
router.post(
    "/:choiceListId/items",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.createChoiceItem
);

// Update Choice Item
router.put(
    "/items/:choiceItemId",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.updateChoiceItem
);

// Deactivate Choice Item
router.delete(
    "/items/:choiceItemId",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.deactivateChoiceItem
);

// Deactivate Choice List
router.delete(
    "/:choiceListId",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.deactivateChoiceList
);

// Reorder Choice Items
router.put(
    "/:choiceListId/items/reorder",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.reorderChoiceItems
);

// Update Choice List
router.put(
    "/:choiceListId",
    verifyToken,
    requirePermission(
        PERMISSIONS.OPERATIONS.MANAGE
    ),
    controller.updateChoiceList
);

// View Single Choice Library
router.get(
    "/:choiceListId",
    verifyToken,
    requirePermission(
        PERMISSIONS.EXECUTIVE.VIEW
    ),
    controller.getChoiceListById
);

module.exports = router;
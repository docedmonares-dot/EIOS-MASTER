const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/mine", verifyToken, controller.getMyNotifications);
router.post("/:id/read", verifyToken, controller.markRead);

module.exports = router;

const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/questionTypeController"
);

router.get(
  "/",
  controller.getAllQuestionTypes
);

module.exports = router;
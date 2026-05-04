const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");
const auth = require("../middleware/auth");

router.use(auth);
router.get("/:enrollmentId", progressController.getProgress);
router.put(
  "/:enrollmentId/content/:contentId",
  progressController.markContentComplete,
);
router.get("/history/:courseId", progressController.getProgressHistory);
router.get(
  "/activity/user-activity",
  progressController.getUserProgressActivity,
);

module.exports = router;

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/:enrollmentId', progressController.getProgress);
router.put('/:enrollmentId/content/:contentId', progressController.markContentComplete);

module.exports = router;

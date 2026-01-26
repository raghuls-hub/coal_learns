const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(auth);

router.post('/embeddings/:contentId', requireRole('admin', 'mentor'), aiController.generateEmbeddings);
router.post('/chat', aiController.answerQuestion);
router.post('/help', aiController.getContextualHelp);

module.exports = router;

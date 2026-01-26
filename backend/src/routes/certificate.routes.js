const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Public verification
router.get('/verify/:certificateId', certificateController.verifyCertificate);

// Protected routes
router.use(auth);

router.post('/generate', requireRole('admin', 'candidate'), certificateController.generateCertificate);
router.post('/revoke/:certificateId', requireRole('admin'), certificateController.revokeCertificate);

module.exports = router;

const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const auth = require('../middleware/auth');
const authOrToken = require('../middleware/authOrToken');
const identify = require('../middleware/identify');

// Debug logging
router.use((req, res, next) => {
  console.log(`[CERTIFICATE ROUTE] ${req.method} ${req.path}`);
  console.log('[CERTIFICATE ROUTE] Full URL:', req.originalUrl);
  next();
});

// Protected
router.get('/my', auth, certificateController.getMyCertificates);
router.post('/claim', auth, certificateController.claimCertificate);
router.get('/:id', identify, certificateController.getCertificate);
router.get('/download/:id', authOrToken, certificateController.downloadCertificate); // Use authOrToken to support query params

// Public (Verification)

module.exports = router;

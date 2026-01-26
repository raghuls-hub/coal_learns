const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const auth = require('../middleware/auth');

// Protected routes
router.get('/my', auth, certificateController.getMyCertificates);

// Public routes (Verification and Download)
router.get('/verify/:id', certificateController.verifyCertificate);
router.get('/download/:id', certificateController.downloadCertificate); // Usually public if they have the ID, or protect it? User said scan QR -> Web -> Verify. Download might be protected or link based. I'll make download public if they have the UUID.
router.get('/:id', certificateController.getCertificate);

module.exports = router;

const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const auth = require('../middleware/auth');
const authOrToken = require('../middleware/authOrToken');
const identify = require('../middleware/identify');

router.get('/my', auth, certificateController.getMyCertificates);
router.post('/claim', auth, certificateController.claimCertificate);
router.get('/:id', identify, certificateController.getCertificate);
router.get('/download/:id', authOrToken, certificateController.downloadCertificate);

module.exports = router;

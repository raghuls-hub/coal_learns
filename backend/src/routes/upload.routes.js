const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// Upload Endpoint
router.post('/', auth, uploadController.upload.single('file'), uploadController.uploadFile);

// Get File Endpoint (Public if needed, or auth protected)
router.get('/file/:filename', uploadController.getFile);

module.exports = router;

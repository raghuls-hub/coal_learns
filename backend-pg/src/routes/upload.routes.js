const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

router.post('/', auth, uploadController.upload.single('file'), uploadController.uploadFile);
router.get('/file/:filename', uploadController.getFile);

module.exports = router;

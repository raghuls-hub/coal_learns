const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(auth);
router.post('/', enrollmentController.createEnrollment);
router.get('/my-courses', enrollmentController.getMyEnrollments);
router.get('/my', enrollmentController.getMyEnrollments);
router.get('/tutor', requireRole('mentor', 'admin'), enrollmentController.getTutorEnrollments);
router.get('/check/:courseId', enrollmentController.checkEnrollmentStatus);
router.get('/:id', enrollmentController.getEnrollmentById);

module.exports = router;

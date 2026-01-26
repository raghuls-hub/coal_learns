const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const identify = require('../middleware/identify');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All routes here should be protected generally, but we'll apply auth explicitly
router.use(auth);

// Enroll in a course (Purchase)
router.post(
    '/',
    enrollmentController.createEnrollment
);

// Get my enrollments
router.get(
    '/my',
    enrollmentController.getMyEnrollments
);

// Check enrollment status
router.get(
    '/check/:courseId',
    enrollmentController.checkEnrollmentStatus
);

module.exports = router;

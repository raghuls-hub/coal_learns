const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');
const identify = require('../middleware/identify');
const { authorize, requireRole } = require('../middleware/rbac');
const { validate, schemas } = require('../middleware/validation');

// Public routes (with optional identification)
router.get('/', identify, courseController.getCourses);
router.get('/:id', identify, courseController.getCourseById);

// Protected routes - Course Handler ONLY for creation
router.post(
  '/',
  auth,
  requireRole('course_handler'), // Only course handlers can create courses
  validate(schemas.createCourse),
  courseController.createCourse
);

// Admins and Course Handlers can update/delete
router.put(
  '/:id',
  auth,
  requireRole('course_handler', 'admin'),
  courseController.updateCourse
);

router.delete(
  '/:id',
  auth,
  requireRole('course_handler', 'admin'),
  courseController.deleteCourse
);

router.put(
  '/:id/publish',
  auth,
  requireRole('course_handler', 'admin'),
  courseController.togglePublish
);

router.post(
  '/:id/tutors',
  auth,
  requireRole('course_handler', 'admin'),
  courseController.addTutor
);

router.delete(
  '/:id/tutors/:tutorId',
  auth,
  requireRole('course_handler', 'admin'),
  courseController.removeTutor
);

// Module Routes
router.get('/:id/modules', identify, courseController.getModules);
router.post(
  '/:id/modules',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.createModule
);

router.get('/:id/modules/:moduleId', identify, courseController.getModule);

router.post(
  '/:id/modules/:moduleId/content',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.addContent
);

router.post(
  '/:id/modules/:moduleId/assessment',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.addAssessment
);

// Content Routes
router.put(
  '/content/:contentId',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.updateContent
);

router.delete(
  '/content/:contentId',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.deleteContent
);

// Assessment Routes
router.put(
  '/assessments/:assessmentId',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.updateAssessment
);

router.delete(
  '/assessments/:assessmentId',
  auth,
  requireRole('course_handler', 'tutor', 'admin'),
  courseController.deleteAssessment
);

module.exports = router;

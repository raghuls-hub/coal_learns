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
  requireRole('mentor'), // Only mentors can create courses
  validate(schemas.createCourse),
  courseController.createCourse
);

// Admins and Course Handlers can update/delete
router.put(
  '/:id',
  auth,
  requireRole('mentor', 'admin'),
  courseController.updateCourse
);

router.delete(
  '/:id',
  auth,
  requireRole('mentor', 'admin'),
  courseController.deleteCourse
);

router.put(
  '/:id/publish',
  auth,
  requireRole('mentor', 'admin'),
  courseController.togglePublish
);

router.post(
  '/:id/tutors',
  auth,
  requireRole('mentor', 'admin'),
  courseController.addTutor
);

router.delete(
  '/:id/tutors/:tutorId',
  auth,
  requireRole('mentor', 'admin'),
  courseController.removeTutor
);

// Module Routes
router.get('/:id/modules', identify, courseController.getModules);
router.post(
  '/:id/modules',
  auth,
  requireRole('mentor', 'admin'),
  courseController.createModule
);

router.get('/:id/modules/:moduleId', identify, courseController.getModule);

router.put(
  '/:id/modules/:moduleId',
  auth,
  requireRole('mentor', 'admin'),
  courseController.updateModule
);

router.delete(
  '/:id/modules/:moduleId',
  auth,
  requireRole('mentor', 'admin'),
  courseController.deleteModule
);

router.post(
  '/:id/modules/:moduleId/content',
  auth,
  requireRole('mentor', 'admin'),
  courseController.addContent
);





// Content Routes
router.put(
  '/content/:contentId',
  auth,
  requireRole('mentor', 'admin'),
  courseController.updateContent
);

router.delete(
  '/content/:contentId',
  auth,
  requireRole('mentor', 'admin'),
  courseController.deleteContent
);



module.exports = router;

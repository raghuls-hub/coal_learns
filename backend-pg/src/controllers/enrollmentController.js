const enrollmentService = require('../services/enrollmentService');
const { pool } = require('../config/database');
const catchAsync = require('../utils/catchAsync');

exports.createEnrollment = catchAsync(async (req, res) => {
  const { courseId } = req.body;

  const { rows: courseRows } = await pool.query(
    `SELECT c.*, COUNT(m.id) AS module_count
     FROM courses c
     LEFT JOIN modules m ON m.course_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [courseId]
  );

  if (!courseRows.length) return res.status(404).json({ success: false, message: 'Course not found' });
  const course = courseRows[0];

  const existing = await enrollmentService.findEnrollment(req.user.userId, courseId);
  if (existing && existing.payment_status === 'completed') {
    return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
  }

  // Get instructor name
  const { rows: handlerRows } = await pool.query(
    'SELECT first_name, last_name FROM users WHERE id = $1',
    [course.course_handler_id]
  );
  const courseHandlerName = handlerRows.length
    ? `${handlerRows[0].first_name} ${handlerRows[0].last_name}`
    : 'Unknown Instructor';

  const enrollment = await enrollmentService.createEnrollment(req.user.userId, courseId, courseHandlerName, course);

  res.status(201).json({ success: true, data: enrollment, message: 'Enrollment successful' });
});

exports.getMyEnrollments = catchAsync(async (req, res) => {
  const enrollments = await enrollmentService.getMyEnrollments(req.user.userId);
  res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

exports.getTutorEnrollments = catchAsync(async (req, res) => {
  const enrollments = await enrollmentService.getTutorEnrollments(req.user.userId);
  res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
});

exports.checkEnrollmentStatus = catchAsync(async (req, res) => {
  const result = await enrollmentService.checkEnrollmentStatus(req.user.userId, req.params.courseId);
  res.status(200).json({ success: true, ...result });
});

exports.getEnrollmentById = catchAsync(async (req, res) => {
  const enrollment = await enrollmentService.getEnrollmentById(req.params.id, req.user.userId);
  res.status(200).json({ success: true, data: enrollment });
});

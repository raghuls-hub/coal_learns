const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');

/**
 * Enroll candidate in a course
 */
exports.enrollInCourse = async (candidateId, courseId, paymentId = null) => {
  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    candidate: candidateId,
    course: courseId,
  });

  if (existingEnrollment) {
    throw new Error('Already enrolled in this course');
  }

  // Check course exists and is published
  const course = await Course.findById(courseId).populate('modules');

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.settings.isPublished) {
    throw new Error('Course is not available for enrollment');
  }

  // Check enrollment limit
  if (course.settings.enrollmentLimit && course.stats.enrollmentCount >= course.settings.enrollmentLimit) {
    throw new Error('Course enrollment is full');
  }

  // Create enrollment
  const enrollment = new Enrollment({
    candidate: candidateId,
    course: courseId,
    payment: paymentId,
    status: 'active',
  });

  await enrollment.save();

  // Initialize progress tracking
  const moduleProgress = course.modules.map((module, index) => ({
    module: module._id,
    isUnlocked: index === 0, // First module is unlocked by default
    isCompleted: false,
    completionPercentage: 0,
    contentProgress: [],
  }));

  const progress = new Progress({
    enrollment: enrollment._id,
    candidate: candidateId,
    course: courseId,
    moduleProgress,
    overallCompletion: 0,
  });

  await progress.save();

  // Update course stats
  course.stats.enrollmentCount += 1;
  await course.save();

  return enrollment;
};

/**
 * Get candidate enrollments
 */
exports.getEnrollments = async (candidateId) => {
  const enrollments = await Enrollment.find({ candidate: candidateId })
    .populate('course', 'title description thumbnail level')
    .populate('payment')
    .sort({ enrolledAt: -1 });

  return enrollments;
};

/**
 * Get enrollment by ID
 */
exports.getEnrollmentById = async (enrollmentId, candidateId) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    candidate: candidateId,
  })
    .populate({
      path: 'course',
      populate: { path: 'modules courseHandler tutors' },
    })
    .populate('payment');

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  return enrollment;
};

/**
 * Cancel enrollment (admin/candidate)
 */
exports.cancelEnrollment = async (enrollmentId, userId) => {
  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  enrollment.status = 'cancelled';
  await enrollment.save();

  // Update course stats
  await Course.findByIdAndUpdate(enrollment.course, {
    $inc: { 'stats.enrollmentCount': -1 },
  });

  return enrollment;
};

module.exports = exports;

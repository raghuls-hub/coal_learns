const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const catchAsync = require('../utils/catchAsync');

// @desc    Enroll in a course (Purchase)
// @route   POST /api/enrollments
// @access  Private (Candidate)
exports.createEnrollment = catchAsync(async (req, res) => {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        user: req.user.userId,
        course: courseId,
        paymentStatus: 'completed'
    });

    if (existingEnrollment) {
        return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    // Mock Payment Logic
    // In a real app, we would initiate a Stripe session here.
    // For now, we assume immediate success.

    const enrollment = await Enrollment.create({
        user: req.user.userId,
        course: courseId,
        amountPaid: course.pricing.amount,
        currency: course.pricing.currency,
        paymentStatus: 'completed', // Auto-complete for mock
        transactionId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`
    });

    // Update course stats
    await Course.findByIdAndUpdate(courseId, { $inc: { 'stats.enrollmentCount': 1 } });

    res.status(201).json({
        success: true,
        data: enrollment,
        message: 'Enrollment successful'
    });
});

// @desc    Get my enrollments
// @route   GET /api/enrollments/my
// @access  Private
exports.getMyEnrollments = catchAsync(async (req, res) => {
    const enrollments = await Enrollment.find({ user: req.user.userId, paymentStatus: 'completed' })
        .populate({
            path: 'course',
            select: 'title description thumbnail category level pricing courseHandler runTime'
        })
        .sort('-enrolledAt');

    res.status(200).json({
        success: true,
        count: enrollments.length,
        data: enrollments
    });
});

// @desc    Check enrollment status for a specific course
// @route   GET /api/enrollments/check/:courseId
// @access  Private
exports.checkEnrollmentStatus = catchAsync(async (req, res) => {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
        user: req.user.userId,
        course: courseId,
        paymentStatus: 'completed'
    });

    res.status(200).json({
        success: true,
        isEnrolled: !!enrollment,
        enrollment: enrollment || null
    });
});

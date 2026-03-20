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

    // Populate Mock Payment with Snapshot
    const courseHandlerName = await (async () => {
        if (!course.courseHandler) return 'Unknown Instructor';
        const User = require('../models/User');
        const handler = await User.findById(course.courseHandler);
        return handler ? `${handler.profile.firstName} ${handler.profile.lastName}` : 'Unknown Instructor';
    })();

    const enrollment = await Enrollment.create({
        user: req.user.userId,
        course: courseId,
        amountPaid: course.pricing.amount,
        currency: course.pricing.currency,
        paymentStatus: 'completed', // Auto-complete for mock
        transactionId: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        // [NEW] Persistent Snapshot
        courseSnapshot: {
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            category: course.category,
            level: course.level,
            instructorName: courseHandlerName,
            totalModules: course.modules?.length || 0,
            totalDuration: 0 // TODO: Calculate if available
        }
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
            select: 'title description thumbnail category level pricing courseHandler runTime settings'
        })
        .sort('-enrolledAt');

    res.status(200).json({
        success: true,
        count: enrollments.length,
        data: enrollments
    });
});

// @desc    Get enrollments for courses managed by the tutor
// @route   GET /api/enrollments/tutor
// @access  Private (Mentor)
exports.getTutorEnrollments = catchAsync(async (req, res) => {
    // Find courses managed by this tutor
    const myCourses = await Course.find({ courseHandler: req.user.userId }).select('_id title');
    const courseIds = myCourses.map(c => c._id);

    // Find enrollments for these courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds }, paymentStatus: 'completed' })
        .populate('user', 'profile email')
        .populate('course', 'title settings pricing stats')
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

// @desc    Get enrollment by ID
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollmentById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
        _id: id,
        user: req.user.userId
    }).populate({
        path: 'course',
        populate: {
            path: 'modules',
            populate: {
                path: 'content'
            }
        }
    });

    if (!enrollment) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.status(200).json({
        success: true,
        data: enrollment
    });
});

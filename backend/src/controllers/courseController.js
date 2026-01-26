const courseService = require('../services/courseService');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Course Handler, Admin)
 */
exports.createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public/Private (depends on filter)
 */
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, page = 1, limit = 10 } = req.query;

    const filters = {
      category,
      level,
      search,
    };

    // If not admin, restrict to courses created by or assigned to the user
    // If user is a mentor, they can only see their own courses
    // Admin, Candidate should see all courses (subject to publication status)
    if (req.user && req.user.role === 'mentor') {
      filters.courseHandler = req.user.userId;
    }

    // For public or candidates, show only published courses (optional, depends on requirements but good practice)
    // If you want candidates to see everything, remove this block. 
    // Usually, public/candidates see published courses.
    if (!req.user || req.user.role === 'candidate') {
      filters.isPublished = true;
    }

    const result = await courseService.getCourses(filters, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('courseHandler', 'profile.firstName profile.lastName email')
    .populate('tutors', 'profile.firstName profile.lastName');

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Determine if user has access to full content
  let hasAccess = false;

  // if admin or mentor of this course
  if (req.user) {
    if (['admin', 'mentor'].includes(req.user.role)) {
      hasAccess = true;
    } else {
      // Check enrollment for candidates
      const enrollment = await Enrollment.findOne({
        user: req.user.userId,
        course: course._id,
        paymentStatus: 'completed'
      });
      if (enrollment) hasAccess = true;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      ...course.toObject(),
      hasAccess // Frontend can use this to show "Buy Now" or "Go to Course"
    }
  });
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Course Handler, Admin)
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Course Handler, Admin)
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/:id/publish
 * @desc    Publish/unpublish course
 * @access  Private (Course Handler, Admin)
 */
exports.togglePublish = async (req, res, next) => {
  try {
    const course = await courseService.togglePublishCourse(req.params.id, req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      message: `Course ${course.settings.isPublished ? 'published' : 'unpublished'} successfully`,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses/:id/tutors
 * @desc    Add tutor to course
 * @access  Private (Course Handler, Admin)
 */
exports.addTutor = async (req, res, next) => {
  try {
    const { tutorId } = req.body;
    const course = await courseService.addTutor(req.params.id, tutorId, req.user.userId, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Tutor added successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/courses/:id/tutors/:tutorId
 * @desc    Remove tutor from course
 * @access  Private (Course Handler, Admin)
 */
exports.removeTutor = async (req, res, next) => {
  try {
    const course = await courseService.removeTutor(
      req.params.id,
      req.params.tutorId,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Tutor removed successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses/:id/modules
 * @desc    Get all modules for a course
 * @access  Public/Private
 */
exports.getModules = async (req, res, next) => {
  try {
    const modules = await courseService.getModulesByCourseId(req.params.id);
    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses/:id/modules
 * @desc    Create a module
 * @access  Private
 */
exports.createModule = async (req, res, next) => {
  try {
    const module = await courseService.createModule(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Module created', data: module });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses/:id/modules/:moduleId
 * @desc    Get specific module
 * @access  Public/Private
 */
exports.getModule = async (req, res, next) => {
  try {
    const module = await courseService.getModuleById(req.params.moduleId);
    res.status(200).json({ success: true, data: module });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses/:id/modules/:moduleId/content
 * @desc    Add content
 * @access  Private
 */
exports.addContent = async (req, res, next) => {
  try {
    const module = await courseService.addContentToModule(req.params.moduleId, req.body);
    res.status(201).json({ success: true, message: 'Content added', data: module });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses/:id/modules/:moduleId/assessment
 * @desc    Add assessment
 * @access  Private
 */
exports.addAssessment = async (req, res, next) => {
  try {
    const module = await courseService.addAssessmentToModule(req.params.moduleId, req.body);
    res.status(201).json({ success: true, message: 'Assessment created', data: module });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/content/:contentId
 * @desc    Update content
 * @access  Private
 */
exports.updateContent = async (req, res, next) => {
  try {
    const content = await courseService.updateContent(req.params.contentId, req.body);
    res.status(200).json({ success: true, message: 'Content updated', data: content });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/content/:contentId
 * @desc    Delete content
 * @access  Private
 */
exports.deleteContent = async (req, res, next) => {
  try {
    const result = await courseService.deleteContent(req.params.contentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/assessments/:assessmentId
 * @desc    Update assessment
 * @access  Private
 */
exports.updateAssessment = async (req, res, next) => {
  try {
    const assessment = await courseService.updateAssessment(req.params.assessmentId, req.body);
    res.status(200).json({ success: true, message: 'Assessment updated', data: assessment });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/courses/assessments/:assessmentId
 * @desc    Delete assessment
 * @access  Private
 */
exports.deleteAssessment = async (req, res, next) => {
  try {
    const result = await courseService.deleteAssessment(req.params.assessmentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

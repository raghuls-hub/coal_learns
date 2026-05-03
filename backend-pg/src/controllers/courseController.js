const courseService = require('../services/courseService');
const { pool } = require('../config/database');
const catchAsync = require('../utils/catchAsync');

exports.createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user.userId);
    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error) { next(error); }
};

exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, page = 1, limit = 10 } = req.query;
    const filters = { category, level, search };

    if (req.user?.role === 'mentor') filters.courseHandler = req.user.userId;
    if (!req.user || req.user.role === 'candidate') filters.isPublished = true;

    const result = await courseService.getCourses(filters, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getCourseById = catchAsync(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*,
            u.id AS handler_id, u.email AS handler_email,
            u.first_name AS handler_first_name, u.last_name AS handler_last_name
     FROM courses c
     LEFT JOIN users u ON u.id = c.course_handler_id
     WHERE c.id = $1`,
    [req.params.id]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'Course not found' });

  const course = rows[0];
  let hasAccess = false;

  if (req.user) {
    if (['admin', 'mentor'].includes(req.user.role)) {
      hasAccess = true;
    } else {
      const { rows: enr } = await pool.query(
        `SELECT id FROM enrollments WHERE user_id=$1 AND course_id=$2 AND payment_status='completed'`,
        [req.user.userId, course.id]
      );
      if (enr.length) hasAccess = true;
    }
  }

  const formatted = {
    _id: course.id, id: course.id,
    title: course.title, description: course.description,
    thumbnail: course.thumbnail, coverImage: course.cover_image,
    category: course.category, level: course.level,
    courseHandler: {
      _id: course.handler_id, id: course.handler_id,
      email: course.handler_email,
      profile: { firstName: course.handler_first_name, lastName: course.handler_last_name },
    },
    pricing: { amount: parseFloat(course.price_amount), currency: course.price_currency },
    settings: {
      isPublished: course.is_published, isArchived: course.is_archived,
      enrollmentLimit: course.enrollment_limit, passingPercentage: parseFloat(course.passing_percentage),
    },
    stats: { enrollmentCount: course.enrollment_count, completionCount: course.completion_count },
    createdAt: course.created_at,
    hasAccess,
  };

  res.status(200).json({ success: true, data: formatted });
});

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user.userId, req.user.role);
    res.status(200).json({ success: true, message: 'Course updated successfully', data: course });
  } catch (error) { next(error); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user.userId, req.user.role);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.togglePublish = async (req, res, next) => {
  try {
    const course = await courseService.togglePublishCourse(req.params.id, req.user.userId, req.user.role);
    res.status(200).json({
      success: true,
      message: `Course ${course.settings.isPublished ? 'published' : 'unpublished'} successfully`,
      data: course,
    });
  } catch (error) { next(error); }
};

exports.addTutor = async (req, res, next) => {
  try {
    const course = await courseService.addTutor(req.params.id, req.body.tutorId, req.user.userId, req.user.role);
    res.status(200).json({ success: true, message: 'Tutor added successfully', data: course });
  } catch (error) { next(error); }
};

exports.removeTutor = async (req, res, next) => {
  try {
    const course = await courseService.removeTutor(req.params.id, req.params.tutorId, req.user.userId, req.user.role);
    res.status(200).json({ success: true, message: 'Tutor removed successfully', data: course });
  } catch (error) { next(error); }
};

exports.getModules = async (req, res, next) => {
  try {
    const modules = await courseService.getModulesByCourseId(req.params.id);
    res.status(200).json({ success: true, data: modules });
  } catch (error) { next(error); }
};

exports.createModule = async (req, res, next) => {
  try {
    const module = await courseService.createModule(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Module created', data: module });
  } catch (error) { next(error); }
};

exports.getModule = async (req, res, next) => {
  try {
    const module = await courseService.getModuleById(req.params.moduleId);
    res.status(200).json({ success: true, data: module });
  } catch (error) { next(error); }
};

exports.updateModule = async (req, res, next) => {
  try {
    const module = await courseService.updateModule(req.params.moduleId, req.body);
    res.status(200).json({ success: true, message: 'Module updated', data: module });
  } catch (error) { next(error); }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const result = await courseService.deleteModule(req.params.id, req.params.moduleId);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.addContent = async (req, res, next) => {
  try {
    const content = await courseService.addContentToModule(req.params.moduleId, req.body);
    res.status(201).json({ success: true, message: 'Content added', data: content });
  } catch (error) { next(error); }
};

exports.updateContent = async (req, res, next) => {
  try {
    const content = await courseService.updateContent(req.params.contentId, req.body);
    res.status(200).json({ success: true, message: 'Content updated', data: content });
  } catch (error) { next(error); }
};

exports.deleteContent = async (req, res, next) => {
  try {
    const result = await courseService.deleteContent(req.params.contentId);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

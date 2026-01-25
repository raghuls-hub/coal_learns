const Course = require('../models/Course');
const Module = require('../models/Module');

/**
 * Create a new course
 */
exports.createCourse = async (courseData, courseHandlerId) => {
  const course = new Course({
    ...courseData,
    courseHandler: courseHandlerId,
    tutors: [courseHandlerId], // Auto-assign creator as tutor
  });

  await course.save();
  return course;
};

/**
 * Get all courses (with filters)
 */
exports.getCourses = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.level) query.level = filters.level;
  if (filters.courseHandler) query.courseHandler = filters.courseHandler;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const skip = (page - 1) * limit;

  const courses = await Course.find(query)
    .populate('courseHandler', 'profile.firstName profile.lastName email')
    .populate('tutors', 'profile.firstName profile.lastName email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(query);

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get course by ID
 */
exports.getCourseById = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate('courseHandler', 'profile email')
    .populate('tutors', 'profile email')
    .populate({
      path: 'modules',
      populate: {
        path: 'content assessment',
      },
    });

  if (!course) {
    throw new Error('Course not found');
  }

  return course;
};

/**
 * Update course
 */
exports.updateCourse = async (courseId, updateData, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to update this course');
  }

  Object.assign(course, updateData);
  await course.save();

  return course;
};

/**
 * Delete course
 */
exports.deleteCourse = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to delete this course');
  }

  // Delete associated modules and content
  await Module.deleteMany({ course: courseId });

  await Course.findByIdAndDelete(courseId);

  return { message: 'Course deleted successfully' };
};

/**
 * Publish/unpublish course
 */
exports.togglePublishCourse = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to publish this course');
  }

  course.settings.isPublished = !course.settings.isPublished;
  await course.save();

  return course;
};

/**
 * Add tutor to course
 */
exports.addTutor = async (courseId, tutorId, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to add tutors to this course');
  }

  if (course.tutors.includes(tutorId)) {
    throw new Error('Tutor already added to this course');
  }

  course.tutors.push(tutorId);
  await course.save();

  return course;
};

/**
 * Remove tutor from course
 */
exports.removeTutor = async (courseId, tutorId, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to remove tutors from this course');
  }

  course.tutors = course.tutors.filter(id => id.toString() !== tutorId);
  return course;
};

/**
 * Get modules by course ID
 */
exports.getModulesByCourseId = async (courseId) => {
  return await Module.find({ course: courseId }).populate('content').sort('order');
};

/**
 * Get module by ID
 */
exports.getModuleById = async (moduleId) => {
  return await Module.findById(moduleId).populate('content').populate('assessment');
};

/**
 * Create a new module
 */
exports.createModule = async (courseId, moduleData) => {
  const module = new Module({ ...moduleData, course: courseId });
  await module.save();
  
  // Add module to course
  await Course.findByIdAndUpdate(courseId, { $push: { modules: module._id } });
  
  return module;
};

/**
 * Add content to module
 */
const Content = require('../models/Content'); // Ensure Content is imported
exports.addContentToModule = async (moduleId, contentData) => {
  const content = new Content({ ...contentData, module: moduleId });
  await content.save();
  
  const module = await Module.findByIdAndUpdate(
    moduleId, 
    { $push: { content: content._id } },
    { new: true }
  ).populate('content');
  
  return module;
};

/**
 * Add assessment to module
 */
const Assessment = require('../models/Assessment'); // Ensure Assessment is imported
exports.addAssessmentToModule = async (moduleId, assessmentData) => {
  // Check if assessment already exists? For now assume one per module or replace
  // But model has one assessment field.
  const assessment = new Assessment({ ...assessmentData, module: moduleId });
  await assessment.save();
  
  const module = await Module.findByIdAndUpdate(
    moduleId,
    { assessment: assessment._id },
    { new: true }
  ).populate('assessment');
  
  return module;
};

/**
 * Update content
 */
exports.updateContent = async (contentId, updateData) => {
  const content = await Content.findByIdAndUpdate(
    contentId,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!content) {
    throw new Error('Content not found');
  }
  
  return content;
};

/**
 * Delete content
 */
exports.deleteContent = async (contentId) => {
  const content = await Content.findById(contentId);
  
  if (!content) {
    throw new Error('Content not found');
  }
  
  // Remove from module
  await Module.findByIdAndUpdate(content.module, {
    $pull: { content: contentId }
  });
  
  // Delete content
  await Content.findByIdAndDelete(contentId);
  
  return { message: 'Content deleted successfully' };
};

/**
 * Update assessment
 */
exports.updateAssessment = async (assessmentId, updateData) => {
  const assessment = await Assessment.findByIdAndUpdate(
    assessmentId,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  return assessment;
};

/**
 * Delete assessment
 */
exports.deleteAssessment = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  // Remove from module
  await Module.findByIdAndUpdate(assessment.module, {
    assessment: null
  });
  
  // Delete assessment
  await Assessment.findByIdAndDelete(assessmentId);
  
  return { message: 'Assessment deleted successfully' };
};

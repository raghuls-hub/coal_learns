const Course = require('../models/Course');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

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
        path: 'content',
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
  const course = await Course.findById(courseId)
    .populate('courseHandler', 'profile');

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler._id.toString() !== userId) {
    throw new Error('Unauthorized to delete this course');
  }

  // --- STEP 1: Snapshot all enrollments before deletion ---
  let instructorName = 'Platform Instructor';
  if (course.courseHandler && course.courseHandler.profile) {
    instructorName = `${course.courseHandler.profile.firstName} ${course.courseHandler.profile.lastName}`;
  }

  const snapshot = {
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail || '',
    category: course.category,
    level: course.level,
    instructorName,
    totalModules: course.modules ? course.modules.length : 0,
    deletedAt: new Date(),
  };

  // Update all enrollments for this course with the snapshot
  const enrollmentUpdateResult = await Enrollment.updateMany(
    { course: courseId },
    { $set: { courseSnapshot: snapshot } }
  );
  console.log(`[deleteCourse] Snapshotted ${enrollmentUpdateResult.modifiedCount} enrollment(s) for course ${courseId}`);

  // --- STEP 2: Delete modules & content, then course ---
  await Module.deleteMany({ course: courseId });
  await Course.findByIdAndDelete(courseId);

  return { message: 'Course deleted successfully', snapshotted: enrollmentUpdateResult.modifiedCount };
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
  return await Module.findById(moduleId).populate('content');
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
 * Update module
 */
exports.updateModule = async (moduleId, updateData) => {
  const module = await Module.findByIdAndUpdate(moduleId, updateData, { new: true, runValidators: true });
  if (!module) throw new Error('Module not found');
  return module;
};

/**
 * Delete module
 */
exports.deleteModule = async (courseId, moduleId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new Error('Module not found');
  
  // Remove content inside module
  await Content.deleteMany({ module: moduleId });
  
  // Remove module from course
  await Course.findByIdAndUpdate(courseId, { $pull: { modules: moduleId } });
  
  // Delete module
  await Module.findByIdAndDelete(moduleId);
  
  return { message: 'Module deleted successfully' };
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



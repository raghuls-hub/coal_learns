const Module = require('../models/Module');
const Course = require('../models/Course');
const Content = require('../models/Content');

/**
 * Create module for a course
 */
exports.createModule = async (courseId, moduleData, userId, userRole) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  // Check permissions
  if (userRole !== 'admin' && course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to add modules to this course');
  }

  const module = new Module({
    ...moduleData,
    course: courseId,
  });

  await module.save();

  // Add module to course
  course.modules.push(module._id);
  await course.save();

  return module;
};

/**
 * Get all modules for a course
 */
exports.getModulesByCourse = async (courseId) => {
  const modules = await Module.find({ course: courseId })
    .populate('content')
    .populate('assessment')
    .sort({ order: 1 });

  return modules;
};

/**
 * Get module by ID
 */
exports.getModuleById = async (moduleId) => {
  const module = await Module.findById(moduleId)
    .populate('course')
    .populate('content')
    .populate('assessment');

  if (!module) {
    throw new Error('Module not found');
  }

  return module;
};

/**
 * Update module
 */
exports.updateModule = async (moduleId, updateData, userId, userRole) => {
  const module = await Module.findById(moduleId).populate('course');

  if (!module) {
    throw new Error('Module not found');
  }

  // Check permissions
  if (userRole !== 'admin' && module.course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to update this module');
  }

  Object.assign(module, updateData);
  await module.save();

  return module;
};

/**
 * Delete module
 */
exports.deleteModule = async (moduleId, userId, userRole) => {
  const module = await Module.findById(moduleId).populate('course');

  if (!module) {
    throw new Error('Module not found');
  }

  // Check permissions
  if (userRole !== 'admin' && module.course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to delete this module');
  }

  // Delete associated content
  await Content.deleteMany({ module: moduleId });

  // Remove module from course
  await Course.findByIdAndUpdate(module.course._id, {
    $pull: { modules: moduleId },
  });

  await Module.findByIdAndDelete(moduleId);

  return { message: 'Module deleted successfully' };
};

module.exports = exports;

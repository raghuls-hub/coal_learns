const Content = require('../models/Content');
const Module = require('../models/Module');

/**
 * Create content for a module
 */
exports.createContent = async (moduleId, contentData, userId, userRole) => {
  const module = await Module.findById(moduleId).populate('course');

  if (!module) {
    throw new Error('Module not found');
  }

  // Check permissions
  if (userRole !== 'admin' && module.course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to add content to this module');
  }

  const content = new Content({
    ...contentData,
    module: moduleId,
  });

  await content.save();

  // Add content to module
  module.content.push(content._id);
  await module.save();

  return content;
};

/**
 * Get all content for a module
 */
exports.getContentByModule = async (moduleId) => {
  const content = await Content.find({ module: moduleId }).sort({ order: 1 });
  return content;
};

/**
 * Get content by ID
 */
exports.getContentById = async (contentId) => {
  const content = await Content.findById(contentId).populate('module');

  if (!content) {
    throw new Error('Content not found');
  }

  return content;
};

/**
 * Update content
 */
exports.updateContent = async (contentId, updateData, userId, userRole) => {
  const content = await Content.findById(contentId).populate({
    path: 'module',
    populate: { path: 'course' },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Check permissions
  if (userRole !== 'admin' && content.module.course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to update this content');
  }

  // Handle version control for file updates
  if (updateData.data && updateData.data.url && content.data.url) {
    if (!content.data.previousVersions) {
      content.data.previousVersions = [];
    }
    content.data.previousVersions.push({
      url: content.data.url,
      uploadedAt: new Date(),
    });
    content.data.version = (content.data.version || 1) + 1;
  }

  Object.assign(content, updateData);
  await content.save();

  return content;
};

/**
 * Delete content
 */
exports.deleteContent = async (contentId, userId, userRole) => {
  const content = await Content.findById(contentId).populate({
    path: 'module',
    populate: { path: 'course' },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Check permissions
  if (userRole !== 'admin' && content.module.course.courseHandler.toString() !== userId) {
    throw new Error('Unauthorized to delete this content');
  }

  // Remove content from module
  await Module.findByIdAndUpdate(content.module._id, {
    $pull: { content: contentId },
  });

  await Content.findByIdAndDelete(contentId);

  return { message: 'Content deleted successfully' };
};

module.exports = exports;

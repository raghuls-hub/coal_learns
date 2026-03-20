const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('admin', 'mentor', 'candidate').required(),
    profile: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().optional(),
      avatar: Joi.string().uri().optional(),
      bio: Joi.string().optional(),
    }).required(),
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Password reset request
  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  // Password reset
  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  // Course creation
  createCourse: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    thumbnail: Joi.string().uri().optional(),
    category: Joi.string().required(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    pricing: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().default('USD'),
      commissionRate: Joi.number().min(0).max(100).default(20),
    }).required(),
  }),

  // Module creation
  createModule: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    order: Joi.number().integer().min(0).required(),
    unlockRules: Joi.object({
      requiredPreviousModules: Joi.array().items(Joi.string()).optional(),
      minimumPreviousScore: Joi.number().min(0).max(100).default(0),
      requiredVideoCompletion: Joi.boolean().default(false),
    }).optional(),
  }),

};

module.exports = {
  validate,
  schemas,
};

const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map((d) => d.message),
    });
  }
  next();
};

const schemas = {
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

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({ email: Joi.string().email().required() }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),

  createCourse: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    thumbnail: Joi.string().uri().optional(),
    category: Joi.string().required(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    pricing: Joi.object({
      amount: Joi.number().min(0).required(),
      currency: Joi.string().default('USD'),
    }).required(),
  }),

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

module.exports = { validate, schemas };

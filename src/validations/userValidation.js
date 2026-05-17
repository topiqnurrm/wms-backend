const Joi = require('joi');

const passwordRule = Joi.string()
  .min(8)
  .pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain at least 1 uppercase, 1 number, and 1 special character (!@#$%^&*)',
    'any.required': 'Password is required',
  });

const createUserSchema = Joi.object({
  userName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must be at most 100 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  telp: Joi.string().min(10).max(15).optional().allow('', null).messages({
    'string.min': 'Phone number must be at least 10 characters',
    'string.max': 'Phone number must be at most 15 characters',
  }),
  password: passwordRule,
  role: Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').optional().messages({
    'any.only': 'Role must be ADMIN, MANAGER, or STAFF',
  }),
});

const updateUserSchema = Joi.object({
  userName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must be at most 100 characters',
  }),
  telp: Joi.string().min(10).max(15).optional().allow('', null).messages({
    'string.min': 'Phone number must be at least 10 characters',
    'string.max': 'Phone number must be at most 15 characters',
  }),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'STAFF').optional().messages({
    'any.only': 'Role must be ADMIN, MANAGER, or STAFF',
  }),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Old password is required',
  }),
  newPassword: passwordRule,
});

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema };
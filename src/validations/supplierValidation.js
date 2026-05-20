const Joi = require('joi');

const createSupplierSchema = Joi.object({
  supName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Supplier name must be at least 3 characters',
    'string.max': 'Supplier name must be at most 100 characters',
    'any.required': 'Supplier name is required',
  }),
  supCategory: Joi.string()
    .valid('LOCAL', 'IMPORT')
    .optional()
    .messages({
      'any.only': 'Category must be LOCAL or IMPORT',
    }),
  address: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Address must be at most 255 characters',
  }),
});

const updateSupplierSchema = Joi.object({
  supName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Supplier name must be at least 3 characters',
    'string.max': 'Supplier name must be at most 100 characters',
  }),
  supCategory: Joi.string()
    .valid('LOCAL', 'IMPORT')
    .optional()
    .messages({
      'any.only': 'Category must be LOCAL or IMPORT',
    }),
  address: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Address must be at most 255 characters',
  }),
});

module.exports = { createSupplierSchema, updateSupplierSchema };
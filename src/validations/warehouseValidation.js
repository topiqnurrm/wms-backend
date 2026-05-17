const Joi = require('joi');

const createWarehouseSchema = Joi.object({
  whName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Warehouse name must be at least 3 characters',
    'string.max': 'Warehouse name must be at most 100 characters',
    'any.required': 'Warehouse name is required',
  }),
  whLocation: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Location must be at most 255 characters',
  }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
});

const updateWarehouseSchema = Joi.object({
  whName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Warehouse name must be at least 3 characters',
    'string.max': 'Warehouse name must be at most 100 characters',
  }),
  whLocation: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Location must be at most 255 characters',
  }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
});

module.exports = { createWarehouseSchema, updateWarehouseSchema };
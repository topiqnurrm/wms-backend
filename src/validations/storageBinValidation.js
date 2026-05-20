const Joi = require('joi');

const createStorageBinSchema = Joi.object({
  warehouseId: Joi.string().required().messages({
    'any.required': 'Warehouse ID is required',
    'string.base': 'Warehouse ID must be a string',
  }),
  category: Joi.string()
    .valid('SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET')
    .required()
    .messages({
      'any.only': 'Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET',
      'any.required': 'Category is required',
    }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
});

const updateStorageBinSchema = Joi.object({
  category: Joi.string()
    .valid('SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET')
    .optional()
    .messages({
      'any.only': 'Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET',
    }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
});

module.exports = { createStorageBinSchema, updateStorageBinSchema };
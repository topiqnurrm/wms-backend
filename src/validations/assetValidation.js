const Joi = require('joi');

const createAssetSchema = Joi.object({
  assetName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Asset name must be at least 3 characters',
    'string.max': 'Asset name must be at most 100 characters',
    'any.required': 'Asset name is required',
  }),
  category: Joi.string()
    .valid('SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET')
    .required()
    .messages({
      'any.only': 'Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET',
      'any.required': 'Category is required',
    }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price must be greater than or equal to 0',
    'any.required': 'Price is required',
  }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
  supplierId: Joi.string().optional().allow('', null).messages({
    'string.base': 'Supplier ID must be a string',
  }),
  storageBinId: Joi.string().optional().allow('', null).messages({
    'string.base': 'Storage Bin ID must be a string',
  }),
});

const updateAssetSchema = Joi.object({
  assetName: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Asset name must be at least 3 characters',
    'string.max': 'Asset name must be at most 100 characters',
  }),
  category: Joi.string()
    .valid('SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET')
    .optional()
    .messages({
      'any.only': 'Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET',
    }),
  price: Joi.number().min(0).optional().messages({
    'number.min': 'Price must be greater than or equal to 0',
  }),
  remarks: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'Remarks must be at most 500 characters',
  }),
  supplierId: Joi.string().optional().allow('', null).messages({
    'string.base': 'Supplier ID must be a string',
  }),
  storageBinId: Joi.string().optional().allow('', null).messages({
    'string.base': 'Storage Bin ID must be a string',
  }),
});

module.exports = { createAssetSchema, updateAssetSchema };
const Joi = require('joi');

const createWorkOrderSchema = Joi.object({
  type: Joi.string()
    .valid('INBOUND', 'OUTBOUND')
    .required()
    .messages({
      'any.only': 'Type must be INBOUND or OUTBOUND',
      'any.required': 'Type is required',
    }),

  warehouseId: Joi.string()
    .required()
    .messages({
      'any.required': 'Warehouse is required',
    }),

  storageBinId: Joi.string()
    .required()
    .messages({
      'any.required': 'Storage Bin is required',
    }),

  assetId: Joi.string()
    .required()
    .messages({
      'any.required': 'Asset is required',
    }),

  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be greater than 0',
      'any.required': 'Quantity is required',
    }),

  remarks: Joi.string()
    .max(500)
    .optional()
    .allow('', null),
});

module.exports = {
  createWorkOrderSchema,
};
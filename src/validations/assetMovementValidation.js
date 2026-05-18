const Joi = require('joi');

const createAssetMovementSchema = Joi.object({
  type: Joi.string()
    .valid('INBOUND', 'OUTBOUND', 'TRANSFER')
    .required()
    .messages({
      'any.only': 'Type must be INBOUND, OUTBOUND, or TRANSFER',
      'any.required': 'Type is required',
    }),
  quantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Quantity must be greater than or equal to 0',
      'any.required': 'Quantity is required',
    }),
  notes: Joi.string().max(500).optional().allow('', null),
  assetId: Joi.string().required().messages({
    'any.required': 'Asset ID is required',
  }),
  warehouseId: Joi.string().required().messages({
    'any.required': 'Warehouse ID is required',
  }),
  storageBinId: Joi.string().optional().allow('', null),
});

module.exports = { createAssetMovementSchema };
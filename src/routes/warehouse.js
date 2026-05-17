const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/warehouseController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validations/warehouseValidation');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(createWarehouseSchema), create);
router.put('/:id', validate(updateWarehouseSchema), update);
router.delete('/:id', remove);

module.exports = router;
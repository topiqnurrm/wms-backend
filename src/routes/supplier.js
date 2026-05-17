const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/supplierController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSupplierSchema, updateSupplierSchema } = require('../validations/supplierValidation');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(createSupplierSchema), create);
router.put('/:id', validate(updateSupplierSchema), update);
router.delete('/:id', remove);

module.exports = router;
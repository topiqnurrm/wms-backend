const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/storageBinController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStorageBinSchema, updateStorageBinSchema } = require('../validations/storageBinValidation');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(createStorageBinSchema), create);
router.put('/:id', validate(updateStorageBinSchema), update);
router.delete('/:id', remove);

module.exports = router;
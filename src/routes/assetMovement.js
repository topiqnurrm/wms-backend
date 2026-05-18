const express = require('express');
const router = express.Router();
const { getAll, getById, create, remove } = require('../controllers/assetMovementController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAssetMovementSchema } = require('../validations/assetMovementValidation');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getAll);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createAssetMovementSchema), create);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
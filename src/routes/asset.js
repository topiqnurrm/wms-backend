const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/assetController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAssetSchema, updateAssetSchema } = require('../validations/assetValidation');

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(createAssetSchema), create);
router.put('/:id', validate(updateAssetSchema), update);
router.delete('/:id', remove);

module.exports = router;
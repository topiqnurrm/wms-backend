const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, changePassword, remove } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, changePasswordSchema } = require('../validations/userValidation');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), getAll);
router.get('/:id', authorize('ADMIN', 'MANAGER'), getById);
router.post('/', authorize('ADMIN'), validate(createUserSchema), create);
router.put('/:id', authorize('ADMIN'), validate(updateUserSchema), update);
router.patch('/:id/change-password', validate(changePasswordSchema), changePassword);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
const express = require('express');
const router = express.Router();

const { register, login, me } = require('../controllers/authController');

// const {
//   register,
//   login,
//   me,
//   getAll,
//   getById,
//   update,
//   remove
// } = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/authValidation');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, me);
// router.get('/', authenticate, getAll);
// router.get('/:id', authenticate, getById);
// router.put('/:id', authenticate, update);
// router.delete('/:id', authenticate, remove);

module.exports = router;
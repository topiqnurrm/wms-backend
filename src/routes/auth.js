const express = require('express');
const router = express.Router();

const {
  register,
  login,
  me,
  getAll,
  getById,
  update,
  remove
} = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
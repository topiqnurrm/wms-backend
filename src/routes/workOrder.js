const express = require('express');
const router = express.Router();

const workOrderController = require('../controllers/workOrderController');
const { authenticate, authorize } = require('../middleware/auth');

router.post(
  '/:id/generate-labels',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.generateLabels
);

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.getAll
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.getById
);

router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.updateStatus
);

router.get(
  '/:id/fifo-labels',
  authenticate,
  workOrderController.getFifoLabels
);

module.exports = router;
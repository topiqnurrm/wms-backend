const express = require('express');
const router = express.Router();

const workOrderController = require('../controllers/workOrderController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWorkOrderSchema } = require('../validations/workOrderValidation');

// Generate labels untuk WO (didaftarkan sebelum /:id agar tidak tertangkap sebagai id)
router.post(
  '/:id/generate-labels',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.generateLabels
);

// FIFO labels
router.get(
  '/:id/fifo-labels',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.getFifoLabels
);

// List semua WO
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.getAll
);

// Detail WO
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.getById
);

// FIX: tambah POST / untuk create WO + pasang validate
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  validate(createWorkOrderSchema),
  workOrderController.create
);

// Update status WO
router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  workOrderController.updateStatus
);

module.exports = router;
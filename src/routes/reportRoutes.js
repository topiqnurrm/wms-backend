const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get(
  '/inbound',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  reportController.getInboundReport
);

router.get(
  '/outbound',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  reportController.getOutboundReport
);

router.get(
  '/stock',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  reportController.getStockReport
);

// Analytics — summary total stock semua asset
// Query params opsional: ?warehouseId=xxx atau ?storageBinId=xxx
router.get(
  '/analytics',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  reportController.getAnalytics
);

module.exports = router;
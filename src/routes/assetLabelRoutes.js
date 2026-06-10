const express = require('express');
const router = express.Router();

const assetLabelController = require('../controllers/assetLabelController');
const { authenticate, authorize } = require('../middleware/auth');

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  assetLabelController.getAll
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  assetLabelController.getById
);

router.post(
  '/scan',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  assetLabelController.scanLabel
);

router.post(
  '/outbound-scan',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  assetLabelController.outboundScan
);

router.get(
  '/print/:workOrderId',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  assetLabelController.printLabels
);


module.exports = router;
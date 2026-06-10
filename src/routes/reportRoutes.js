const express = require('express');

const router = express.Router();

const reportController = require(
  '../controllers/reportController'
);

router.get(
  '/inbound',
  reportController.getInboundReport
);

router.get(
  '/outbound',
  reportController.getOutboundReport
);

router.get(
  '/stock',
  reportController.getStockReport
);



module.exports = router;
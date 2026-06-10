const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/helpers');

const getInboundReport = async (
  req,
  res,
  next
) => {
  try {
    const scans =
      await prisma.labelScan.findMany({
        orderBy: {
          scannedAt: 'desc',
        },
        include: {
          workOrder: {
            include: {
              warehouse: true,
              storageBin: true,
            },
          },
          scannedBy: {
            select: {
              userName: true,
            },
          },
          label: {
            include: {
              asset: {
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      });

    const data = scans.map(
      (item) => ({
        woNumber:
          item.workOrder.woNumber,
        woCategory:
          item.workOrder.type,
        warehouseName:
          item.workOrder.warehouse
            .whName,
        storageBin:
          item.workOrder.storageBin
            .binAddress,
        assetName:
          item.label.asset.assetName,
        supplierName:
          item.label.asset.supplier
            ?.supName || null,
        remarks:
          item.workOrder.remarks,
        labelCode:
          item.label.labelCode,
        scannedAt:
          item.scannedAt,
        scannedBy:
          item.scannedBy.userName,
        updatedStock:
          item.label.asset.quantity,
      })
    );

    return successResponse(
      res,
      data,
      'Inbound report fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getOutboundReport = async (
  req,
  res,
  next
) => {
  try {
    const labels =
      await prisma.assetLabel.findMany({
        where: {
          isOutbound: true,
        },
        orderBy: {
          outboundAt: 'desc',
        },
        include: {
          asset: {
            include: {
              supplier: true,
            },
          },
          workOrder: {
            include: {
              warehouse: true,
              storageBin: true,
            },
          },
        },
      });

    const data = labels.map(
      (item) => ({
        woNumber:
          item.workOrder.woNumber,
        woCategory:
          item.workOrder.type,
        warehouseName:
          item.workOrder.warehouse
            .whName,
        storageBin:
          item.workOrder.storageBin
            .binAddress,
        assetName:
          item.asset.assetName,
        supplierName:
          item.asset.supplier
            ?.supName || null,
        remarks:
          item.workOrder.remarks,
        labelCode:
          item.labelCode,
        outboundAt:
          item.outboundAt,
      })
    );

    return successResponse(
      res,
      data,
      'Outbound report fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};
const getStockReport = async (
  req,
  res,
  next
) => {
  try {
    const assets =
      await prisma.asset.findMany({
        include: {
          supplier: true,
          storageBin: true,
        },
        orderBy: {
          assetNumber: 'asc',
        },
      });

    const data = assets.map(
      (item) => ({
        assetNumber:
          item.assetNumber,
        assetName:
          item.assetName,
        category:
          item.category,
        supplierName:
          item.supplier?.supName ||
          null,
        storageBin:
          item.storageBin
            ?.binAddress || null,
        stock:
          item.quantity,
        price:
          item.price,
      })
    );

    return successResponse(
      res,
      data,
      'Stock report fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInboundReport,
  getOutboundReport,
  getStockReport,
};
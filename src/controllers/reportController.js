const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/helpers');

const getInboundReport = async (req, res, next) => {
  try {
    const scans = await prisma.labelScan.findMany({
      orderBy: { scannedAt: 'desc' },
      include: {
        workOrder: {
          include: {
            warehouse: true,
            storageBin: true,
          },
        },
        scannedBy: {
          select: { userName: true },
        },
        label: {
          include: {
            asset: {
              include: { supplier: true },
            },
          },
        },
      },
    });

    const data = scans.map((item) => ({
      woNumber: item.workOrder.woNumber,
      woCategory: item.workOrder.type,
      warehouseName: item.workOrder.warehouse.whName,
      storageBin: item.workOrder.storageBin.binAddress,
      assetName: item.label.asset.assetName,
      supplierName: item.label.asset.supplier?.supName || null,
      remarks: item.workOrder.remarks,
      labelCode: item.label.labelCode,
      scannedAt: item.scannedAt,
      scannedBy: item.scannedBy.userName,
      updatedStock: item.label.asset.quantity,
    }));

    return successResponse(res, data, 'Inbound report fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getOutboundReport = async (req, res, next) => {
  try {
    const labels = await prisma.assetLabel.findMany({
      where: { isOutbound: true },
      orderBy: { outboundAt: 'desc' },
      include: {
        asset: {
          include: { supplier: true },
        },
        workOrder: {
          include: {
            warehouse: true,
            storageBin: true,
          },
        },
      },
    });

    const data = labels.map((item) => ({
      woNumber: item.workOrder.woNumber,
      woCategory: item.workOrder.type,
      warehouseName: item.workOrder.warehouse.whName,
      storageBin: item.workOrder.storageBin.binAddress,
      assetName: item.asset.assetName,
      supplierName: item.asset.supplier?.supName || null,
      remarks: item.workOrder.remarks,
      labelCode: item.labelCode,
      outboundAt: item.outboundAt,
    }));

    return successResponse(res, data, 'Outbound report fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getStockReport = async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        supplier: true,
        storageBin: true,
      },
      orderBy: { assetNumber: 'asc' },
    });

    const data = assets.map((item) => ({
      assetNumber: item.assetNumber,
      assetName: item.assetName,
      category: item.category,
      supplierName: item.supplier?.supName || null,
      storageBin: item.storageBin?.binAddress || null,
      stock: item.quantity,
      price: item.price,
    }));

    return successResponse(res, data, 'Stock report fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Analytics — summary total stock semua asset
// Filter opsional: ?warehouseId=xxx atau ?storageBinId=xxx
const getAnalytics = async (req, res, next) => {
  try {
    const { warehouseId, storageBinId } = req.query;

    // Bangun filter berdasarkan query param
    const where = {
      isActive: true,
      ...(storageBinId && { storageBinId }),
      ...(warehouseId && {
        storageBin: {
          warehouseId,
        },
      }),
    };

    const assets = await prisma.asset.findMany({
      where,
      include: {
        supplier: true,
        storageBin: {
          include: { warehouse: true },
        },
      },
      orderBy: { assetNumber: 'asc' },
    });

    // Hitung total stock keseluruhan
    const totalStock = assets.reduce((sum, a) => sum + a.quantity, 0);
    const totalAsset = assets.length;

    // Summary per category
    const perCategory = assets.reduce((acc, a) => {
      if (!acc[a.category]) {
        acc[a.category] = { category: a.category, totalStock: 0, totalAsset: 0 };
      }
      acc[a.category].totalStock += a.quantity;
      acc[a.category].totalAsset += 1;
      return acc;
    }, {});

    // Detail per asset
    const detail = assets.map((item) => ({
      assetNumber: item.assetNumber,
      assetName: item.assetName,
      category: item.category,
      stock: item.quantity,
      storageBin: item.storageBin?.binAddress || null,
      warehouseName: item.storageBin?.warehouse?.whName || null,
      supplierName: item.supplier?.supName || null,
    }));

    return successResponse(
      res,
      {
        totalAsset,
        totalStock,
        perCategory: Object.values(perCategory),
        detail,
      },
      'Analytics fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInboundReport,
  getOutboundReport,
  getStockReport,
  getAnalytics,
};
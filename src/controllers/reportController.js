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


const exportExcel = async (req, res, next) => {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();

    // ===== SHEET 1: INBOUND =====
    const inboundSheet = workbook.addWorksheet('Inbound Log');
    inboundSheet.columns = [
      { header: 'WO Number', key: 'woNumber', width: 15 },
      { header: 'WO Category', key: 'woCategory', width: 15 },
      { header: 'Warehouse', key: 'warehouseName', width: 20 },
      { header: 'Storage Bin', key: 'storageBin', width: 15 },
      { header: 'Asset Name', key: 'assetName', width: 30 },
      { header: 'Supplier', key: 'supplierName', width: 20 },
      { header: 'Remarks', key: 'remarks', width: 25 },
      { header: 'Label Code', key: 'labelCode', width: 20 },
      { header: 'Scanned At', key: 'scannedAt', width: 22 },
      { header: 'Scanned By', key: 'scannedBy', width: 20 },
      { header: 'Updated Stock', key: 'updatedStock', width: 15 },
    ];
    inboundSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    inboundSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };

    const inboundScans = await prisma.labelScan.findMany({
      include: {
        label: { include: { asset: { include: { supplier: true, storageBin: true } }, workOrder: { include: { warehouse: true, storageBin: true } } } },
        scannedBy: true,
      },
      orderBy: { scannedAt: 'desc' },
    });

    for (const scan of inboundScans) {
      const stockAfter = await prisma.asset.findUnique({ where: { id: scan.label.assetId }, select: { quantity: true } });
      inboundSheet.addRow({
        woNumber: scan.label.workOrder.woNumber,
        woCategory: scan.label.workOrder.type,
        warehouseName: scan.label.workOrder.warehouse.whName,
        storageBin: scan.label.workOrder.storageBin.binAddress,
        assetName: scan.label.asset.assetName,
        supplierName: scan.label.asset.supplier?.supName || '-',
        remarks: scan.label.workOrder.remarks || '-',
        labelCode: scan.label.labelCode,
        scannedAt: new Date(scan.scannedAt).toLocaleString('id-ID'),
        scannedBy: scan.scannedBy.userName,
        updatedStock: stockAfter?.quantity ?? 0,
      });
    }

    // ===== SHEET 2: OUTBOUND =====
    const outboundSheet = workbook.addWorksheet('Outbound Log');
    outboundSheet.columns = [
      { header: 'WO Number', key: 'woNumber', width: 15 },
      { header: 'WO Category', key: 'woCategory', width: 15 },
      { header: 'Warehouse', key: 'warehouseName', width: 20 },
      { header: 'Storage Bin', key: 'storageBin', width: 15 },
      { header: 'Asset Name', key: 'assetName', width: 30 },
      { header: 'Supplier', key: 'supplierName', width: 20 },
      { header: 'Label Code', key: 'labelCode', width: 20 },
      { header: 'Inbound At', key: 'inboundAt', width: 22 },
      { header: 'Outbound At', key: 'outboundAt', width: 22 },
    ];
    outboundSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    outboundSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E8449' } };

    const outboundLabels = await prisma.assetLabel.findMany({
      where: { isOutbound: true },
      include: { asset: { include: { supplier: true } }, workOrder: { include: { warehouse: true, storageBin: true } } },
      orderBy: { outboundAt: 'desc' },
    });

    for (const label of outboundLabels) {
      outboundSheet.addRow({
        woNumber: label.workOrder.woNumber,
        woCategory: label.workOrder.type,
        warehouseName: label.workOrder.warehouse.whName,
        storageBin: label.workOrder.storageBin.binAddress,
        assetName: label.asset.assetName,
        supplierName: label.asset.supplier?.supName || '-',
        labelCode: label.labelCode,
        inboundAt: label.inboundAt ? new Date(label.inboundAt).toLocaleString('id-ID') : '-',
        outboundAt: label.outboundAt ? new Date(label.outboundAt).toLocaleString('id-ID') : '-',
      });
    }

    // ===== SHEET 3: STOCK SUMMARY =====
    const stockSheet = workbook.addWorksheet('Stock Summary');
    stockSheet.columns = [
      { header: 'Asset Number', key: 'assetNumber', width: 15 },
      { header: 'Asset Name', key: 'assetName', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Storage Bin', key: 'storageBin', width: 15 },
      { header: 'Warehouse', key: 'warehouseName', width: 20 },
      { header: 'Supplier', key: 'supplierName', width: 20 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
    ];
    stockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    stockSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E75B6' } };

    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      include: { supplier: true, storageBin: { include: { warehouse: true } } },
      orderBy: { assetNumber: 'asc' },
    });

    for (const asset of assets) {
      stockSheet.addRow({
        assetNumber: asset.assetNumber,
        assetName: asset.assetName,
        category: asset.category,
        storageBin: asset.storageBin?.binAddress || '-',
        warehouseName: asset.storageBin?.warehouse?.whName || '-',
        supplierName: asset.supplier?.supName || '-',
        stock: asset.quantity,
        price: 'Rp ' + Number(asset.price).toLocaleString('id-ID'),
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=WMS_Report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInboundReport,
  getOutboundReport,
  getStockReport,
  getAnalytics,
  exportExcel,
};
const prisma = require('../utils/prisma');
const { successResponse, createError } = require('../utils/helpers');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const getAll = async (req, res, next) => {
  try {
    const data = await prisma.assetLabel.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        asset: true,
        workOrder: true,
        scans: true,
      },
    });

    return successResponse(res, data, 'Asset labels fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await prisma.assetLabel.findUnique({
      where: { id },
      include: {
        asset: true,
        workOrder: true,
        scans: true,
      },
    });

    if (!data) {
      throw createError('Asset label not found', 404);
    }

    return successResponse(res, data, 'Asset label fetched successfully');
  } catch (error) {
    next(error);
  }
};

const scanLabel = async (req, res, next) => {
  try {
    const { labelCode } = req.body;

    const label = await prisma.assetLabel.findFirst({
      where: { labelCode },
      include: { workOrder: true },
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    // Cek duplicate scan
    const existingScan = await prisma.labelScan.findFirst({
      where: {
        labelId: label.id,
        workOrderId: label.workOrderId,
      },
    });

    if (existingScan) {
      throw createError('Label already scanned', 400);
    }

    // Cek qty WO
    const scanCount = await prisma.labelScan.count({
      where: { workOrderId: label.workOrderId },
    });

    if (scanCount >= label.workOrder.quantity) {
      throw createError('WO quantity reached', 400);
    }

    // Buat scan record
    // FIX: field adalah scannedById, bukan scannedBy
    await prisma.labelScan.create({
      data: {
        labelId: label.id,
        workOrderId: label.workOrderId,
        scannedById: req.user.id,
      },
    });

    // Update inboundAt saat scan (akurat untuk FIFO)
    await prisma.assetLabel.update({
      where: { id: label.id },
      data: { inboundAt: new Date() },
    });

    // Increment stock asset
    await prisma.asset.update({
      where: { id: label.assetId },
      data: { quantity: { increment: 1 } },
    });

    // Hitung total scan terbaru
    const totalScan = await prisma.labelScan.count({
      where: { workOrderId: label.workOrderId },
    });

    // FIX: gunakan ON_PROGRESS sesuai enum di schema.prisma (bukan IN_PROGRESS)
    let status = 'TODO';
    if (totalScan > 0) {
      status = 'ON_PROGRESS';
    }
    if (totalScan >= label.workOrder.quantity) {
      status = 'DONE';
    }

    // Update status WO
    await prisma.workOrder.update({
      where: { id: label.workOrderId },
      data: { status },
    });

    return successResponse(
      res,
      { totalScan, quantity: label.workOrder.quantity, status },
      'Label scanned successfully'
    );
  } catch (error) {
    next(error);
  }
};

const outboundScan = async (req, res, next) => {
  try {
    const { labelCode, workOrderId } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      throw createError('Work Order not found', 404);
    }

    if (workOrder.type !== 'OUTBOUND') {
      throw createError('Work Order must be OUTBOUND', 400);
    }

    const label = await prisma.assetLabel.findFirst({
      where: { labelCode },
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    if (label.isOutbound) {
      throw createError('Label already outbound', 400);
    }

    // FIFO Check
    const fifoLabel = await prisma.assetLabel.findFirst({
      where: {
        assetId: label.assetId,
        isOutbound: false,
      },
      orderBy: {
        inboundAt: 'asc',
      },
    });

    if (fifoLabel && fifoLabel.id !== label.id) {
      throw createError(
        `FIFO violation. Scan ${fifoLabel.labelCode} first`,
        400
      );
    }

    // Cek qty WO outbound
    const scanCount = await prisma.labelScan.count({
      where: {
        workOrderId,
      },
    });

    if (scanCount >= workOrder.quantity) {
      throw createError('WO quantity reached', 400);
    }

    // Update label outbound
    const data = await prisma.assetLabel.update({
      where: {
        id: label.id,
      },
      data: {
        isOutbound: true,
        outboundAt: new Date(),
      },
    });

    // Simpan transaksi outbound
    await prisma.labelScan.create({
      data: {
        labelId: label.id,
        workOrderId,
        scannedById: req.user.id,
      },
    });

    // Kurangi stock
    await prisma.asset.update({
      where: {
        id: label.assetId,
      },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });

    // Update status WO
    const totalScan = await prisma.labelScan.count({
      where: {
        workOrderId,
      },
    });

    let status = 'TODO';

    if (totalScan > 0) {
      status = 'ON_PROGRESS';
    }

    if (totalScan >= workOrder.quantity) {
      status = 'DONE';
    }

    await prisma.workOrder.update({
      where: {
        id: workOrderId,
      },
      data: {
        status,
      },
    });

    return successResponse(
      res,
      {
        ...data,
        totalScan,
        quantity: workOrder.quantity,
        status,
      },
      'Outbound scan success'
    );
  } catch (error) {
    next(error);
  }
};

const printLabels = async (req, res, next) => {
  try {
    const { workOrderId } = req.params;

    const labels = await prisma.assetLabel.findMany({
      where: { workOrderId },
      include: {
        asset: {
          include: { supplier: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!labels.length) {
      throw createError('Labels not found', 404);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=labels.pdf');

    doc.pipe(res);

    const cm = (n) => n * 28.35;

    const pageWidth = cm(21);
    const pageHeight = cm(29.7);
    const marginLeft = cm(2);
    const marginRight = cm(2);
    const marginTop = cm(2.7);
    const marginBottom = cm(3);
    const gapX = cm(1);
    const gapY = cm(1);
    const cols = 2;
    const rows = 5;

    const labelWidth = (pageWidth - marginLeft - marginRight - gapX) / cols;
    const labelHeight =
      (pageHeight - marginTop - marginBottom - gapY * (rows - 1)) / rows;
    const labelsPerPage = cols * rows;

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const pageIndex = i % labelsPerPage;

      if (i > 0 && pageIndex === 0) {
        doc.addPage();
      }

      const row = Math.floor(pageIndex / cols);
      const col = pageIndex % cols;
      const x = marginLeft + col * (labelWidth + gapX);
      const y = marginTop + row * (labelHeight + gapY);

      doc.rect(x, y, labelWidth, labelHeight).lineWidth(0.8).stroke();

      doc.font('Helvetica').fontSize(6).text(label.asset.assetNumber, x + 8, y + 6);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(label.asset.assetName, x + 8, y + 18, {
          width: labelWidth - 90,
          height: 28,
        });

      doc
        .font('Helvetica')
        .fontSize(6)
        .text(
          `Rp.${Number(label.asset.price).toLocaleString('id-ID')}`,
          x + 8,
          y + 80
        );

      const qrSize = cm(2.5);
      const qrX = x + labelWidth - qrSize - 10;
      const qrY = y + 18;

      doc
        .font('Helvetica')
        .fontSize(4)
        .text(label.labelCode, qrX - 10, y + 5, {
          width: qrSize + 20,
          align: 'center',
        });

      const qr = await QRCode.toDataURL(label.labelCode);
      const buffer = Buffer.from(
        qr.replace(/^data:image\/png;base64,/, ''),
        'base64'
      );

      doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4).stroke();
      doc.image(buffer, qrX, qrY, { width: qrSize, height: qrSize });

      const footerY = y + labelHeight - 12;

      doc.font('Helvetica').fontSize(6).text('WMS Solution', x + 8, footerY);

      doc
        .font('Helvetica')
        .fontSize(6)
        .text(label.asset.supplier?.supName || '-', qrX - 15, footerY, {
          width: qrSize + 30,
          align: 'center',
        });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  scanLabel,
  outboundScan,
  printLabels,
};
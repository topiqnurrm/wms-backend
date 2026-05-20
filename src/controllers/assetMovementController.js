const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, assetId, warehouseId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const validTypes = ['INBOUND', 'OUTBOUND', 'TRANSFER'];
    const typeFilter = type && validTypes.includes(type) ? type : undefined;

    const where = {
      ...(assetId && { assetId }),
      ...(warehouseId && { warehouseId }),
      ...(typeFilter && { type: typeFilter }),
    };

    const [data, total] = await Promise.all([
      prisma.assetMovement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          warehouse: true,
          storageBin: true,
        },
      }),
      prisma.assetMovement.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Asset movements fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await prisma.assetMovement.findUnique({
      where: { id },
      include: { asset: true, warehouse: true, storageBin: true },
    });

    if (!data) throw createError('Movement not found', 404);
    return successResponse(res, data, 'Asset movement fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { type, quantity, notes, assetId, warehouseId, storageBinId } = req.body;

    // Validasi field wajib
    if (!type) throw createError('Movement type is required', 400);
    if (!quantity) throw createError('Quantity is required', 400);
    if (!assetId) throw createError('Asset is required', 400);
    if (!warehouseId) throw createError('Warehouse is required', 400);

    const validTypes = ['INBOUND', 'OUTBOUND', 'TRANSFER'];
    if (!validTypes.includes(type)) {
      throw createError('Type must be INBOUND, OUTBOUND, or TRANSFER', 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw createError('Quantity must be a positive number', 400);
    }

    // Validasi asset
    const asset = await prisma.asset.findFirst({ where: { id: assetId, isActive: true } });
    if (!asset) throw createError('Asset not found', 404);

    // Validasi warehouse
    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, isActive: true } });
    if (!warehouse) throw createError('Warehouse not found', 404);

    // Validasi storage bin jika dikirim
    if (storageBinId) {
      const storageBin = await prisma.storageBin.findFirst({ where: { id: storageBinId } });
      if (!storageBin) throw createError('Storage bin not found', 404);

      if (storageBin.category !== asset.category) {
        throw createError('Asset category does not match storage bin category', 400);
      }

      if (storageBin.warehouseId !== warehouseId) {
        throw createError('Storage bin does not belong to selected warehouse', 400);
      }
    }

    // Validasi OUTBOUND — stok harus cukup
    if (type === 'OUTBOUND') {
      if (asset.quantity < qty) {
        throw createError(`Insufficient stock. Current quantity: ${asset.quantity}`, 400);
      }
    }

    // TRANSFER wajib ada storageBinId tujuan
    if (type === 'TRANSFER' && !storageBinId) {
      throw createError('Storage bin is required for TRANSFER movement', 400);
    }

    // Buat movement record
    const movement = await prisma.assetMovement.create({
      data: {
        type,
        quantity: qty,
        notes,
        assetId,
        warehouseId,
        storageBinId: storageBinId || null,
      },
      include: { asset: true, warehouse: true, storageBin: true },
    });

    // Update asset berdasarkan type
    if (type === 'INBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          quantity: { increment: qty },
          ...(storageBinId && { storageBinId }),
        },
      });
    }

    if (type === 'OUTBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          quantity: { decrement: qty },
          // Kosongkan storage bin jika stok habis
          ...(asset.quantity - qty === 0 && { storageBinId: null }),
        },
      });
    }

    if (type === 'TRANSFER') {
      await prisma.asset.update({
        where: { id: assetId },
        data: { storageBinId },
      });
    }

    return successResponse(res, movement, 'Asset movement created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.assetMovement.findUnique({ where: { id } });
    if (!existing) throw createError('Movement not found', 404);

    await prisma.assetMovement.delete({ where: { id } });
    return successResponse(res, null, 'Movement deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, remove };
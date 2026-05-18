const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      prisma.assetMovement.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { asset: true, warehouse: true, storageBin: true },
      }),
      prisma.assetMovement.count(),
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

    const asset = await prisma.asset.findFirst({ where: { id: assetId, isActive: true } });
    if (!asset) throw createError('Asset not found', 404);

    const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, isActive: true } });
    if (!warehouse) throw createError('Warehouse not found', 404);

    if (storageBinId) {
      const storageBin = await prisma.storageBin.findFirst({ where: { id: storageBinId } });
      if (!storageBin) throw createError('Storage bin not found', 404);

      if (storageBin.category !== asset.category) {
        throw createError('Asset category does not match storage bin category', 400);
      }

      if (storageBin.warehouseId !== warehouseId) {
        throw createError('Storage bin not in selected warehouse', 400);
      }
    }

    if (type === 'OUTBOUND' && asset.quantity < quantity) {
      throw createError('Stock not enough', 400);
    }

    const movement = await prisma.assetMovement.create({
      data: { type, quantity, notes, assetId, warehouseId, storageBinId },
    });

    if (type === 'INBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: { quantity: { increment: quantity }, storageBinId },
      });
    }

    if (type === 'OUTBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: { quantity: { decrement: quantity } },
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
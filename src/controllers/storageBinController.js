const prisma = require('../utils/prisma');
const { generateBinAddress } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', warehouseId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(warehouseId && { warehouseId }),
      OR: [
        { binAddress: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.storageBin.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: true,
          asset: true,
        },
      }),
      prisma.storageBin.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Storage bins fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.storageBin.findFirst({
      where: { id },
      include: {
        warehouse: true,
        asset: true,
      },
    });

    if (!data) throw createError('Storage bin not found', 404);
    return successResponse(res, data, 'Storage bin fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { warehouseId, category, assetId, remarks } = req.body;

    if (!warehouseId) throw createError('Warehouse is required', 400);
    if (!category) throw createError('Category is required', 400);

    const validCategories = ['SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET'];
    if (!validCategories.includes(category)) {
      throw createError('Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET', 400);
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, isActive: true },
    });
    if (!warehouse) throw createError('Warehouse not found', 404);

    if (assetId) {
      const asset = await prisma.asset.findFirst({ where: { id: assetId, isActive: true } });
      if (!asset) throw createError('Asset not found', 404);
      if (asset.category !== category) {
        throw createError('Asset category must match storage bin category', 400);
      }
      if (asset.storageBinId) {
        throw createError('Asset already allocated to another storage bin', 400);
      }
    }

    const binAddress = await generateBinAddress(warehouse.whNumber);

    const data = await prisma.storageBin.create({
      data: {
        binAddress,
        category,
        remarks,
        warehouseId,
        ...(assetId && {
          asset: { connect: { id: assetId } },
        }),
      },
      include: { warehouse: true, asset: true },
    });

    return successResponse(res, data, 'Storage bin created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, assetId, remarks } = req.body;

    const existing = await prisma.storageBin.findFirst({
      where: { id },
      include: { asset: true },
    });
    if (!existing) throw createError('Storage bin not found', 404);

    if (category) {
      const validCategories = ['SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET'];
      if (!validCategories.includes(category)) {
        throw createError('Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET', 400);
      }
    }

    if (assetId) {
      const asset = await prisma.asset.findFirst({ where: { id: assetId, isActive: true } });
      if (!asset) throw createError('Asset not found', 404);
      const binCategory = category || existing.category;
      if (asset.category !== binCategory) {
        throw createError('Asset category must match storage bin category', 400);
      }
      if (asset.storageBinId && asset.storageBinId !== id) {
        throw createError('Asset already allocated to another storage bin', 400);
      }
    }

    const data = await prisma.storageBin.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(remarks !== undefined && { remarks }),
        ...(assetId !== undefined && {
          asset: assetId ? { connect: { id: assetId } } : { disconnect: true },
        }),
      },
      include: { warehouse: true, asset: true },
    });

    return successResponse(res, data, 'Storage bin updated successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.storageBin.findFirst({ where: { id } });
    if (!existing) throw createError('Storage bin not found', 404);

    if (existing.asset) {
      throw createError('Cannot delete storage bin that has an asset allocated', 400);
    }

    await prisma.storageBin.delete({ where: { id } });

    return successResponse(res, null, 'Storage bin deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
const prisma = require('../utils/prisma');
const { generateAssetNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(category && { category }),
      OR: [
        { assetName: { contains: search, mode: 'insensitive' } },
        { assetNumber: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
          storageBin: { include: { warehouse: true } },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Assets fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.asset.findFirst({
      where: { id, isActive: true },
      include: {
        supplier: true,
        storageBin: { include: { warehouse: true } },
      },
    });

    if (!data) throw createError('Asset not found', 404);
    return successResponse(res, data, 'Asset fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { assetName, category, price, remarks, supplierId } = req.body;
    // const { assetName, category, price,quantity, remarks, supplierId, storageBinId } = req.body;

    if (!assetName) throw createError('Asset name is required', 400);
    if (!category) throw createError('Category is required', 400);
    if (!price) throw createError('Price is required', 400);
    // if (quantity === undefined) throw createError('Quantity is required', 400);

    const validCategories = ['SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET'];
    if (!validCategories.includes(category)) {
      throw createError('Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET', 400);
    }

    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, isActive: true } });
      if (!supplier) throw createError('Supplier not found', 404);
    }

    const assetNumber = await generateAssetNumber();

    const data = await prisma.asset.create({
      data: {
        assetNumber,
        assetName,
        category,
        price,
        // quantity,
        remarks,
        supplierId: supplierId || null,
        // storageBinId: storageBinId || null,
      },
      include: { supplier: true },
      // include: { supplier: true,
      //   storageBin: { 
      //     include: { warehouse: true } }
      //  },
    });

    return successResponse(res, data, 'Asset created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assetName, category, price, remarks, supplierId, storageBinId } = req.body; // ← tambah storageBinId

    const existing = await prisma.asset.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Asset not found', 404);

    if (category) {
      const validCategories = ['SMALL_ASSET', 'MEDIUM_ASSET', 'LARGE_ASSET'];
      if (!validCategories.includes(category)) {
        throw createError('Category must be SMALL_ASSET, MEDIUM_ASSET, or LARGE_ASSET', 400);
      }
    }

    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, isActive: true } });
      if (!supplier) throw createError('Supplier not found', 404);
    }

    // Validasi storageBinId jika dikirim
    if (storageBinId) {
      const bin = await prisma.storageBin.findFirst({ where: { id: storageBinId } });
      if (!bin) throw createError('Storage bin not found', 404);

      // Cek category harus sama
      if (bin.category !== (category || existing.category)) {
        throw createError('Asset category must match storage bin category', 400);
      }

      // Cek storage bin belum dipakai asset lain
      const occupied = await prisma.asset.findFirst({
        where: { storageBinId, isActive: true, id: { not: id } },
      });
      if (occupied) throw createError('Storage bin already occupied by another asset', 409);
    }

    const data = await prisma.asset.update({
      where: { id },
      data: {
        ...(assetName && { assetName }),
        ...(category && { category }),
        ...(price && { price }),
        ...(remarks !== undefined && { remarks }),
        ...(supplierId !== undefined && { supplierId }),
        ...(storageBinId !== undefined && { storageBinId }), // ← tambah ini
      },
      include: {
        supplier: true,
        storageBin: { include: { warehouse: true } },
      },
    });

    return successResponse(res, data, 'Asset updated successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.asset.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Asset not found', 404);

    await prisma.asset.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(res, null, 'Asset deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
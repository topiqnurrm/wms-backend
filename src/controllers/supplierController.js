const prisma = require('../utils/prisma');
const { generateSupplierNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      OR: [
        { supName: { contains: search, mode: 'insensitive' } },
        { supNumber: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { assets: true } } },
      }),
      prisma.supplier.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Suppliers fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.supplier.findFirst({
      where: { id, isActive: true },
      include: { assets: true },
    });

    if (!data) throw createError('Supplier not found', 404);
    return successResponse(res, data, 'Supplier fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { supName, supCategory, address } = req.body;

    if (!supName) throw createError('Supplier name is required', 400);

    // FIX: supCategory optional, default ke LOCAL jika tidak diisi
    if (supCategory) {
      const validCategories = ['LOCAL', 'IMPORT'];
      if (!validCategories.includes(supCategory)) {
        throw createError('Category must be LOCAL or IMPORT', 400);
      }
    }

    const supNumber = await generateSupplierNumber();

    const data = await prisma.supplier.create({
      data: {
        supNumber,
        supName,
        supCategory: supCategory || 'LOCAL',
        address,
      },
    });

    return successResponse(res, data, 'Supplier created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supName, supCategory, address } = req.body;

    const existing = await prisma.supplier.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Supplier not found', 404);

    if (supCategory) {
      const validCategories = ['LOCAL', 'IMPORT'];
      if (!validCategories.includes(supCategory)) {
        throw createError('Category must be LOCAL or IMPORT', 400);
      }
    }

    const data = await prisma.supplier.update({
      where: { id },
      data: {
        ...(supName && { supName }),
        ...(supCategory && { supCategory }),
        ...(address !== undefined && { address }),
      },
    });

    return successResponse(res, data, 'Supplier updated successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.supplier.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Supplier not found', 404);

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(res, null, 'Supplier deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
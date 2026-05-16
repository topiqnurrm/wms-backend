const prisma = require('../utils/prisma');
const { generateWarehouseNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      OR: [
        { whName: { contains: search, mode: 'insensitive' } },
        { whNumber: { contains: search, mode: 'insensitive' } },
        { whLocation: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { storageBins: true } } },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Warehouses fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await prisma.warehouse.findFirst({
      where: { id, isActive: true },
      include: {
        storageBins: {
          include: { asset: true },
        },
      },
    });

    if (!data) throw createError('Warehouse not found', 404);
    return successResponse(res, data, 'Warehouse fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { whName, whLocation, remarks } = req.body;

    if (!whName) throw createError('Warehouse name is required', 400);

    const whNumber = await generateWarehouseNumber();

    const data = await prisma.warehouse.create({
      data: { whNumber, whName, whLocation, remarks },
    });

    return successResponse(res, data, 'Warehouse created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { whName, whLocation, remarks } = req.body;

    const existing = await prisma.warehouse.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Warehouse not found', 404);

    const data = await prisma.warehouse.update({
      where: { id },
      data: { whName, whLocation, remarks },
    });

    return successResponse(res, data, 'Warehouse updated successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.warehouse.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('Warehouse not found', 404);

    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(res, null, 'Warehouse deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
const prisma = require('../utils/prisma');
const {
  generateWONumber,
  generateLabelCode,
} = require('../utils/autoNumber');

const {
  successResponse,
  paginatedResponse,
  createError,
} = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      prisma.workOrder.findMany({
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          warehouse: true,
          storageBin: true,
          asset: true,
          createdBy: true,
        },
      }),
      prisma.workOrder.count(),
    ]);

    return paginatedResponse(
      res,
      data,
      total,
      page,
      limit,
      'Work Orders fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        warehouse: true,
        storageBin: true,
        asset: true,
        createdBy: true,
        labels: true,
      },
    });

    if (!data) {
      throw createError('Work Order not found', 404);
    }

    return successResponse(
      res,
      data,
      'Work Order fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      type,
      warehouseId,
      storageBinId,
      assetId,
      quantity,
      remarks,
    } = req.body;

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        isActive: true,
      },
    });

    if (!warehouse) {
      throw createError('Warehouse not found', 404);
    }

    const storageBin = await prisma.storageBin.findUnique({
      where: {
        id: storageBinId,
      },
    });

    if (!storageBin) {
      throw createError('Storage bin not found', 404);
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        isActive: true,
      },
    });

    if (!asset) {
      throw createError('Asset not found', 404);
    }

    if (asset.category !== storageBin.category) {
      throw createError(
        'Asset category must match storage bin category',
        400
      );
    }

    const woNumber = await generateWONumber(type);

    const data = await prisma.workOrder.create({
      data: {
        woNumber,
        type,
        warehouseId,
        storageBinId,
        assetId,
        quantity,
        remarks,
        createdById: req.user.id,
      },
      include: {
        warehouse: true,
        storageBin: true,
        asset: true,
        createdBy: true,
      },
    });

    return successResponse(
      res,
      data,
      'Work Order created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw createError('Work Order not found', 404);
    }

    const data = await prisma.workOrder.update({
      where: { id },
      data: { status },
    });

    return successResponse(
      res,
      data,
      'Work Order status updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

const generateLabels = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        asset: true,
      },
    });

    if (!workOrder) {
      throw createError('Work Order not found', 404);
    }

    const existingLabels = await prisma.assetLabel.count({
      where: {
        workOrderId: id,
      },
    });

    if (existingLabels > 0) {
      throw createError(
        'Labels already generated for this Work Order',
        400
      );
    }

    const labels = [];

    for (let i = 0; i < workOrder.quantity; i++) {
      const labelCode = await generateLabelCode(
        workOrder.asset.assetNumber
      );

      const label = await prisma.assetLabel.create({
        data: {
          labelCode,
          assetId: workOrder.assetId,
          workOrderId: workOrder.id,
          inboundAt:
            workOrder.type === 'INBOUND'
              ? new Date()
              : null,
        },
      });

      labels.push(label);
    }

    return successResponse(
      res,
      labels,
      'Labels generated successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getFifoLabels = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const workOrder =
      await prisma.workOrder.findUnique({
        where: { id },
      });

    if (!workOrder) {
      throw createError(
        'Work Order not found',
        404
      );
    }

    const labels =
      await prisma.assetLabel.findMany({
        where: {
          assetId: workOrder.assetId,
          isOutbound: false,
        },
        orderBy: {
          inboundAt: 'asc',
        },
        take: workOrder.quantity,
      });

    return successResponse(
      res,
      labels,
      'FIFO labels fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
  generateLabels,
  getFifoLabels,
};
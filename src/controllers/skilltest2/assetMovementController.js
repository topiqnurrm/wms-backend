const prisma = require('../../utils/prisma');

// get all movements
const getAll = async (req, res) => {
  try {
    const movements = await prisma.assetMovement.findMany({
      include: {
        asset: true,
        warehouse: true,
        storageBin: true
      }
    });

    res.json({
      success: true,
      data: movements
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// get movement by id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await prisma.assetMovement.findUnique({
      where: { id },
      include: {
        asset: true,
        warehouse: true,
        storageBin: true
      }
    });

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Movement not found'
      });
    }

    res.json({
      success: true,
      data: movement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// create movement
const create = async (req, res) => {
  try {
    const {
      type,
      quantity,
      notes,
      assetId,
      warehouseId,
      storageBinId
    } = req.body;

    // check asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // check warehouse
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // check storage bin
    let storageBin = null;

    if (storageBinId) {
      storageBin = await prisma.storageBin.findFirst({
        where: {
          id: String(storageBinId).trim()
        }
      });

      console.log('BIN RESULT:', storageBin);

      if (!storageBin) {
        return res.status(404).json({
          success: false,
          message: 'Storage bin not found'
        });
      }

      // validate category
      if (storageBin.category !== asset.category) {
        return res.status(400).json({
          success: false,
          message: 'Asset category does not match storage bin category'
        });
      }

      // validate warehouse
      if (storageBin.warehouseId !== warehouseId) {
        return res.status(400).json({
          success: false,
          message: 'Storage bin not in selected warehouse'
        });
      }
    }

    // validate stock
    if (type === 'OUTBOUND' && asset.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock not enough'
      });
    }

    // create movement
    const movement = await prisma.assetMovement.create({
      data: {
        type,
        quantity,
        notes,
        assetId,
        warehouseId,
        storageBinId
      }
    });

    // inbound stock
    if (type === 'INBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          quantity: {
            increment: quantity
          },
          storageBinId
        }
      });
    }

    // outbound stock
    if (type === 'OUTBOUND') {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          quantity: {
            decrement: quantity
          }
        }
      });
    }

    // transfer bin
    if (type === 'TRANSFER') {
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          storageBinId
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Asset movement created successfully',
      data: movement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// update movement
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await prisma.assetMovement.findUnique({
      where: { id }
    });

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Movement not found'
      });
    }

    const updatedMovement = await prisma.assetMovement.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      message: 'Movement updated successfully',
      data: updatedMovement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// delete movement
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await prisma.assetMovement.findUnique({
      where: { id }
    });

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Movement not found'
      });
    }

    await prisma.assetMovement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Movement deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
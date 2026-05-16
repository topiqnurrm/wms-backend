const prisma = require('./prisma');

const generateWarehouseNumber = async () => {
  const last = await prisma.warehouse.findFirst({
    orderBy: { whNumber: 'desc' },
  });
  if (!last) return 'WH_01';
  const num = parseInt(last.whNumber.split('_')[1]) + 1;
  return `WH_${String(num).padStart(2, '0')}`;
};

const generateBinAddress = async (warehouseNumber) => {
  const count = await prisma.storageBin.count({
    where: { warehouse: { whNumber: warehouseNumber } },
  });
  const num = count + 1;
  return `${warehouseNumber}_${String(num).padStart(3, '0')}`;
};

const generateAssetNumber = async () => {
  const last = await prisma.asset.findFirst({
    orderBy: { assetNumber: 'desc' },
  });
  if (!last) return 'AST_01';
  const num = parseInt(last.assetNumber.split('_')[1]) + 1;
  return `AST_${String(num).padStart(2, '0')}`;
};

const generateSupplierNumber = async () => {
  const last = await prisma.supplier.findFirst({
    orderBy: { supNumber: 'desc' },
  });
  if (!last) return 'SUP_01';
  const num = parseInt(last.supNumber.split('_')[1]) + 1;
  return `SUP_${String(num).padStart(2, '0')}`;
};

const generateUserNumber = async () => {
  const last = await prisma.user.findFirst({
    orderBy: { userNumber: 'desc' },
  });
  if (!last) return 'USER_01';
  const num = parseInt(last.userNumber.split('_')[1]) + 1;
  return `USER_${String(num).padStart(2, '0')}`;
};

module.exports = {
  generateWarehouseNumber,
  generateBinAddress,
  generateAssetNumber,
  generateSupplierNumber,
  generateUserNumber,
};
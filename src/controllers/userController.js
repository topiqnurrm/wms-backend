const prisma = require('../utils/prisma');
const { generateUserNumber } = require('../utils/autoNumber');
const { hashPassword, comparePassword, successResponse, paginatedResponse, createError } = require('../utils/helpers');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(role && { role }),
      OR: [
        { userName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { userNumber: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userNumber: true,
          userName: true,
          email: true,
          telp: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(res, data, total, page, limit, 'Users fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        userNumber: true,
        userName: true,
        email: true,
        telp: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw createError('User not found', 404);
    return successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { userName, email, telp, password, role } = req.body;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) throw createError('Email already registered', 409);

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      throw createError('Password must contain at least 1 uppercase, 1 number, and 1 special character', 400);
    }

    const userNumber = await generateUserNumber();
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        userNumber,
        userName,
        email,
        telp,
        password: hashedPassword,
        role: role || 'STAFF',
      },
      select: {
        id: true,
        userNumber: true,
        userName: true,
        email: true,
        telp: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userName, telp, role } = req.body;

    const existing = await prisma.user.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('User not found', 404);

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(userName && { userName }),
        ...(telp !== undefined && { telp }),
        ...(role && { role }),
      },
      select: {
        id: true,
        userNumber: true,
        userName: true,
        email: true,
        telp: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const existing = await prisma.user.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('User not found', 404);

    const isMatch = await comparePassword(oldPassword, existing.password);
    if (!isMatch) throw createError('Old password is incorrect', 400);

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(newPassword)) {
      throw createError('Password must contain at least 1 uppercase, 1 number, and 1 special character', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError('User not found', 404);

    if (existing.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1) throw createError('Cannot delete the last admin user', 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, changePassword, remove };
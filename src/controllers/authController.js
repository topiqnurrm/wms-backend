const prisma = require('../utils/prisma');
const { generateUserNumber } = require('../utils/autoNumber');
const { hashPassword, comparePassword, generateToken, successResponse, createError } = require('../utils/helpers');

const register = async (req, res, next) => {
  try {
    const { userName, email, telp, password, role } = req.body;

    if (!userName) throw createError('User name is required', 400);
    if (!email) throw createError('Email is required', 400);
    if (!password) throw createError('Password is required', 400);

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      throw createError('Password must contain at least 1 uppercase, 1 number, and 1 special character', 400);
    }

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) throw createError('Email already registered', 409);

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
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, { user: userWithoutPassword, token }, 'Register successful', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) throw createError('Email is required', 400);
    if (!password) throw createError('Password is required', 400);

    const user = await prisma.user.findFirst({ where: { email, isActive: true } });
    if (!user) throw createError('Invalid email or password', 401);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw createError('Invalid email or password', 401);

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id, isActive: true },
    });
    if (!user) throw createError('User not found', 404);

    const { password: _, ...userWithoutPassword } = user;
    return successResponse(res, userWithoutPassword, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me };

// const getAll = async (req, res, next) => {
//   try {
//     const users = await prisma.user.findMany({
//       where: {
//         isActive: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     return successResponse(res, users, 'Users fetched successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// const getById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const user = await prisma.user.findFirst({
//       where: {
//         id,
//         isActive: true,
//       },
//     });

//     if (!user) throw createError('User not found', 404);

//     const { password: _, ...userWithoutPassword } = user;

//     return successResponse(res, userWithoutPassword, 'User fetched successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// const update = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { userName, email, telp, role } = req.body;

//     const existing = await prisma.user.findFirst({
//       where: {
//         id,
//         isActive: true,
//       },
//     });

//     if (!existing) throw createError('User not found', 404);

//     const user = await prisma.user.update({
//       where: { id },
//       data: {
//         ...(userName && { userName }),
//         ...(email && { email }),
//         ...(telp !== undefined && { telp }),
//         ...(role && { role }),
//       },
//     });

//     const { password: _, ...userWithoutPassword } = user;

//     return successResponse(res, userWithoutPassword, 'User updated successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// const remove = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const existing = await prisma.user.findFirst({
//       where: {
//         id,
//         isActive: true,
//       },
//     });

//     if (!existing) throw createError('User not found', 404);

//     await prisma.user.update({
//       where: { id },
//       data: {
//         isActive: false,
//       },
//     });

//     return successResponse(res, null, 'User deleted successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   register,
//   login,
//   me,
//   getAll,
//   getById,
//   update,
//   remove,
// };
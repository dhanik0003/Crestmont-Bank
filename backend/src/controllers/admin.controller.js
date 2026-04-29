// src/controllers/admin.controller.js
const prisma = require('../lib/prisma');
const { invalidateUserCache } = require('../middleware/auth.middleware');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: { select: { name: true } },
        _count: { select: { accounts: true, loans: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const { roleName } = req.body;

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(400).json({ error: 'Invalid role' });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    });

    // Bust the auth cache so the new role is reflected immediately
    invalidateUserCache(userId);

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, updateUserRole };

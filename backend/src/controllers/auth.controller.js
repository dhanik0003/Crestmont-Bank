// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { createAuditLog } = require('../services/audit.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    if (!customerRole) {
      return res.status(500).json({ error: 'Roles not seeded. Run: npm run prisma:seed' });
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash, roleId: customerRole.id },
      include: { role: true },
    });

    await createAuditLog(user.id, `User registered: ${email}`);

    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await createAuditLog(user.id, `User logged in: ${email}`);

    const token = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role.name,
  });
};

const updateMe = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const updates = {};

    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (normalizedName && normalizedName !== req.user.name) {
      updates.name = normalizedName;
    }

    if (normalizedEmail && normalizedEmail !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      updates.email = normalizedEmail;
    }

    if (newPassword) {
      const passwordMatches = await bcrypt.compare(currentPassword, req.user.passwordHash);

      if (!passwordMatches) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      updates.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role.name,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      include: { role: true },
    });

    await createAuditLog(updatedUser.id, 'User updated profile');

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.name,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateMe };

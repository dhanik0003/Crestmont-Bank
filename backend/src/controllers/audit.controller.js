// src/controllers/audit.controller.js
const prisma = require('../lib/prisma');

const getAuditLogs = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: parseInt(userId) } : {};

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };

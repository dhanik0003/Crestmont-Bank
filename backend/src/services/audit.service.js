// src/services/audit.service.js
const prisma = require('../lib/prisma');

const createAuditLog = async (userId, action) => {
  try {
    await prisma.auditLog.create({ data: { userId, action } });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { createAuditLog };

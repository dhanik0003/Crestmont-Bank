// src/controllers/alert.controller.js
const prisma = require('../lib/prisma');

const getAlerts = async (req, res, next) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        transaction: {
          include: {
            senderAccount: { include: { user: { select: { name: true, email: true } } } },
            receiverAccount: { include: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlerts };

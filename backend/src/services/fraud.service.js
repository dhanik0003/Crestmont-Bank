// src/services/fraud.service.js
const prisma = require('../lib/prisma');
const { formatMoney, parseEnvDecimal, toDecimal } = require('../lib/decimal');

const AMOUNT_THRESHOLD = parseEnvDecimal(process.env.FRAUD_AMOUNT_THRESHOLD, '50000.00');
const RAPID_TX_LIMIT = parseInt(process.env.FRAUD_RAPID_TRANSACTION_LIMIT, 10) || 5;
const RAPID_TX_WINDOW_MINUTES = parseInt(process.env.FRAUD_RAPID_TRANSACTION_WINDOW_MINUTES, 10) || 10;

const checkFraud = async (transactionId, senderAccountId, amount) => {
  const alerts = [];
  const normalizedAmount = toDecimal(amount);

  if (normalizedAmount.gt(AMOUNT_THRESHOLD)) {
    alerts.push(
      `High-value transaction: Rs ${formatMoney(normalizedAmount)} exceeds threshold of Rs ${formatMoney(AMOUNT_THRESHOLD)}`
    );
  }

  const windowStart = new Date(Date.now() - RAPID_TX_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.transaction.count({
    where: {
      senderAccountId,
      status: 'SUCCESS',
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= RAPID_TX_LIMIT) {
    alerts.push(
      `Rapid transactions: ${recentCount} transactions from account #${senderAccountId} in ${RAPID_TX_WINDOW_MINUTES} minutes`
    );
  }

  for (const reason of alerts) {
    await prisma.alert.create({
      data: { transactionId, reason },
    });
  }

  return alerts;
};

module.exports = { checkFraud };

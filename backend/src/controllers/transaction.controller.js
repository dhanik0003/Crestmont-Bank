// src/controllers/transaction.controller.js
const prisma = require('../lib/prisma');
const { formatMoney, parseMoneyInput, toDecimal } = require('../lib/decimal');
const {
  normalizeOptionalNote,
  normalizeOptionalTransactionCategory,
} = require('../lib/transactionCategories');
const { createAuditLog } = require('../services/audit.service');
const { getUserSpendingAnalytics } = require('../services/analytics.service');
const { checkFraud } = require('../services/fraud.service');

const makeHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateAccountId = (value, label) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw makeHttpError(400, `${label} must be a positive integer`);
  }

  return parsed;
};

const ensureActiveFixedDepositIsNotMoved = (account, directionLabel) => {
  if (account.type === 'FD' && account.fdStatus === 'ACTIVE') {
    throw makeHttpError(
      400,
      `Cannot ${directionLabel} funds ${directionLabel === 'debit' ? 'from' : 'into'} an active fixed deposit before maturity`
    );
  }
};

const transfer = async (req, res, next) => {
  try {
    const { senderAccountId, receiverAccountId, amount, note, category } = req.body;
    const userId = req.user.id;
    const senderId = validateAccountId(senderAccountId, 'Sender account ID');
    const receiverId = validateAccountId(receiverAccountId, 'Receiver account ID');
    const parsedAmount = parseMoneyInput(amount, { allowZero: false });
    const normalizedNote = normalizeOptionalNote(note);
    const normalizedCategory = normalizeOptionalTransactionCategory(category);

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    const senderAccount = await prisma.account.findUnique({
      where: { id: senderId },
    });

    if (!senderAccount) {
      return res.status(404).json({ error: 'Sender account not found' });
    }

    if (req.user.role.name === 'CUSTOMER' && senderAccount.userId !== userId) {
      return res.status(403).json({ error: 'You do not own this account' });
    }

    ensureActiveFixedDepositIsNotMoved(senderAccount, 'debit');

    const receiverAccount = await prisma.account.findUnique({
      where: { id: receiverId },
    });

    if (!receiverAccount) {
      return res.status(404).json({ error: 'Receiver account not found' });
    }

    ensureActiveFixedDepositIsNotMoved(receiverAccount, 'credit');

    if (toDecimal(senderAccount.balance).lt(parsedAmount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedSender = await tx.$queryRaw`
        SELECT * FROM accounts WHERE id = ${senderAccount.id} FOR UPDATE
      `;

      if (lockedSender.length === 0) {
        throw makeHttpError(404, 'Sender account not found');
      }

      if (toDecimal(lockedSender[0].balance).lt(parsedAmount)) {
        throw makeHttpError(400, 'Insufficient balance');
      }

      await tx.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: parsedAmount } },
      });

      await tx.account.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: parsedAmount } },
      });

      return tx.transaction.create({
        data: {
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          amount: parsedAmount,
          status: 'SUCCESS',
          note: normalizedNote,
          category: normalizedCategory,
        },
      });
    });

    checkFraud(result.id, senderAccount.id, parsedAmount).catch(console.error);

    await createAuditLog(
      userId,
      `Transfer Rs ${formatMoney(parsedAmount)} from account #${senderId} to #${receiverId} [txn #${result.id}]`
    );

    res.status(201).json({
      message: 'Transfer successful',
      transaction: result,
    });
  } catch (err) {
    try {
      const failedSenderId = Number.parseInt(req.body.senderAccountId, 10);
      const failedReceiverId = Number.parseInt(req.body.receiverAccountId, 10);
      const failedAmount = parseMoneyInput(req.body.amount, {
        allowZero: true,
        defaultValue: '0.00',
      });
      const failedCategory = (() => {
        try {
          return normalizeOptionalTransactionCategory(req.body.category);
        } catch (_) {
          return null;
        }
      })();
      const failedNote = (() => {
        try {
          return normalizeOptionalNote(req.body.note);
        } catch (_) {
          return null;
        }
      })();

      if (
        Number.isInteger(failedSenderId) &&
        failedSenderId > 0 &&
        Number.isInteger(failedReceiverId) &&
        failedReceiverId > 0 &&
        failedSenderId !== failedReceiverId
      ) {
        await prisma.transaction.create({
          data: {
            senderAccountId: failedSenderId,
            receiverAccountId: failedReceiverId,
            amount: failedAmount,
            status: 'FAILED',
            note: failedNote,
            category: failedCategory,
          },
        });
      }
    } catch (_) {}

    next(err);
  }
};

const getTransactionsByAccount = async (req, res, next) => {
  try {
    const accountId = validateAccountId(req.params.accountId, 'Account ID');
    const userId = req.user.id;

    if (req.user.role.name === 'CUSTOMER') {
      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account || account.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
      },
      include: {
        senderAccount: { include: { user: { select: { name: true } } } },
        receiverAccount: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        senderAccount: { include: { user: { select: { name: true, email: true } } } },
        receiverAccount: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

const getMyAnalytics = async (req, res, next) => {
  try {
    const rawMonths = Number.parseInt(req.query.months, 10);
    const months = Number.isInteger(rawMonths) ? Math.min(Math.max(rawMonths, 3), 12) : 6;
    const analytics = await getUserSpendingAnalytics(prisma, req.user.id, months);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

module.exports = { transfer, getTransactionsByAccount, getAllTransactions, getMyAnalytics };

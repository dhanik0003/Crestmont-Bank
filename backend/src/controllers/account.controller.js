const prisma = require('../lib/prisma');
const { formatMoney, parseDecimalInput, parseMoneyInput, toDecimal } = require('../lib/decimal');
const { buildAccountStatementPdf } = require('../services/statement.service');
const { createAuditLog } = require('../services/audit.service');

const validatePositiveInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${label} must be a positive integer`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

const parseDateOrThrow = (value, label) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${label} must be a valid date`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

const createAccount = async (req, res, next) => {
  try {
    const { type, initialDeposit = 0, interestRate, maturityDate } = req.body;
    const userId = req.user.id;
    const parsedInitialDeposit = parseMoneyInput(initialDeposit, {
      fieldName: 'Initial deposit',
      defaultValue: '0.00',
    });

    if (!['SAVINGS', 'CURRENT', 'FD'].includes(type)) {
      return res.status(400).json({ error: 'Invalid account type. Must be SAVINGS, CURRENT, or FD' });
    }

    let accountData = {
      userId,
      type,
      balance: parsedInitialDeposit,
    };

    if (type === 'FD') {
      const parsedRate = parseDecimalInput(interestRate, {
        fieldName: 'FD interest rate',
        maxScale: 2,
        allowZero: false,
      });
      const parsedMaturityDate = parseDateOrThrow(maturityDate, 'Maturity date');

      if (parsedInitialDeposit.lte(0)) {
        return res.status(400).json({ error: 'FD accounts require a positive opening deposit' });
      }

      if (parsedRate.gt(100)) {
        return res.status(400).json({ error: 'FD interest rate must be 100% or less' });
      }

      if (parsedMaturityDate <= new Date()) {
        return res.status(400).json({ error: 'Maturity date must be in the future' });
      }

      accountData = {
        ...accountData,
        interestRate: parsedRate,
        maturityDate: parsedMaturityDate,
        fdPrincipalAmount: parsedInitialDeposit,
        fdStatus: 'ACTIVE',
      };
    }

    const account = await prisma.account.create({
      data: accountData,
    });

    await createAuditLog(userId, `Created ${type} account #${account.id}`);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
};

const getUserAccounts = async (req, res, next) => {
  try {
    const targetUserId = validatePositiveInteger(req.params.userId, 'User ID');
    const requestor = req.user;

    if (requestor.role.name === 'CUSTOMER' && requestor.id !== targetUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(accounts);
  } catch (err) {
    next(err);
  }
};

const getMyAccounts = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(accounts);
  } catch (err) {
    next(err);
  }
};

const getAllAccounts = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(accounts);
  } catch (err) {
    next(err);
  }
};

const lookupAccountById = async (req, res, next) => {
  try {
    const accountId = validatePositiveInteger(req.params.accountId, 'Account ID');

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Receiver account not found' });
    }

    res.json({
      id: account.id,
      type: account.type,
      holderName: account.user.name,
      userId: account.userId,
      fdStatus: account.fdStatus,
    });
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const accountId = validatePositiveInteger(req.params.id, 'Account ID');
    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (req.user.role.name === 'CUSTOMER' && account.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this account' });
    }

    if (account.type === 'FD' && account.fdStatus === 'ACTIVE') {
      return res.status(400).json({ error: 'Active fixed deposits cannot be deleted before maturity' });
    }

    if (toDecimal(account.balance).gt(0)) {
      return res.status(400).json({
        error: 'Cannot delete account with remaining balance. Transfer or withdraw funds first.',
      });
    }

    const pendingTransactions = await prisma.transaction.count({
      where: {
        OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
        status: 'PENDING',
      },
    });

    if (pendingTransactions > 0) {
      return res.status(400).json({ error: 'Account has pending transactions' });
    }

    await prisma.account.delete({ where: { id: accountId } });
    await createAuditLog(req.user.id, `Deleted account #${accountId} (type: ${account.type})`);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const downloadStatement = async (req, res, next) => {
  try {
    const accountId = validatePositiveInteger(req.params.id, 'Account ID');
    const startDate = req.query.start ? parseDateOrThrow(req.query.start, 'Start date') : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const endDate = req.query.end ? parseDateOrThrow(req.query.end, 'End date') : new Date();
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    if (rangeStart > rangeEnd) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const isOwner = account.userId === req.user.id;
    const isStaff = ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(req.user.role.name);

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recentAndFutureTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: { gte: rangeStart },
        OR: [{ senderAccountId: accountId }, { receiverAccountId: accountId }],
      },
      include: {
        senderAccount: { include: { user: { select: { name: true } } } },
        receiverAccount: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let balanceCursor = toDecimal(account.balance);
    const statementRowsDescending = [];

    for (const transaction of recentAndFutureTransactions) {
      const isOutgoing = transaction.senderAccountId === accountId;
      const amount = toDecimal(transaction.amount);
      const afterBalance = balanceCursor;
      const beforeBalance = isOutgoing ? balanceCursor.plus(amount) : balanceCursor.sub(amount);

      if (transaction.createdAt <= rangeEnd) {
        statementRowsDescending.push({
          transaction,
          afterBalance,
          beforeBalance,
        });
      }

      balanceCursor = beforeBalance;
    }

    const openingBalance = balanceCursor;
    const closingBalance =
      statementRowsDescending.length > 0
        ? statementRowsDescending[0].afterBalance
        : balanceCursor;

    const rows = statementRowsDescending
      .reverse()
      .map(({ transaction, afterBalance }) => {
        const isOutgoing = transaction.senderAccountId === accountId;
        const counterparty = isOutgoing
          ? transaction.receiverAccount?.user?.name || `Account #${transaction.receiverAccountId}`
          : transaction.senderAccount?.user?.name || `Account #${transaction.senderAccountId}`;

        return {
          date: new Date(transaction.createdAt).toLocaleDateString('en-GB'),
          direction: isOutgoing ? 'DEBIT' : 'CREDIT',
          counterparty,
          category: transaction.category || 'UNCATEGORIZED',
          amount: formatMoney(transaction.amount),
          balance: formatMoney(afterBalance),
          note: transaction.note || '-',
        };
      });

    const pdf = buildAccountStatementPdf({
      user: account.user,
      account,
      rows,
      rangeStart,
      rangeEnd,
      openingBalance,
      closingBalance,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="crestmont-statement-account-${account.id}-${rangeStart.toISOString().slice(0, 10)}-to-${rangeEnd
        .toISOString()
        .slice(0, 10)}.pdf"`
    );
    res.send(pdf);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAccount,
  getUserAccounts,
  getMyAccounts,
  getAllAccounts,
  lookupAccountById,
  deleteAccount,
  downloadStatement,
};

const prisma = require('../lib/prisma');
const { formatMoney, parseDecimalInput, parseMoneyInput, toDecimal } = require('../lib/decimal');
const { createAuditLog } = require('../services/audit.service');
const {
  calculateEMI,
  ensureLoanRepaymentSchedule,
  getLoanSummary,
  refreshOverdueRepayments,
} = require('../services/loan.service');
const { getOrCreateTreasuryAccount } = require('../services/treasury.service');

const makeHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const pickDisbursementAccount = (accounts) =>
  accounts.find((account) => account.type === 'SAVINGS') ||
  accounts.find((account) => account.type === 'CURRENT') ||
  accounts[0] ||
  null;

const validatePositiveInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw makeHttpError(400, `${label} must be a positive integer`);
  }

  return parsed;
};

const serializeLoan = (loan, repayments = []) => {
  const summary = getLoanSummary(loan, repayments);

  return {
    ...loan,
    emi: loan.emiAmount
      ? Number(toDecimal(loan.emiAmount).toFixed(2))
      : calculateEMI(
          toDecimal(loan.amount).toNumber(),
          toDecimal(loan.interestRate).toNumber(),
          loan.tenureMonths
        ),
    outstandingBalance: summary.outstandingBalance
      ? Number(summary.outstandingBalance)
      : loan.status === 'CLOSED'
        ? 0
        : Number(toDecimal(loan.amount).toFixed(2)),
    nextDueDate: summary.nextDueDate,
    overdueCount: summary.overdueCount,
    totalInstallments: summary.totalInstallments,
    paidInstallments: summary.paidInstallments,
  };
};

const ensureSchedulesForLoans = async (loans) => {
  for (const loan of loans) {
    if (!['APPROVED', 'CLOSED'].includes(loan.status)) {
      continue;
    }

    const repaymentCount = loan._count?.repayments ?? 0;
    if (repaymentCount > 0) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await ensureLoanRepaymentSchedule(tx, loan);
    });
  }
};

const applyLoan = async (req, res, next) => {
  try {
    const { amount, interestRate, tenureMonths } = req.body;
    const userId = req.user.id;

    const parsedAmount = parseMoneyInput(amount, {
      fieldName: 'Loan amount',
      allowZero: false,
    });
    const parsedRate = parseDecimalInput(interestRate, {
      fieldName: 'Interest rate',
      maxScale: 2,
      allowZero: false,
    });
    const parsedTenure = validatePositiveInteger(tenureMonths, 'Tenure');

    if (parsedRate.gt(100)) {
      return res.status(400).json({ error: 'Invalid interest rate' });
    }

    if (parsedTenure > 360) {
      return res.status(400).json({ error: 'Tenure must be 1-360 months' });
    }

    const emi = calculateEMI(parsedAmount.toNumber(), parsedRate.toNumber(), parsedTenure);

    const loan = await prisma.loan.create({
      data: {
        userId,
        amount: parsedAmount,
        interestRate: parsedRate,
        tenureMonths: parsedTenure,
        status: 'PENDING',
      },
    });

    await createAuditLog(userId, `Loan application #${loan.id} submitted for Rs ${formatMoney(parsedAmount)}`);
    res.status(201).json({ ...loan, emi });
  } catch (err) {
    next(err);
  }
};

const approveLoan = async (req, res, next) => {
  try {
    const loanId = validatePositiveInteger(req.params.id, 'Loan ID');

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.loan.updateMany({
        where: { id: loanId, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });

      if (claim.count === 0) {
        const existingLoan = await tx.loan.findUnique({ where: { id: loanId } });

        if (!existingLoan) {
          throw makeHttpError(404, 'Loan not found');
        }

        throw makeHttpError(400, `Loan already ${existingLoan.status.toLowerCase()}`);
      }

      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      const loanAmount = toDecimal(loan.amount);
      const borrowerAccounts = await tx.account.findMany({
        where: { userId: loan.userId },
        orderBy: { createdAt: 'asc' },
      });

      const disbursementAccount = pickDisbursementAccount(borrowerAccounts);
      if (!disbursementAccount) {
        throw makeHttpError(400, 'Borrower has no account available to receive the loan amount');
      }

      const treasuryAccount = await getOrCreateTreasuryAccount(tx, loanAmount);
      const approvedAt = new Date();
      const emiAmount = toDecimal(
        calculateEMI(loanAmount.toNumber(), toDecimal(loan.interestRate).toNumber(), loan.tenureMonths)
      );

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          approvedAt,
          disbursementAccountId: disbursementAccount.id,
          emiAmount,
          outstandingBalance: loanAmount,
        },
      });

      await ensureLoanRepaymentSchedule(tx, { ...updatedLoan, amount: loan.amount, interestRate: loan.interestRate });

      await tx.account.update({
        where: { id: treasuryAccount.id },
        data: { balance: { decrement: loanAmount } },
      });

      const creditedAccount = await tx.account.update({
        where: { id: disbursementAccount.id },
        data: { balance: { increment: loanAmount } },
      });

      const ledgerTransaction = await tx.transaction.create({
        data: {
          senderAccountId: treasuryAccount.id,
          receiverAccountId: creditedAccount.id,
          amount: loanAmount,
          status: 'SUCCESS',
          category: 'LOAN_DISBURSEMENT',
          note: `Loan #${loanId} disbursed to account #${creditedAccount.id}`,
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            userId: req.user.id,
            action: `Loan #${loanId} approved by ${req.user.email}, credited to account #${creditedAccount.id}, ledger txn #${ledgerTransaction.id}`,
          },
          {
            userId: loan.userId,
            action: `Loan #${loanId} approved and Rs ${formatMoney(loanAmount)} credited to account #${creditedAccount.id} via txn #${ledgerTransaction.id}`,
          },
        ],
      });

      return { loan: updatedLoan, account: creditedAccount, transaction: ledgerTransaction };
    });

    res.json({
      ...serializeLoan(result.loan),
      creditedAccountId: result.account.id,
      creditedAccountType: result.account.type,
      creditedBalance: result.account.balance,
      transactionId: result.transaction.id,
      message: `Loan approved and credited to account #${result.account.id} in transaction #${result.transaction.id}`,
    });
  } catch (err) {
    next(err);
  }
};

const rejectLoan = async (req, res, next) => {
  try {
    const loanId = validatePositiveInteger(req.params.id, 'Loan ID');
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({ error: `Loan already ${loan.status.toLowerCase()}` });
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REJECTED' },
    });

    await createAuditLog(req.user.id, `Loan #${loanId} rejected by ${req.user.email}`);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const getUserLoans = async (req, res, next) => {
  try {
    const targetUserId = validatePositiveInteger(req.params.userId, 'User ID');

    if (req.user.role.name === 'CUSTOMER' && req.user.id !== targetUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await refreshOverdueRepayments(prisma);

    const initialLoans = await prisma.loan.findMany({
      where: { userId: targetUserId },
      include: {
        _count: { select: { repayments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await ensureSchedulesForLoans(initialLoans);

    const loans = await prisma.loan.findMany({
      where: { userId: targetUserId },
      include: {
        repayments: {
          select: { id: true, dueDate: true, status: true },
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(loans.map((loan) => serializeLoan(loan, loan.repayments)));
  } catch (err) {
    next(err);
  }
};

const getMyLoans = async (req, res, next) => {
  try {
    await refreshOverdueRepayments(prisma);

    const initialLoans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { repayments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await ensureSchedulesForLoans(initialLoans);

    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: {
        repayments: {
          select: { id: true, dueDate: true, status: true },
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(loans.map((loan) => serializeLoan(loan, loan.repayments)));
  } catch (err) {
    next(err);
  }
};

const getAllLoans = async (req, res, next) => {
  try {
    await refreshOverdueRepayments(prisma);

    const initialLoans = await prisma.loan.findMany({
      include: {
        _count: { select: { repayments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await ensureSchedulesForLoans(initialLoans);

    const loans = await prisma.loan.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        repayments: {
          select: { id: true, dueDate: true, status: true },
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(loans.map((loan) => serializeLoan(loan, loan.repayments)));
  } catch (err) {
    next(err);
  }
};

const getLoanRepayments = async (req, res, next) => {
  try {
    const loanId = validatePositiveInteger(req.params.id, 'Loan ID');
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { repayments: true } },
      },
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (req.user.role.name === 'CUSTOMER' && req.user.id !== loan.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (['APPROVED', 'CLOSED'].includes(loan.status) && loan._count.repayments === 0) {
      await prisma.$transaction(async (tx) => {
        await ensureLoanRepaymentSchedule(tx, loan);
      });
    }

    await refreshOverdueRepayments(prisma, loanId);

    const loanWithRepayments = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        repayments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    res.json({
      loan: serializeLoan(loanWithRepayments, loanWithRepayments.repayments),
      repayments: loanWithRepayments.repayments.map((repayment) => ({
        ...repayment,
        amountDue: Number(toDecimal(repayment.amountDue).toFixed(2)),
        principalComponent: Number(toDecimal(repayment.principalComponent).toFixed(2)),
        interestComponent: Number(toDecimal(repayment.interestComponent).toFixed(2)),
        balanceAfter: Number(toDecimal(repayment.balanceAfter).toFixed(2)),
      })),
    });
  } catch (err) {
    next(err);
  }
};

const payLoanRepayment = async (req, res, next) => {
  try {
    const loanId = validatePositiveInteger(req.params.id, 'Loan ID');
    const repaymentId = validatePositiveInteger(req.params.repaymentId, 'Repayment ID');
    const payerAccountId = validatePositiveInteger(req.body.payerAccountId, 'Payer account ID');

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (req.user.id !== loan.userId) {
      return res.status(403).json({ error: 'You can only pay your own loan repayments' });
    }

    const payerAccount = await prisma.account.findUnique({
      where: { id: payerAccountId },
    });

    if (!payerAccount || payerAccount.userId !== req.user.id) {
      return res.status(404).json({ error: 'Payment account not found' });
    }

    if (payerAccount.type === 'FD' && payerAccount.fdStatus === 'ACTIVE') {
      return res.status(400).json({ error: 'Active fixed deposits cannot be used for EMI payments' });
    }

    await refreshOverdueRepayments(prisma, loanId);

    const result = await prisma.$transaction(async (tx) => {
      const lockedLoan = await tx.loan.findUnique({
        where: { id: loanId },
      });

      if (!lockedLoan || !['APPROVED', 'CLOSED'].includes(lockedLoan.status)) {
        throw makeHttpError(400, 'Only approved loans can accept repayments');
      }

      const repayment = await tx.loanRepayment.findUnique({
        where: { id: repaymentId },
      });

      if (!repayment || repayment.loanId !== loanId) {
        throw makeHttpError(404, 'Repayment installment not found');
      }

      if (repayment.status === 'PAID') {
        throw makeHttpError(400, 'This installment is already paid');
      }

      const payerRow = await tx.$queryRaw`
        SELECT * FROM accounts WHERE id = ${payerAccount.id} FOR UPDATE
      `;

      if (payerRow.length === 0) {
        throw makeHttpError(404, 'Payment account not found');
      }

      const amountDue = toDecimal(repayment.amountDue);
      if (toDecimal(payerRow[0].balance).lt(amountDue)) {
        throw makeHttpError(400, 'Insufficient balance for this EMI payment');
      }

      const claim = await tx.loanRepayment.updateMany({
        where: {
          id: repaymentId,
          loanId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          payerAccountId: payerAccount.id,
        },
      });

      if (claim.count === 0) {
        throw makeHttpError(400, 'Repayment could not be claimed for payment');
      }

      const treasuryAccount = await getOrCreateTreasuryAccount(tx, amountDue);

      await tx.account.update({
        where: { id: payerAccount.id },
        data: { balance: { decrement: amountDue } },
      });

      await tx.account.update({
        where: { id: treasuryAccount.id },
        data: { balance: { increment: amountDue } },
      });

      const transaction = await tx.transaction.create({
        data: {
          senderAccountId: payerAccount.id,
          receiverAccountId: treasuryAccount.id,
          amount: amountDue,
          status: 'SUCCESS',
          category: 'LOAN_REPAYMENT',
          note: `EMI payment for loan #${loanId}, installment ${repayment.installmentNumber}`,
        },
      });

      const paidRepayment = await tx.loanRepayment.update({
        where: { id: repaymentId },
        data: { transactionId: transaction.id },
      });

      const remainingRepayment = await tx.loanRepayment.findFirst({
        where: {
          loanId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        orderBy: { installmentNumber: 'asc' },
      });

      const loanUpdate = remainingRepayment
        ? {
            outstandingBalance: toDecimal(remainingRepayment.principalComponent).plus(
              toDecimal(remainingRepayment.balanceAfter)
            ),
          }
        : {
            outstandingBalance: toDecimal(0),
            status: 'CLOSED',
            completedAt: new Date(),
          };

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: loanUpdate,
      });

      await tx.auditLog.createMany({
        data: [
          {
            userId: req.user.id,
            action: `Loan #${loanId} repayment installment ${repayment.installmentNumber} paid from account #${payerAccount.id} [txn #${transaction.id}]`,
          },
          {
            userId: loan.userId,
            action: `Loan #${loanId} installment ${repayment.installmentNumber} marked paid`,
          },
        ],
      });

      return {
        loan: updatedLoan,
        repayment: paidRepayment,
        transaction,
      };
    });

    res.json({
      message: `Installment ${result.repayment.installmentNumber} paid successfully`,
      loan: serializeLoan(result.loan),
      repaymentId: result.repayment.id,
      transactionId: result.transaction.id,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyLoan,
  approveLoan,
  rejectLoan,
  getUserLoans,
  getMyLoans,
  getAllLoans,
  getLoanRepayments,
  payLoanRepayment,
};

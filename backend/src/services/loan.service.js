const { roundMoney, toDecimal } = require('../lib/decimal');

/**
 * EMI = [P * R * (1+R)^N] / [(1+R)^N - 1]
 * P = Principal, R = Monthly interest rate, N = Tenure in months
 */
const calculateEMI = (principal, annualRatePercent, tenureMonths) => {
  const R = annualRatePercent / 12 / 100;

  if (R === 0) {
    return +(principal / tenureMonths).toFixed(2);
  }

  const emi = (principal * R * Math.pow(1 + R, tenureMonths)) / (Math.pow(1 + R, tenureMonths) - 1);
  return +emi.toFixed(2);
};

const addMonthsClamped = (date, monthsToAdd) => {
  const source = new Date(date);
  const target = new Date(source);
  const sourceDay = target.getDate();

  target.setDate(1);
  target.setMonth(target.getMonth() + monthsToAdd);

  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(sourceDay, lastDayOfTargetMonth));

  return target;
};

const buildRepaymentSchedule = ({ principal, annualRatePercent, tenureMonths, approvedAt }) => {
  const principalDecimal = roundMoney(principal);
  const annualRateDecimal = toDecimal(annualRatePercent);
  const emiDecimal = roundMoney(
    calculateEMI(principalDecimal.toNumber(), annualRateDecimal.toNumber(), tenureMonths)
  );
  const monthlyRate = annualRateDecimal.div(12).div(100);
  const schedule = [];
  let balance = principalDecimal;

  for (let installmentNumber = 1; installmentNumber <= tenureMonths; installmentNumber += 1) {
    const interestComponent = monthlyRate.eq(0) ? toDecimal(0) : roundMoney(balance.mul(monthlyRate));
    let principalComponent = roundMoney(emiDecimal.sub(interestComponent));

    if (installmentNumber === tenureMonths || principalComponent.gt(balance)) {
      principalComponent = balance;
    }

    const amountDue = roundMoney(principalComponent.plus(interestComponent));
    balance = roundMoney(balance.sub(principalComponent));

    if (balance.lt(0)) {
      balance = toDecimal(0);
    }

    schedule.push({
      installmentNumber,
      dueDate: addMonthsClamped(approvedAt, installmentNumber),
      amountDue,
      principalComponent,
      interestComponent,
      balanceAfter: balance,
    });
  }

  return { emi: emiDecimal, schedule };
};

const ensureLoanRepaymentSchedule = async (tx, loan) => {
  const existingCount = await tx.loanRepayment.count({ where: { loanId: loan.id } });

  if (existingCount > 0) {
    return;
  }

  const approvedAt = loan.approvedAt || loan.createdAt || new Date();
  const { emi, schedule } = buildRepaymentSchedule({
    principal: loan.amount,
    annualRatePercent: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    approvedAt,
  });

  await tx.loan.update({
    where: { id: loan.id },
    data: {
      emiAmount: loan.emiAmount || emi,
      outstandingBalance: loan.outstandingBalance || loan.amount,
      approvedAt: loan.approvedAt || approvedAt,
    },
  });

  await tx.loanRepayment.createMany({
    data: schedule.map((entry) => ({
      loanId: loan.id,
      installmentNumber: entry.installmentNumber,
      dueDate: entry.dueDate,
      amountDue: entry.amountDue,
      principalComponent: entry.principalComponent,
      interestComponent: entry.interestComponent,
      balanceAfter: entry.balanceAfter,
    })),
  });
};

const refreshOverdueRepayments = async (prismaLike, loanId = null) => {
  const where = {
    status: 'PENDING',
    dueDate: { lt: new Date() },
  };

  if (loanId !== null) {
    where.loanId = loanId;
  }

  await prismaLike.loanRepayment.updateMany({
    where,
    data: { status: 'OVERDUE' },
  });
};

const getLoanSummary = (loan, repayments = []) => {
  const pendingRepayments = repayments.filter((repayment) => repayment.status !== 'PAID');
  const nextRepayment = pendingRepayments
    .slice()
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))[0] || null;
  const overdueCount = repayments.filter((repayment) => repayment.status === 'OVERDUE').length;

  return {
    emi: loan.emiAmount ? toDecimal(loan.emiAmount).toFixed(2) : null,
    outstandingBalance: loan.outstandingBalance ? toDecimal(loan.outstandingBalance).toFixed(2) : null,
    nextDueDate: nextRepayment?.dueDate || null,
    overdueCount,
    totalInstallments: repayments.length,
    paidInstallments: repayments.filter((repayment) => repayment.status === 'PAID').length,
  };
};

module.exports = {
  buildRepaymentSchedule,
  calculateEMI,
  ensureLoanRepaymentSchedule,
  getLoanSummary,
  refreshOverdueRepayments,
};

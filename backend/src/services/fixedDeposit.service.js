const { formatMoney, roundMoney, toDecimal } = require('../lib/decimal');
const { getOrCreateTreasuryAccount } = require('./treasury.service');

const DEFAULT_SCAN_INTERVAL_MS = 60 * 1000;

const calculateFixedDepositInterest = ({ principal, annualRatePercent, openedAt, maturityDate }) => {
  const principalDecimal = toDecimal(principal);
  const annualRateDecimal = toDecimal(annualRatePercent);
  const openedTimestamp = new Date(openedAt).getTime();
  const maturityTimestamp = new Date(maturityDate).getTime();
  const termDays = Math.max(1, Math.ceil((maturityTimestamp - openedTimestamp) / (24 * 60 * 60 * 1000)));

  return roundMoney(principalDecimal.mul(annualRateDecimal).mul(termDays).div(36500));
};

const processMaturedFixedDeposits = async (prisma) => {
  const candidates = await prisma.account.findMany({
    where: {
      type: 'FD',
      fdStatus: 'ACTIVE',
      maturityDate: { lte: new Date() },
      interestRate: { not: null },
      fdPrincipalAmount: { not: null },
    },
    select: { id: true },
  });

  let processedCount = 0;

  for (const candidate of candidates) {
    const processed = await prisma.$transaction(async (tx) => {
      const claim = await tx.account.updateMany({
        where: {
          id: candidate.id,
          type: 'FD',
          fdStatus: 'ACTIVE',
          maturityDate: { lte: new Date() },
        },
        data: {
          fdStatus: 'MATURED',
          fdInterestCreditedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        return false;
      }

      const account = await tx.account.findUnique({
        where: { id: candidate.id },
        include: { user: true },
      });

      const interestAmount = calculateFixedDepositInterest({
        principal: account.fdPrincipalAmount,
        annualRatePercent: account.interestRate,
        openedAt: account.createdAt,
        maturityDate: account.maturityDate,
      });

      if (interestAmount.gt(0)) {
        const treasuryAccount = await getOrCreateTreasuryAccount(tx, interestAmount);

        await tx.account.update({
          where: { id: treasuryAccount.id },
          data: { balance: { decrement: interestAmount } },
        });

        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: interestAmount } },
        });

        await tx.transaction.create({
          data: {
            senderAccountId: treasuryAccount.id,
            receiverAccountId: account.id,
            amount: interestAmount,
            status: 'SUCCESS',
            category: 'FD_INTEREST',
            note: `FD maturity interest credited for account #${account.id}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: account.userId,
          action: `FD account #${account.id} matured with interest credit of Rs ${formatMoney(interestAmount)}`,
        },
      });

      return true;
    });

    if (processed) {
      processedCount += 1;
    }
  }

  return processedCount;
};

const startFdMaturityScheduler = (prisma) => {
  const intervalMs = Number.parseInt(process.env.FD_MATURITY_SCAN_INTERVAL_MS, 10) || DEFAULT_SCAN_INTERVAL_MS;
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      await processMaturedFixedDeposits(prisma);
    } catch (error) {
      console.error('FD maturity scheduler failed:', error);
    } finally {
      running = false;
    }
  };

  void tick();
  return setInterval(() => {
    void tick();
  }, intervalMs);
};

module.exports = {
  calculateFixedDepositInterest,
  processMaturedFixedDeposits,
  startFdMaturityScheduler,
};

const { ANALYTICS_EXCLUDED_CATEGORIES } = require('../lib/transactionCategories');
const { toDecimal } = require('../lib/decimal');

const roundMetric = (value) => Number(value.toFixed(2));

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getMonthLabel = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

const buildEmptyMonthlySeries = (months) => {
  const now = new Date();
  const series = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthDate = startOfMonth(addMonths(now, -offset));
    series.push({
      key: getMonthKey(monthDate),
      label: getMonthLabel(monthDate),
      incoming: 0,
      outgoing: 0,
      net: 0,
    });
  }

  return series;
};

const getUserSpendingAnalytics = async (prisma, userId, months = 6) => {
  const accountRows = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });
  const accountIds = accountRows.map((account) => account.id);

  if (accountIds.length === 0) {
    const emptySeries = buildEmptyMonthlySeries(months);
    return {
      months,
      summary: {
        incomingTotal: 0,
        outgoingTotal: 0,
        netCashFlow: 0,
        categorizedOutgoingTotal: 0,
      },
      spendByCategory: [],
      monthlyCashFlow: emptySeries,
      monthOverMonth: {
        currentMonth: emptySeries.at(-1) || null,
        previousMonth: emptySeries.at(-2) || null,
      },
    };
  }

  const monthlySeries = buildEmptyMonthlySeries(months);
  const earliestMonth = monthlySeries[0];
  const [year, month] = earliestMonth.key.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const monthlyMap = new Map(monthlySeries.map((entry) => [entry.key, entry]));
  const spendByCategory = new Map();

  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      createdAt: { gte: periodStart },
      OR: [
        { senderAccountId: { in: accountIds } },
        { receiverAccountId: { in: accountIds } },
      ],
    },
    include: {
      senderAccount: { select: { userId: true } },
      receiverAccount: { select: { userId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const transaction of transactions) {
    const monthKey = getMonthKey(new Date(transaction.createdAt));
    const monthEntry = monthlyMap.get(monthKey);

    if (!monthEntry) {
      continue;
    }

    const amount = toDecimal(transaction.amount).toNumber();
    const isOutgoing = transaction.senderAccount?.userId === userId;
    const isIncoming = transaction.receiverAccount?.userId === userId;
    const isInternalTransfer = isOutgoing && isIncoming;

    if (isInternalTransfer) {
      continue;
    }

    if (isOutgoing) {
      monthEntry.outgoing += amount;

      const categoryKey = transaction.category || 'UNCATEGORIZED';
      if (!ANALYTICS_EXCLUDED_CATEGORIES.has(categoryKey)) {
        spendByCategory.set(categoryKey, (spendByCategory.get(categoryKey) || 0) + amount);
      }
    }

    if (isIncoming) {
      monthEntry.incoming += amount;
    }
  }

  const finalizedMonthlySeries = monthlySeries.map((entry) => {
    const finalized = {
      ...entry,
      incoming: roundMetric(entry.incoming),
      outgoing: roundMetric(entry.outgoing),
    };
    finalized.net = roundMetric(finalized.incoming - finalized.outgoing);
    return finalized;
  });

  const incomingTotal = roundMetric(
    finalizedMonthlySeries.reduce((total, entry) => total + entry.incoming, 0)
  );
  const outgoingTotal = roundMetric(
    finalizedMonthlySeries.reduce((total, entry) => total + entry.outgoing, 0)
  );

  const categoryBreakdownBase = Array.from(spendByCategory.entries())
    .map(([category, total]) => ({
      category,
      total: roundMetric(total),
    }))
    .sort((left, right) => right.total - left.total);
  const categorizedOutgoingTotal = roundMetric(
    categoryBreakdownBase.reduce((sum, entry) => sum + entry.total, 0)
  );
  const categoryBreakdown = categoryBreakdownBase.map((entry) => ({
    ...entry,
    share: categorizedOutgoingTotal === 0 ? 0 : roundMetric((entry.total / categorizedOutgoingTotal) * 100),
  }));

  return {
    months,
    summary: {
      incomingTotal,
      outgoingTotal,
      netCashFlow: roundMetric(incomingTotal - outgoingTotal),
      categorizedOutgoingTotal,
    },
    spendByCategory: categoryBreakdown,
    monthlyCashFlow: finalizedMonthlySeries,
    monthOverMonth: {
      currentMonth: finalizedMonthlySeries.at(-1) || null,
      previousMonth: finalizedMonthlySeries.at(-2) || null,
    },
  };
};

module.exports = {
  getUserSpendingAnalytics,
};

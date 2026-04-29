const bcrypt = require('bcryptjs');
const { toDecimal } = require('../lib/decimal');

const TREASURY_EMAIL = 'treasury@bank.internal';
const TREASURY_NAME = 'Bank Treasury';
const TREASURY_PASSWORD_HASH = bcrypt.hashSync('bank-treasury-disabled-account', 8);
const TREASURY_FLOAT_BALANCE = toDecimal('1000000000.00');
const TREASURY_LOW_WATERMARK = toDecimal('100000000.00');

const makeHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getOrCreateTreasuryAccount = async (tx, requiredAmount = '0.00') => {
  const requiredDecimal = toDecimal(requiredAmount);
  const adminRole = await tx.role.findUnique({ where: { name: 'ADMIN' } });

  if (!adminRole) {
    throw makeHttpError(500, 'ADMIN role not found. Seed roles before proceeding.');
  }

  let treasuryUser = await tx.user.findUnique({
    where: { email: TREASURY_EMAIL },
  });

  if (!treasuryUser) {
    treasuryUser = await tx.user.create({
      data: {
        name: TREASURY_NAME,
        email: TREASURY_EMAIL,
        passwordHash: TREASURY_PASSWORD_HASH,
        roleId: adminRole.id,
      },
    });
  }

  let treasuryAccount = await tx.account.findFirst({
    where: { userId: treasuryUser.id },
    orderBy: { createdAt: 'asc' },
  });

  if (!treasuryAccount) {
    treasuryAccount = await tx.account.create({
      data: {
        userId: treasuryUser.id,
        type: 'CURRENT',
        balance: TREASURY_FLOAT_BALANCE,
      },
    });
  }

  const treasuryBalance = toDecimal(treasuryAccount.balance);
  const replenishmentThreshold = requiredDecimal.gt(TREASURY_LOW_WATERMARK)
    ? requiredDecimal
    : TREASURY_LOW_WATERMARK;

  if (treasuryBalance.lt(replenishmentThreshold)) {
    treasuryAccount = await tx.account.update({
      where: { id: treasuryAccount.id },
      data: {
        balance: {
          increment: TREASURY_FLOAT_BALANCE.sub(treasuryBalance).plus(requiredDecimal),
        },
      },
    });
  }

  return treasuryAccount;
};

module.exports = {
  TREASURY_EMAIL,
  TREASURY_FLOAT_BALANCE,
  getOrCreateTreasuryAccount,
};

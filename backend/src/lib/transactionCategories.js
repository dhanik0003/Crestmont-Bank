const USER_TRANSACTION_CATEGORIES = [
  'FOOD',
  'RENT',
  'UTILITIES',
  'GROCERIES',
  'ENTERTAINMENT',
  'SHOPPING',
  'TRAVEL',
  'HEALTHCARE',
  'EDUCATION',
  'SAVINGS',
  'INVESTMENT',
  'TRANSFER',
  'OTHER',
];

const SYSTEM_TRANSACTION_CATEGORIES = ['LOAN_REPAYMENT', 'LOAN_DISBURSEMENT', 'FD_INTEREST'];
const ALL_TRANSACTION_CATEGORIES = [...USER_TRANSACTION_CATEGORIES, ...SYSTEM_TRANSACTION_CATEGORIES];
const ANALYTICS_EXCLUDED_CATEGORIES = new Set(['LOAN_DISBURSEMENT', 'FD_INTEREST']);

const isTransactionCategory = (value) => ALL_TRANSACTION_CATEGORIES.includes(value);
const isUserTransactionCategory = (value) => USER_TRANSACTION_CATEGORIES.includes(value);

const normalizeOptionalTransactionCategory = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const normalized = String(value).trim().toUpperCase();

  if (!isUserTransactionCategory(normalized)) {
    const error = new Error('Invalid transaction category');
    error.status = 400;
    throw error;
  }

  return normalized;
};

const normalizeOptionalNote = (value, maxLength = 240) => {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    const error = new Error(`Note must be ${maxLength} characters or fewer`);
    error.status = 400;
    throw error;
  }

  return normalized;
};

module.exports = {
  ALL_TRANSACTION_CATEGORIES,
  ANALYTICS_EXCLUDED_CATEGORIES,
  SYSTEM_TRANSACTION_CATEGORIES,
  USER_TRANSACTION_CATEGORIES,
  isTransactionCategory,
  normalizeOptionalNote,
  normalizeOptionalTransactionCategory,
};

export const USER_TRANSACTION_CATEGORIES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'GROCERIES', label: 'Groceries' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'OTHER', label: 'Other' },
];

export const CATEGORY_LABELS = {
  UNCATEGORIZED: 'Uncategorized',
  LOAN_REPAYMENT: 'Loan Repayment',
  LOAN_DISBURSEMENT: 'Loan Disbursement',
  FD_INTEREST: 'FD Interest',
  ...Object.fromEntries(USER_TRANSACTION_CATEGORIES.map((entry) => [entry.value, entry.label])),
};

export const getTransactionCategoryLabel = (category) =>
  CATEGORY_LABELS[category || 'UNCATEGORIZED'] || (category || 'Uncategorized');

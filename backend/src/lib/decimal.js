const { Prisma } = require('@prisma/client');

const makeValidationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const DECIMAL_PATTERN_CACHE = new Map();

const getDecimalPattern = (maxScale) => {
  if (!DECIMAL_PATTERN_CACHE.has(maxScale)) {
    DECIMAL_PATTERN_CACHE.set(maxScale, new RegExp(`^-?\\d+(?:\\.\\d{1,${maxScale}})?$`));
  }

  return DECIMAL_PATTERN_CACHE.get(maxScale);
};

const toDecimal = (value) => {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
};

const parseDecimalInput = (
  value,
  { fieldName = 'Value', maxScale = 2, defaultValue, allowZero = true, allowNegative = false } = {}
) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (defaultValue !== undefined) {
      return toDecimal(defaultValue);
    }

    throw makeValidationError(`${fieldName} is required`);
  }

  const normalized = String(value).trim();

  if (!getDecimalPattern(maxScale).test(normalized)) {
    throw makeValidationError(`${fieldName} must be a valid number with up to ${maxScale} decimal places`);
  }

  const decimal = toDecimal(normalized);

  if (!allowNegative && decimal.lt(0)) {
    throw makeValidationError(`${fieldName} cannot be negative`);
  }

  if (!allowZero && decimal.eq(0)) {
    throw makeValidationError(`${fieldName} must be greater than 0`);
  }

  return decimal;
};

const parseMoneyInput = (value, options = {}) =>
  parseDecimalInput(value, { fieldName: 'Amount', maxScale: 2, ...options });

const parseEnvDecimal = (value, fallback) => {
  try {
    return parseDecimalInput(value, {
      fieldName: 'Environment value',
      maxScale: 2,
      defaultValue: fallback,
    });
  } catch (_) {
    return toDecimal(fallback);
  }
};

const formatMoney = (value) => toDecimal(value).toFixed(2);
const roundMoney = (value) => toDecimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

module.exports = {
  formatMoney,
  parseDecimalInput,
  parseEnvDecimal,
  parseMoneyInput,
  roundMoney,
  toDecimal,
};

export const SLIDER_LIMITS = {
  VEHICLE_PRICE: {
    MIN: 10000,
    MAX: 150000,
    STEP: 1000,
  },
  AUTO_LOAN_INTEREST_RATE: {
    MIN: 0,
    MAX: 15,
    STEP: 0.25,
  },
  VEHICLE_DEPRECIATION: {
    MIN: 0,
    MAX: 30,
    STEP: 1,
  },
  DOWN_PAYMENT: {
    MIN: 0,
    MAX: 100,
    STEP: 1,
  },
  MONTHLY_LEASE: {
    MIN: 100,
    MAX: 2000,
    STEP: 50,
  },
  LEASE_GROWTH: {
    MIN: 0,
    MAX: 10,
    STEP: 0.5,
  },
  INVESTMENT_RETURN: {
    MIN: 0,
    MAX: 30,
    STEP: 0.25,
  },
} as const;

export const INVESTMENT_OPTIONS = {
  SPY: {
    name: "S&P 500",
    returnRate: 13,
  },
  QQQ: {
    name: "Nasdaq 100",
    returnRate: 18,
  },
  Custom: {
    name: "Custom",
    returnRate: 10, // Will be set by user
  },
} as const;

export const TAX_RATES = {
  CAPITAL_GAINS: [0, 15, 18.8, 23.8] as const,
} as const;

export const TAX_FREE_CAPITAL_GAINS = {
  Single: 0, // Vehicles don't have tax-free capital gains exclusion
  Married: 0,
} as const;

export const LOAN_TERMS = [3, 5, 7, 10] as const;

export const VALIDATION_LIMITS = {
  PERCENTAGE: { min: 0, max: 100 },
  POSITIVE_NUMBER: { min: 0 },
  VEHICLE_PRICE: { min: 0 },
  FUEL_COSTS: { min: 0 },
  MONTHLY_LEASE: { min: 0 },
} as const;

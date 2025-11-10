export interface AutoLoanDetails {
  monthlyPayment: number;
  totalLoanAmount: number;
  downPaymentAmount: number;
  dealerFeesAmount: number;
}

export interface YearlyAutoLoanBreakdown {
  year: number;
  annualInterestPaid: number;
  annualPrincipalPaid: number;
  remainingBalance: number;
  totalPaid: number;
}

export interface YearlyBuyCalculation {
  year: number;
  vehicleValue: number;
  totalHoldingCosts: number;
  insuranceAndRegistration: number;
  maintenance: number;
  fuelCosts: number;
  autoLoanPayment: number;
  autoLoanInterest: number;
  autoLoanPrincipal: number;
  taxSavingsFromDeduction: number;
  cashOutflow: number;
  adjustedCashOutflow: number;
  netAssetValueNotCashOut: number;
  netAssetValueCashOut: number;
  capitalGainOnVehicle: number;
  taxableGainOnVehicle: number;
  taxOnVehicleGain: number;
  remainingAutoLoanBalance: number;
  additionalInvestmentPortfolio: number;
  additionalInvestmentCostBasis: number;
  additionalInvestmentGains: number;
  taxOnAdditionalInvestment: number;
}

export interface YearlyLeaseCalculation {
  year: number;
  monthlyLease: number;
  annualLeaseCost: number;
  cashOutflow: number;
  additionalInvestmentThisYear: number;
  portfolioValueBeforeGrowth: number;
  investmentReturnThisYear: number;
  portfolioValueEndOfYear: number;
  totalCashInvestedSoFar: number;
  netAssetValueNotCashOut: number;
  netAssetValueCashOut: number;
  capitalGainOnInvestment: number;
  taxableGainOnInvestment: number;
  taxOnInvestmentGain: number;
}

export interface YearlyCalculation {
  year: number;
  buy: YearlyBuyCalculation;
  rent: YearlyLeaseCalculation;
}

export interface PreliminaryCalculations {
  autoLoan: AutoLoanDetails;
  initialInvestmentAmount: number;
  taxFreeCapitalGainAmount: number;
  investmentReturnRate: number;
}

export interface CalculationResults {
  preliminary: PreliminaryCalculations;
  yearlyResults: YearlyCalculation[];
  projectionYears: number;
}

export interface CalculationFormulas {
  monthlyAutoLoanPayment: string;
  vehicleValueDepreciation: string;
  investmentGrowth: string;
  taxCalculations: {
    autoLoanInterestDeduction: string;
    vehicleCapitalGains: string;
    investmentCapitalGains: string;
  };
}
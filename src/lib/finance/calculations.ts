import type { BuyInputs, RentInputs, AppSettings } from '../../contexts';
import type { 
  CalculationResults, 
  PreliminaryCalculations, 
  YearlyCalculation,
  YearlyBuyCalculation,
  YearlyLeaseCalculation,
  YearlyAutoLoanBreakdown,
  CalculationFormulas
} from './types';
import { TAX_FREE_CAPITAL_GAINS, INVESTMENT_OPTIONS } from '../constants';

/**
 * Calculate monthly auto loan payment using standard PMT formula
 * M = P [i(1 + i)^n] / [(1 + i)^n – 1]
 */
export function calculateMonthlyAutoLoanPayment(
  loanAmount: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (loanAmount <= 0 || annualInterestRate <= 0) return 0;
  
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = termYears * 12;
  
  if (monthlyRate === 0) return loanAmount / numberOfPayments;
  
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
  return monthlyPayment;
}

/**
 * Generate auto loan amortization schedule for all years
 */
export function generateAmortizationSchedule(
  loanAmount: number,
  annualInterestRate: number,
  termYears: number,
  projectionYears: number
): YearlyAutoLoanBreakdown[] {
  const monthlyPayment = calculateMonthlyAutoLoanPayment(loanAmount, annualInterestRate, termYears);
  const monthlyRate = annualInterestRate / 100 / 12;
  
  let remainingBalance = loanAmount;
  let totalPaid = 0;
  const schedule: YearlyAutoLoanBreakdown[] = [];
  
  for (let year = 1; year <= projectionYears; year++) {
    let annualInterest = 0;
    let annualPrincipal = 0;
    
    // Calculate 12 months for this year (or remaining months if loan is paid off)
    for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
      
      annualInterest += interestPayment;
      annualPrincipal += principalPayment;
      remainingBalance -= principalPayment;
      totalPaid += monthlyPayment;
    }
    
    schedule.push({
      year,
      annualInterestPaid: annualInterest,
      annualPrincipalPaid: annualPrincipal,
      remainingBalance: Math.max(0, remainingBalance),
      totalPaid
    });
    
    // If auto loan is paid off, remaining years have no payments
    if (remainingBalance <= 0) {
      for (let remainingYear = year + 1; remainingYear <= projectionYears; remainingYear++) {
        schedule.push({
          year: remainingYear,
          annualInterestPaid: 0,
          annualPrincipalPaid: 0,
          remainingBalance: 0,
          totalPaid
        });
      }
      break;
    }
  }
  
  return schedule;
}

/**
 * Calculate preliminary values that are used throughout the calculations
 */
export function calculatePreliminaryValues(
  buyInputs: BuyInputs,
  rentInputs: RentInputs
): PreliminaryCalculations {
  const downPaymentAmount = (buyInputs.carPrice * buyInputs.downPaymentPercentage) / 100;
  const loanAmount = buyInputs.carPrice - downPaymentAmount;
  const dealerFeesAmount = (buyInputs.carPrice * buyInputs.dealerFeesPercentage) / 100;
  const monthlyPayment = calculateMonthlyAutoLoanPayment(
  loanAmount,
  buyInputs.autoLoanInterestRateAnnual,
  buyInputs.autoLoanTermYears
  );
  
  const initialInvestmentAmount = 0; // No longer used - cash flow difference includes down payment savings
  const taxFreeCapitalGainAmount = 0; // Vehicles don't have tax-free capital gains exclusion
  
  let investmentReturnRate: number;
  if (rentInputs.selectedInvestmentOption === 'Custom') {
    investmentReturnRate = rentInputs.customInvestmentReturn;
  } else {
    investmentReturnRate = INVESTMENT_OPTIONS[rentInputs.selectedInvestmentOption].returnRate;
  }
  
  return {
    autoLoan: {
      monthlyPayment,
      totalLoanAmount: loanAmount,
      downPaymentAmount,
      dealerFeesAmount
    },
    initialInvestmentAmount,
    taxFreeCapitalGainAmount,
    investmentReturnRate
  };
}

/**
 * Calculate buy scenario for a specific year
 */
export function calculateBuyScenarioForYear(
  year: number,
  buyInputs: BuyInputs,
  autoLoanBreakdown: YearlyAutoLoanBreakdown,
  preliminary: PreliminaryCalculations,
  leaseCashOutflow?: number,
  previousBuyCalculation?: YearlyBuyCalculation
): YearlyBuyCalculation {
  // Current vehicle value with depreciation
  const vehicleValue = buyInputs.carPrice * Math.pow(1 - buyInputs.carDepreciationRate / 100, year);
  
  // Annual holding costs
  const insuranceAndRegistration = buyInputs.carPrice * buyInputs.insuranceAndRegistrationRateAnnual / 100;
  const maintenanceAndFuel = buyInputs.carPrice * buyInputs.maintenanceAndFuelRateAnnual / 100;
  const registrationAndFuel = buyInputs.registrationAndFuelAnnual;
  const totalHoldingCosts = insuranceAndRegistration + maintenanceAndFuel + registrationAndFuel;
  
  // Auto loan payments (use actual annual payments from schedule, which will be 0 after loan is paid off)
  const annualAutoLoanPayment = autoLoanBreakdown.annualInterestPaid + autoLoanBreakdown.annualPrincipalPaid;

  // Tax savings from auto loan interest deduction (usually not applicable for personal use)
  const taxSavingsFromDeduction = buyInputs.autoLoanInterestDeduction
    ? autoLoanBreakdown.annualInterestPaid * buyInputs.marginalTaxRate / 100
    : 0;
  
  // Cash outflow calculation
  let cashOutflow: number;
  if (year === 1) {
    cashOutflow = preliminary.autoLoan.downPaymentAmount + 
                  preliminary.autoLoan.dealerFeesAmount + 
                  annualAutoLoanPayment + 
                  totalHoldingCosts;
  } else {
    cashOutflow = annualAutoLoanPayment + totalHoldingCosts;
  }
  
  const adjustedCashOutflow = cashOutflow - taxSavingsFromDeduction;
  
  // Additional investment portfolio for buy scenario
  let additionalInvestmentPortfolio = 0;
  let additionalInvestmentCostBasis = 0;
  if (leaseCashOutflow !== undefined) {
    const cashFlowDifference = leaseCashOutflow - adjustedCashOutflow;
    const additionalInvestmentThisYear = Math.max(0, cashFlowDifference);
    
    let portfolioValueBeforeGrowth: number;
    
    if (year === 1) {
      portfolioValueBeforeGrowth = additionalInvestmentThisYear;
      additionalInvestmentCostBasis = additionalInvestmentThisYear;
    } else {
      const previousPortfolioValue = previousBuyCalculation?.additionalInvestmentPortfolio || 0;
      const previousCostBasis = previousBuyCalculation?.additionalInvestmentCostBasis || 0;
      portfolioValueBeforeGrowth = previousPortfolioValue + additionalInvestmentThisYear;
      additionalInvestmentCostBasis = previousCostBasis + additionalInvestmentThisYear;
    }
    
    const investmentReturnThisYear = portfolioValueBeforeGrowth * preliminary.investmentReturnRate / 100;
    additionalInvestmentPortfolio = portfolioValueBeforeGrowth + investmentReturnThisYear;
  }
  
  // Net asset value calculations
  const netAssetValueNotCashOut = vehicleValue - autoLoanBreakdown.remainingBalance + additionalInvestmentPortfolio;
  
  // Cash out scenario calculations
  const sellingPrice = vehicleValue;
  const sellingCostsAmount = sellingPrice * buyInputs.sellingCostsPercentage / 100;
  const proceedsBeforeTaxAndLoanRepayment = sellingPrice - sellingCostsAmount;
  const capitalGainOnVehicle = sellingPrice - buyInputs.carPrice;
  const taxableGainOnVehicle = Math.max(0, capitalGainOnVehicle - preliminary.taxFreeCapitalGainAmount);
  const taxOnVehicleGain = taxableGainOnVehicle * buyInputs.longTermCapitalGainsTaxRateVehicle / 100;
  
  // Calculate tax on additional investment portfolio if applicable
  let taxOnAdditionalInvestment = 0;
  let additionalInvestmentGains = 0;
  if (additionalInvestmentPortfolio > 0) {
    additionalInvestmentGains = Math.max(0, additionalInvestmentPortfolio - additionalInvestmentCostBasis);
    taxOnAdditionalInvestment = additionalInvestmentGains * buyInputs.longTermCapitalGainsTaxRateVehicle / 100;
  }
  
  const netAssetValueCashOut = proceedsBeforeTaxAndLoanRepayment - 
                               autoLoanBreakdown.remainingBalance - 
                               taxOnVehicleGain +
                               additionalInvestmentPortfolio -
                               taxOnAdditionalInvestment;
  
  return {
    year,
    vehicleValue,
    totalHoldingCosts,
    insuranceAndRegistration,
  maintenance: maintenanceAndFuel,
  fuelCosts: registrationAndFuel,
    autoLoanPayment: annualAutoLoanPayment,
    autoLoanInterest: autoLoanBreakdown.annualInterestPaid,
    autoLoanPrincipal: autoLoanBreakdown.annualPrincipalPaid,
    taxSavingsFromDeduction,
    cashOutflow,
    adjustedCashOutflow,
    netAssetValueNotCashOut,
    netAssetValueCashOut,
    capitalGainOnVehicle,
    taxableGainOnVehicle,
    taxOnVehicleGain,
    remainingAutoLoanBalance: autoLoanBreakdown.remainingBalance,
    additionalInvestmentPortfolio,
    additionalInvestmentCostBasis,
    additionalInvestmentGains,
    taxOnAdditionalInvestment
  };
}

/**
 * Calculate lease & invest scenario for a specific year
 */
export function calculateRentScenarioForYear(
  year: number,
  rentInputs: RentInputs,
  buyCalculation: YearlyBuyCalculation,
  previousRentCalculation: YearlyLeaseCalculation | null,
  preliminary: PreliminaryCalculations
): YearlyLeaseCalculation {
  // Current lease calculation
  const monthlyLease = rentInputs.currentMonthlyRentAmount * 
                      Math.pow(1 + rentInputs.rentGrowthRateAnnual / 100, year - 1);
  const annualLeaseCost = monthlyLease * 12;
  const cashOutflow = annualLeaseCost;
  
  // Differential cash flow for investment
  // When buy scenario costs more, the difference can be invested (positive)
  // When rent scenario costs more, no additional investment is made (0)
  const cashFlowDifference = buyCalculation.adjustedCashOutflow - cashOutflow;
  const additionalInvestmentThisYear = Math.max(0, cashFlowDifference);
  
  // Investment portfolio calculations
  let portfolioValueBeforeGrowth: number;
  let totalCashInvestedSoFar: number;
  
  if (year === 1) {
    // Year 1: Only invest the cash flow difference (which already includes down payment savings)
    portfolioValueBeforeGrowth = additionalInvestmentThisYear;
    totalCashInvestedSoFar = additionalInvestmentThisYear;
  } else {
    const previousPortfolioValue = previousRentCalculation?.portfolioValueEndOfYear || 0;
    portfolioValueBeforeGrowth = previousPortfolioValue + additionalInvestmentThisYear;
    totalCashInvestedSoFar = (previousRentCalculation?.totalCashInvestedSoFar || 0) + additionalInvestmentThisYear;
  }
  
  const investmentReturnThisYear = portfolioValueBeforeGrowth * preliminary.investmentReturnRate / 100;
  const portfolioValueEndOfYear = portfolioValueBeforeGrowth + investmentReturnThisYear;
  
  // Net asset value calculations
  const netAssetValueNotCashOut = portfolioValueEndOfYear;
  
  // Cash out scenario calculations
  const capitalGainOnInvestment = portfolioValueEndOfYear - totalCashInvestedSoFar;
  const taxableGainOnInvestment = Math.max(0, capitalGainOnInvestment);
  const taxOnInvestmentGain = taxableGainOnInvestment * rentInputs.longTermCapitalGainsTaxRateInvestment / 100;
  const netAssetValueCashOut = portfolioValueEndOfYear - taxOnInvestmentGain;
  
  return {
    year,
    monthlyLease,
    annualLeaseCost,
    cashOutflow,
    additionalInvestmentThisYear,
    portfolioValueBeforeGrowth,
    investmentReturnThisYear,
    portfolioValueEndOfYear,
    totalCashInvestedSoFar,
    netAssetValueNotCashOut,
    netAssetValueCashOut,
    capitalGainOnInvestment,
    taxableGainOnInvestment,
    taxOnInvestmentGain
  };
}

/**
 * Main calculation function that generates all results
 */
export function calculateAllScenarios(
  buyInputs: BuyInputs,
  rentInputs: RentInputs,
  appSettings: AppSettings
): CalculationResults {
  const preliminary = calculatePreliminaryValues(buyInputs, rentInputs);
  const autoLoanSchedule = generateAmortizationSchedule(
    preliminary.autoLoan.totalLoanAmount,
    buyInputs.autoLoanInterestRateAnnual,
  buyInputs.autoLoanTermYears,
    appSettings.projectionYears
  );
  
  const yearlyResults: YearlyCalculation[] = [];
  let previousRentCalculation: YearlyLeaseCalculation | null = null;
  let previousBuyCalculation: YearlyBuyCalculation | undefined = undefined;
  
  for (let year = 1; year <= appSettings.projectionYears; year++) {
    const autoLoanBreakdown = autoLoanSchedule[year - 1];
    
    // First pass: Calculate initial buy scenario (without lease cash flow considerations)
    const initialBuyCalculation = calculateBuyScenarioForYear(year, buyInputs, autoLoanBreakdown, preliminary);
    
    // Calculate lease scenario based on initial buy calculation
    const rentCalculation = calculateRentScenarioForYear(
      year, 
      rentInputs, 
      initialBuyCalculation, 
      previousRentCalculation, 
      preliminary
    );
    
    // Second pass: Calculate final buy scenario with lease cash flow considerations
    const finalBuyCalculation = calculateBuyScenarioForYear(
      year, 
      buyInputs, 
      autoLoanBreakdown, 
      preliminary,
      rentCalculation.cashOutflow,
      previousBuyCalculation
    );
    
    yearlyResults.push({
      year,
      buy: finalBuyCalculation,
      rent: rentCalculation
    });
    
    previousRentCalculation = rentCalculation;
    previousBuyCalculation = finalBuyCalculation;
  }
  
  return {
    preliminary,
    yearlyResults,
    projectionYears: appSettings.projectionYears
  };
}

/**
 * Generate formulas with actual values for display purposes
 */
export function generateCalculationFormulas(
  buyInputs: BuyInputs,
  rentInputs: RentInputs,
  preliminary: PreliminaryCalculations
): CalculationFormulas {
  const P = preliminary.autoLoan.totalLoanAmount;
  const r = buyInputs.autoLoanInterestRateAnnual;
  const n = buyInputs.autoLoanTermYears;
  const i = r / 100 / 12;
  const totalPayments = n * 12;
  
  return {
    monthlyAutoLoanPayment: `M = ${P.toLocaleString()} × [${(i * 100).toFixed(4)}% × (1 + ${(i * 100).toFixed(4)}%)^${totalPayments}] / [(1 + ${(i * 100).toFixed(4)}%)^${totalPayments} - 1] = $${preliminary.autoLoan.monthlyPayment.toLocaleString()}`,
    
  vehicleValueDepreciation: `Vehicle Value = $${buyInputs.carPrice.toLocaleString()} × (1 - ${buyInputs.carDepreciationRate}%)^Year`,
    
    investmentGrowth: `Portfolio Value = (Previous Value + New Investment) × (1 + ${preliminary.investmentReturnRate}%)`,
    
    taxCalculations: {
      autoLoanInterestDeduction: `Tax Savings = Annual Interest × ${buyInputs.marginalTaxRate}% = $X × ${buyInputs.marginalTaxRate}% = $Y`,
      
  vehicleCapitalGains: `Vehicle Tax = max(0, (Sale Price - $${buyInputs.carPrice.toLocaleString()}) - $${preliminary.taxFreeCapitalGainAmount.toLocaleString()}) × ${buyInputs.longTermCapitalGainsTaxRateVehicle}%`,
      
      investmentCapitalGains: `Investment Tax = max(0, Portfolio Value - Total Invested) × ${rentInputs.longTermCapitalGainsTaxRateInvestment}%`
    }
  };
}
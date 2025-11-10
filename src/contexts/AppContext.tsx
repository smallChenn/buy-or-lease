import { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { YearlyCalculation } from "../lib/finance/types";

// Types for investment options
export type InvestmentOption = "SPY" | "QQQ" | "Custom";

export type FilingStatus = "Single" | "Married";

// Buy scenario inputs
export interface BuyInputs {
  // Essential inputs
  vehiclePrice: number;
  downPaymentPercentage: number;
  autoLoanInterestRateAnnual: number;
  loanTermYears: 3 | 5 | 7 | 10;
  vehicleDepreciationRate: number;

  // Advanced inputs - transaction costs
  dealerFeesPercentageBuy: number;
  sellingCostsPercentageSell: number;

  // Advanced inputs - holding costs
  insuranceAndRegistrationRateAnnual: number;
  maintenanceRateAnnual: number;
  fuelCostsAnnual: number;

  // Advanced inputs - tax implications
  marginalTaxRate: number;
  autoLoanInterestDeduction: boolean;
  longTermCapitalGainsTaxRateVehicle: number;
  taxFreeCapitalGainAmount: number;
  filingStatus: FilingStatus;
}

// Lease & invest scenario inputs
export interface RentInputs {
  currentMonthlyLeaseAmount: number;
  leaseGrowthRateAnnual: number;
  sameAsVehicleDepreciation: boolean;
  selectedInvestmentOption: InvestmentOption;
  customInvestmentReturn: number;
  longTermCapitalGainsTaxRateInvestment: number;
}

// App settings
export interface AppSettings {
  currentLanguage: string;
  projectionYears: number;
  showCashOut: boolean;
  showYearlyMode: boolean;
}

// Complete app state
export interface AppState {
  buyInputs: BuyInputs;
  rentInputs: RentInputs;
  appSettings: AppSettings;
  calculations: YearlyCalculation[];
  isCalculationValid: boolean;
}

// Action types with specific field types
export type AppAction =
  | { type: "UPDATE_BUY_INPUT"; field: keyof BuyInputs; value: BuyInputs[keyof BuyInputs] }
  | { type: "UPDATE_RENT_INPUT"; field: keyof RentInputs; value: RentInputs[keyof RentInputs] }
  | { type: "UPDATE_APP_SETTING"; field: keyof AppSettings; value: AppSettings[keyof AppSettings] }
  | { type: "SET_PROJECTION_YEARS"; years: number }
  | { type: "TOGGLE_CASH_OUT_MODE" }
  | { type: "TOGGLE_YEARLY_MODE" }
  | { type: "RECALCULATE" }
  | { type: "LOAD_VEHICLE_DEFAULTS"; vehicleData: Partial<BuyInputs & RentInputs> }
  | {
      type: "LOAD_STATE_FROM_URL";
      state: { buyInputs?: Partial<BuyInputs>; rentInputs?: Partial<RentInputs>; appSettings?: Partial<AppSettings> };
    };

// Default values
const defaultBuyInputs: BuyInputs = {
  // Essential
  vehiclePrice: 35000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 5.5,
  loanTermYears: 5,
  vehicleDepreciationRate: 15, // Cars depreciate, not appreciate

  // Transaction costs
  dealerFeesPercentageBuy: 3,
  sellingCostsPercentageSell: 5,

  // Holding costs
  insuranceAndRegistrationRateAnnual: 2.5,
  maintenanceRateAnnual: 1.5,
  fuelCostsAnnual: 2000,

  // Tax implications
  marginalTaxRate: 24,
  autoLoanInterestDeduction: false, // Usually not deductible for personal use
  longTermCapitalGainsTaxRateVehicle: 15,
  taxFreeCapitalGainAmount: 0, // No tax-free threshold for vehicles
  filingStatus: "Married",
};

const defaultRentInputs: RentInputs = {
  currentMonthlyLeaseAmount: 500,
  leaseGrowthRateAnnual: 3.0,
  sameAsVehicleDepreciation: false,
  selectedInvestmentOption: "SPY",
  customInvestmentReturn: 10,
  longTermCapitalGainsTaxRateInvestment: 15,
};

const defaultAppSettings: AppSettings = {
  currentLanguage: "en",
  projectionYears: 5, // More appropriate for cars (3, 5, 7, 10 years)
  showCashOut: false,
  showYearlyMode: false,
};

const initialState: AppState = {
  buyInputs: defaultBuyInputs,
  rentInputs: defaultRentInputs,
  appSettings: defaultAppSettings,
  calculations: [],
  isCalculationValid: false,
};

// Helper function to get investment return rate
export const getInvestmentReturnRate = (inputs: RentInputs): number => {
  const rates: Record<InvestmentOption, number> = {
    SPY: 12.5,
    QQQ: 16.5,
    Custom: inputs.customInvestmentReturn,
  };
  return rates[inputs.selectedInvestmentOption];
};

// Helper function to get tax-free capital gain amount
// Note: Vehicles don't have tax-free thresholds like homes, so this returns 0
export const getTaxFreeCapitalGainAmount = (filingStatus: FilingStatus): number => {
  // Vehicles don't have the same tax-free capital gains exclusion as primary residences
  return 0;
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "UPDATE_BUY_INPUT": {
      const newBuyInputs = {
        ...state.buyInputs,
        [action.field]: action.value,
      };

      // Update tax-free capital gain amount when filing status changes
      if (action.field === "filingStatus") {
        newBuyInputs.taxFreeCapitalGainAmount = getTaxFreeCapitalGainAmount(action.value as FilingStatus);
      }

      // If vehicle depreciation rate changes and lease is set to follow it, update lease growth rate
      let newRentInputs = state.rentInputs;
      if (action.field === "vehicleDepreciationRate" && state.rentInputs.sameAsVehicleDepreciation) {
        newRentInputs = {
          ...state.rentInputs,
          leaseGrowthRateAnnual: action.value as number,
        };
      }

      // Sync capital gains tax rates between buy and lease inputs
      if (action.field === "longTermCapitalGainsTaxRateVehicle") {
        newRentInputs = {
          ...newRentInputs,
          longTermCapitalGainsTaxRateInvestment: action.value as number,
        };
      }

      return {
        ...state,
        buyInputs: newBuyInputs,
        rentInputs: newRentInputs,
        isCalculationValid: false,
      };
    }

    case "UPDATE_RENT_INPUT": {
      const newRentInputs = {
        ...state.rentInputs,
        [action.field]: action.value,
      };

      // If sameAsVehicleDepreciation is enabled, sync lease growth with vehicle depreciation
      if (action.field === "sameAsVehicleDepreciation" && action.value) {
        newRentInputs.leaseGrowthRateAnnual = state.buyInputs.vehicleDepreciationRate;
      }

      // Sync capital gains tax rates between buy and lease inputs
      let newBuyInputs = state.buyInputs;
      if (action.field === "longTermCapitalGainsTaxRateInvestment") {
        newBuyInputs = {
          ...state.buyInputs,
          longTermCapitalGainsTaxRateVehicle: action.value as number,
        };
      }

      return {
        ...state,
        buyInputs: newBuyInputs,
        rentInputs: newRentInputs,
        isCalculationValid: false,
      };
    }

    case "UPDATE_APP_SETTING":
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          [action.field]: action.value,
        },
      };

    case "SET_PROJECTION_YEARS":
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          projectionYears: action.years,
        },
        isCalculationValid: false,
      };

    case "TOGGLE_CASH_OUT_MODE":
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          showCashOut: !state.appSettings.showCashOut,
        },
      };

    case "TOGGLE_YEARLY_MODE":
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          showYearlyMode: !state.appSettings.showYearlyMode,
        },
      };

    case "LOAD_VEHICLE_DEFAULTS":
      return {
        ...state,
        buyInputs: {
          ...state.buyInputs,
          ...action.vehicleData,
        },
        rentInputs: {
          ...state.rentInputs,
          ...action.vehicleData,
        },
        isCalculationValid: false,
      };

    case "LOAD_STATE_FROM_URL":
      return {
        ...state,
        ...(action.state.buyInputs && { buyInputs: { ...state.buyInputs, ...action.state.buyInputs } }),
        ...(action.state.rentInputs && { rentInputs: { ...state.rentInputs, ...action.state.rentInputs } }),
        ...(action.state.appSettings && { appSettings: { ...state.appSettings, ...action.state.appSettings } }),
        isCalculationValid: false,
      };

    case "RECALCULATE":
      // TODO: Implement actual calculation logic
      // For now, return state with calculations marked as valid
      return {
        ...state,
        isCalculationValid: true,
      };

    default:
      return state;
  }
}

// Context creation
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Convenience functions
  updateBuyInput: (field: keyof BuyInputs, value: BuyInputs[keyof BuyInputs]) => void;
  updateRentInput: (field: keyof RentInputs, value: RentInputs[keyof RentInputs]) => void;
  updateAppSetting: (field: keyof AppSettings, value: AppSettings[keyof AppSettings]) => void;
  loadVehicleDefaults: (vehicleData: Partial<BuyInputs & RentInputs>) => void;
  recalculate: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Convenience functions
  const updateBuyInput = (field: keyof BuyInputs, value: BuyInputs[keyof BuyInputs]) => {
    dispatch({ type: "UPDATE_BUY_INPUT", field, value });
  };

  const updateRentInput = (field: keyof RentInputs, value: RentInputs[keyof RentInputs]) => {
    dispatch({ type: "UPDATE_RENT_INPUT", field, value });
  };

  const updateAppSetting = (field: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    dispatch({ type: "UPDATE_APP_SETTING", field, value });
  };

  const loadVehicleDefaults = (vehicleData: Partial<BuyInputs & RentInputs>) => {
    dispatch({ type: "LOAD_VEHICLE_DEFAULTS", vehicleData });
  };

  const recalculate = () => {
    dispatch({ type: "RECALCULATE" });
  };

  const value: AppContextType = {
    state,
    dispatch,
    updateBuyInput,
    updateRentInput,
    updateAppSetting,
    loadVehicleDefaults,
    recalculate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

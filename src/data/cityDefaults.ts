import type { BuyInputs, RentInputs } from "../contexts/AppContext";

export interface VehicleDefault {
  id: string;
  name: string;
  data: Partial<BuyInputs & RentInputs>;
  children?: VehicleDefault[];
}

export const cityDefaults: VehicleDefault[] = [
  {
    id: "default",
    name: "Default",
    data: {
      vehiclePrice: 35000,
      downPaymentPercentage: 20,
      autoLoanInterestRateAnnual: 5.5,
      loanTermYears: 5,
      vehicleDepreciationRate: 15,
      insuranceAndRegistrationRateAnnual: 2.5,
      maintenanceRateAnnual: 1.5,
      fuelCostsAnnual: 2000,
      currentMonthlyLeaseAmount: 500,
      leaseGrowthRateAnnual: 3.0,
      sameAsVehicleDepreciation: false,
    },
  },
  {
    id: "economy",
    name: "Economy Car",
    data: {
      vehiclePrice: 25000,
      downPaymentPercentage: 20,
      autoLoanInterestRateAnnual: 5.0,
      loanTermYears: 5,
      vehicleDepreciationRate: 20,
      insuranceAndRegistrationRateAnnual: 2.0,
      maintenanceRateAnnual: 1.0,
      fuelCostsAnnual: 1500,
      currentMonthlyLeaseAmount: 350,
      leaseGrowthRateAnnual: 3.0,
      sameAsVehicleDepreciation: false,
    },
  },
  {
    id: "midrange",
    name: "Mid-Range Car",
    data: {
      vehiclePrice: 40000,
      downPaymentPercentage: 20,
      autoLoanInterestRateAnnual: 5.5,
      loanTermYears: 5,
      vehicleDepreciationRate: 15,
      insuranceAndRegistrationRateAnnual: 2.5,
      maintenanceRateAnnual: 1.5,
      fuelCostsAnnual: 2000,
      currentMonthlyLeaseAmount: 550,
      leaseGrowthRateAnnual: 3.0,
      sameAsVehicleDepreciation: false,
    },
  },
  {
    id: "luxury",
    name: "Luxury Car",
    data: {
      vehiclePrice: 60000,
      downPaymentPercentage: 20,
      autoLoanInterestRateAnnual: 6.0,
      loanTermYears: 5,
      vehicleDepreciationRate: 12,
      insuranceAndRegistrationRateAnnual: 3.0,
      maintenanceRateAnnual: 2.0,
      fuelCostsAnnual: 2500,
      currentMonthlyLeaseAmount: 800,
      leaseGrowthRateAnnual: 3.0,
      sameAsVehicleDepreciation: false,
    },
  },
  {
    id: "suv",
    name: "SUV",
    data: {
      vehiclePrice: 45000,
      downPaymentPercentage: 20,
      autoLoanInterestRateAnnual: 5.5,
      loanTermYears: 5,
      vehicleDepreciationRate: 18,
      insuranceAndRegistrationRateAnnual: 2.8,
      maintenanceRateAnnual: 1.8,
      fuelCostsAnnual: 3000,
      currentMonthlyLeaseAmount: 600,
      leaseGrowthRateAnnual: 3.0,
      sameAsVehicleDepreciation: false,
    },
  },
];

export function getCityDefault(id: string): VehicleDefault | undefined {
  const stack: VehicleDefault[] = [...cityDefaults];
  while (stack.length > 0) {
    const current = stack.pop() as VehicleDefault;
    if (current.id === id) {
      return current;
    }
    if (current.children && current.children.length > 0) {
      for (const child of current.children) {
        stack.push(child);
      }
    }
  }
  return undefined;
}

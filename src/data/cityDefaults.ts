import type { BuyInputs, RentInputs } from "../contexts/AppContext";

export interface VehicleDefault {
  id: string;
  name: string;
  data: Partial<BuyInputs & RentInputs>;
  children?: VehicleDefault[];
}

export const vehicleDefaults: VehicleDefault[] = [
  {
    id: "default",
    name: "Default",
    data: {
  carPrice: 35000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 5.5,
  autoLoanTermYears: 5,
  carDepreciationRate: 15,
  insuranceAndRegistrationRateAnnual: 2.5,
  maintenanceAndFuelRateAnnual: 3.5, // 1.5 + 2.0 (fuel)
  registrationAndFuelAnnual: 2000,
  currentMonthlyRentAmount: 500,
  rentGrowthRateAnnual: 3.0,
    },
  },
  {
    id: "economy",
    name: "Economy Car",
    data: {
  carPrice: 25000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 5.0,
  autoLoanTermYears: 5,
  carDepreciationRate: 20,
  insuranceAndRegistrationRateAnnual: 2.0,
  maintenanceAndFuelRateAnnual: 2.5, // 1.0 + 1.5 (fuel)
  registrationAndFuelAnnual: 1500,
  currentMonthlyRentAmount: 350,
  rentGrowthRateAnnual: 3.0,
    },
  },
  {
    id: "midrange",
    name: "Mid-Range Car",
    data: {
  carPrice: 40000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 5.5,
  autoLoanTermYears: 5,
  carDepreciationRate: 15,
  insuranceAndRegistrationRateAnnual: 2.5,
  maintenanceAndFuelRateAnnual: 3.5, // 1.5 + 2.0 (fuel)
  registrationAndFuelAnnual: 2000,
  currentMonthlyRentAmount: 550,
  rentGrowthRateAnnual: 3.0,
    },
  },
  {
    id: "luxury",
    name: "Luxury Car",
    data: {
  carPrice: 60000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 6.0,
  autoLoanTermYears: 5,
  carDepreciationRate: 12,
  insuranceAndRegistrationRateAnnual: 3.0,
  maintenanceAndFuelRateAnnual: 4.5, // 2.0 + 2.5 (fuel)
  registrationAndFuelAnnual: 2500,
  currentMonthlyRentAmount: 800,
  rentGrowthRateAnnual: 3.0,
    },
  },
  {
    id: "suv",
    name: "SUV",
    data: {
  carPrice: 45000,
  downPaymentPercentage: 20,
  autoLoanInterestRateAnnual: 5.5,
  autoLoanTermYears: 5,
  carDepreciationRate: 18,
  insuranceAndRegistrationRateAnnual: 2.8,
  maintenanceAndFuelRateAnnual: 4.8, // 1.8 + 3.0 (fuel)
  registrationAndFuelAnnual: 3000,
  currentMonthlyRentAmount: 600,
  rentGrowthRateAnnual: 3.0,
    },
  },
];

export function getVehicleDefault(id: string): VehicleDefault | undefined {
  const stack: VehicleDefault[] = [...vehicleDefaults];
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

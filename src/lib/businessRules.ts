import type { Vehicle, Driver } from "@/types";

// ============================================
// VEHICLE RULES
// ============================================

export function isVehicleAvailable(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function canDispatchVehicle(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function isRegistrationUnique(
  registrationNumber: string,
  vehicles: Vehicle[],
  excludeId?: string
): boolean {
  return !vehicles.some(
    (v) =>
      v.registration_number.toLowerCase() ===
        registrationNumber.toLowerCase() && v.id !== excludeId
  );
}

// ============================================
// DRIVER RULES
// ============================================

export function isLicenseValid(driver: Driver): boolean {
  return new Date(driver.license_expiry) >= new Date();
}

export function isLicenseExpired(licenseExpiry: string): boolean {
  return new Date(licenseExpiry) < new Date();
}

export function canAssignDriver(driver: Driver): boolean {
  if (driver.status === "suspended") return false;
  if (!isLicenseValid(driver)) return false;
  return driver.status === "available";
}

// ============================================
// TRIP RULES
// ============================================

export function canAssignVehicleToTrip(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function canAssignDriverToTrip(driver: Driver): boolean {
  return canAssignDriver(driver);
}

export function doesCargoExceedCapacity(
  cargoWeight: number,
  vehicleCapacity: number
): boolean {
  return cargoWeight > vehicleCapacity;
}

export function validateTripCreation(
  vehicle: Vehicle,
  driver: Driver,
  cargoWeight: number
): { valid: boolean; error?: string } {
  if (!canAssignVehicleToTrip(vehicle)) {
    return {
      valid: false,
      error: `Vehicle is not available (status: ${vehicle.status})`,
    };
  }

  if (driver.status === "suspended") {
    return { valid: false, error: "Driver is suspended" };
  }
  if (!isLicenseValid(driver)) {
    return { valid: false, error: "Driver license has expired" };
  }
  if (driver.status !== "available") {
    return {
      valid: false,
      error: `Driver is not available (status: ${driver.status})`,
    };
  }

  if (doesCargoExceedCapacity(cargoWeight, vehicle.capacity)) {
    return {
      valid: false,
      error: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.capacity}kg)`,
    };
  }

  return { valid: true };
}

// ============================================
// STATUS TRANSITIONS
// ============================================

export function dispatchTrip(
  vehicle: Vehicle,
  driver: Driver
): { vehicleUpdate: Partial<Vehicle>; driverUpdate: Partial<Driver> } {
  return {
    vehicleUpdate: { status: "on_trip" },
    driverUpdate: { status: "on_trip" },
  };
}

export function completeTrip(
  vehicle: Vehicle,
  driver: Driver
): { vehicleUpdate: Partial<Vehicle>; driverUpdate: Partial<Driver> } {
  return {
    vehicleUpdate: { status: "available" },
    driverUpdate: { status: "available" },
  };
}

export function cancelTrip(
  vehicle: Vehicle,
  driver: Driver
): { vehicleUpdate: Partial<Vehicle>; driverUpdate: Partial<Driver> } {
  return {
    vehicleUpdate: { status: "available" },
    driverUpdate: { status: "available" },
  };
}

// ============================================
// MAINTENANCE RULES
// ============================================

export function startMaintenance(
  vehicle: Vehicle
): { vehicleUpdate: Partial<Vehicle> } {
  return { vehicleUpdate: { status: "in_shop" } };
}

export function closeMaintenance(
  vehicle: Vehicle
): { vehicleUpdate: Partial<Vehicle> } {
  if (vehicle.status === "retired") {
    return { vehicleUpdate: {} };
  }
  return { vehicleUpdate: { status: "available" } };
}

// ============================================
// ANALYTICS
// ============================================

export function computeFleetUtilization(
  activeVehicles: number,
  totalVehicles: number
): number {
  if (totalVehicles === 0) return 0;
  return Math.round((activeVehicles / totalVehicles) * 100);
}

export function computeFuelEfficiency(
  distance: number,
  fuelUsed: number
): number {
  if (fuelUsed === 0) return 0;
  return Math.round((distance / fuelUsed) * 100) / 100;
}

export function computeOperationalCost(
  totalFuelCost: number,
  totalMaintenanceCost: number,
  totalExpenseCost: number
): number {
  return totalFuelCost + totalMaintenanceCost + totalExpenseCost;
}

export function computeVehicleROI(
  revenue: number,
  expenses: number,
  acquisitionCost: number
): number {
  if (acquisitionCost === 0) return 0;
  return Math.round(((revenue - expenses) / acquisitionCost) * 10000) / 100;
}

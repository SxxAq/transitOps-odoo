import type { Vehicle, Driver } from "@/types";

export function canDispatchVehicle(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function isLicenseExpired(licenseExpiry: string): boolean {
  return new Date(licenseExpiry) < new Date();
}

export function canAssignDriver(driver: Driver): boolean {
  if (driver.status === "suspended") return false;
  if (isLicenseExpired(driver.license_expiry)) return false;
  return driver.status === "available";
}

export function canAssignVehicleToTrip(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function canAssignDriverToTrip(driver: Driver): boolean {
  return canAssignDriver(driver);
}

export function doesCargoExceedCapacity(cargoWeight: number, vehicleCapacity: number): boolean {
  return cargoWeight > vehicleCapacity;
}

export function validateTripCreation(
  vehicle: Vehicle,
  driver: Driver,
  cargoWeight: number
): { valid: boolean; error?: string } {
  if (!canAssignVehicleToTrip(vehicle)) {
    return { valid: false, error: `Vehicle is not available (status: ${vehicle.status})` };
  }
  if (!canAssignDriverToTrip(driver)) {
    if (driver.status === "suspended") {
      return { valid: false, error: "Driver is suspended" };
    }
    if (new Date(driver.license_expiry) < new Date()) {
      return { valid: false, error: "Driver license has expired" };
    }
    return { valid: false, error: `Driver is not available (status: ${driver.status})` };
  }
  if (doesCargoExceedCapacity(cargoWeight, vehicle.capacity)) {
    return { valid: false, error: `Cargo weight (${cargoWeight}) exceeds vehicle capacity (${vehicle.capacity})` };
  }
  return { valid: true };
}

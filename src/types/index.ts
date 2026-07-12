export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";
export type MaintenanceStatus = "open" | "closed";
export type ExpenseType = "toll" | "maintenance" | "miscellaneous";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  model: string;
  type: string;
  capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region?: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  contact: string;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  driver_id: string;
  source: string;
  destination: string;
  cargo_weight: number;
  planned_distance: number;
  fuel_used: number;
  final_odometer: number;
  status: TripStatus;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  title: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  created_at: string;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  litres: number;
  cost: number;
  date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

export interface DashboardStats {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInShop: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

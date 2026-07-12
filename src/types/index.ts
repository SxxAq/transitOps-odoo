export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
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
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  planned_distance: number;
  status: TripStatus;
  dispatched_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  description: string;
  start_date: string;
  end_date: string | null;
  cost: number;
  status: "open" | "closed";
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
  type: "toll" | "maintenance" | "miscellaneous";
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

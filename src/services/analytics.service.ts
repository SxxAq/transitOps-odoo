import { createClient } from "@/lib/supabase/client";
import type { Vehicle, Driver, Trip, Expense, FuelLog, MaintenanceRecord } from "@/types";

export interface AnalyticsData {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = createClient();

  const [vehicles, drivers, trips, expenses, fuelLogs, maintenance] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("drivers").select("*"),
    supabase.from("trips").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("fuel_logs").select("*"),
    supabase.from("maintenance").select("*"),
  ]);

  const firstError = [vehicles, drivers, trips, expenses, fuelLogs, maintenance].find(
    (r) => r.error
  )?.error;

  if (firstError) throw firstError;

  return {
    vehicles: vehicles.data ?? [],
    drivers: drivers.data ?? [],
    trips: trips.data ?? [],
    expenses: expenses.data ?? [],
    fuelLogs: fuelLogs.data ?? [],
    maintenance: maintenance.data ?? [],
  };
}

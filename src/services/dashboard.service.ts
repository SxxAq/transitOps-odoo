import { createClient } from "@/lib/supabase/client";
import type { Vehicle, Driver, Trip, FuelLog, MaintenanceRecord, Expense } from "@/types";

export interface DashboardData {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
  expenses: Expense[];
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  vehiclesOnTrip: number;
  vehiclesInShop: number;
  vehiclesRetired: number;
  totalDrivers: number;
  driversOnDuty: number;
  driversAvailable: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalTrips: number;
  fleetUtilization: number;
}

export interface ChartData {
  vehicleStatus: { name: string; value: number; fill: string }[];
  tripStatus: { name: string; value: number; fill: string }[];
  monthlyFuelCost: { month: string; cost: number }[];
  monthlyOperationalCost: { month: string; fuel: number; maintenance: number; expenses: number }[];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createClient();

  const [vehiclesRes, driversRes, tripsRes, fuelRes, maintRes, expRes] =
    await Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("drivers").select("*"),
      supabase.from("trips").select("*"),
      supabase.from("fuel_logs").select("*"),
      supabase.from("maintenance").select("*"),
      supabase.from("expenses").select("*"),
    ]);

  return {
    vehicles: (vehiclesRes.data as Vehicle[]) ?? [],
    drivers: (driversRes.data as Driver[]) ?? [],
    trips: (tripsRes.data as Trip[]) ?? [],
    fuelLogs: (fuelRes.data as FuelLog[]) ?? [],
    maintenance: (maintRes.data as MaintenanceRecord[]) ?? [],
    expenses: (expRes.data as Expense[]) ?? [],
  };
}

export function computeStats(data: DashboardData): DashboardStats {
  const { vehicles, drivers, trips } = data;
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(
    (v) => v.status === "available" || v.status === "on_trip"
  ).length;

  return {
    totalVehicles,
    activeVehicles,
    availableVehicles: vehicles.filter((v) => v.status === "available").length,
    vehiclesOnTrip: vehicles.filter((v) => v.status === "on_trip").length,
    vehiclesInShop: vehicles.filter((v) => v.status === "in_shop").length,
    vehiclesRetired: vehicles.filter((v) => v.status === "retired").length,
    totalDrivers: drivers.length,
    driversOnDuty: drivers.filter((d) => d.status === "on_trip").length,
    driversAvailable: drivers.filter((d) => d.status === "available").length,
    activeTrips: trips.filter((t) => t.status === "dispatched").length,
    pendingTrips: trips.filter((t) => t.status === "draft").length,
    completedTrips: trips.filter((t) => t.status === "completed").length,
    cancelledTrips: trips.filter((t) => t.status === "cancelled").length,
    totalTrips: trips.length,
    fleetUtilization:
      totalVehicles === 0
        ? 0
        : Math.round((activeVehicles / totalVehicles) * 100),
  };
}

export function computeChartData(data: DashboardData): ChartData {
  const { vehicles, trips, fuelLogs, maintenance, expenses } = data;

  const vehicleStatus = [
    { name: "Available", value: vehicles.filter((v) => v.status === "available").length, fill: "#22c55e" },
    { name: "On Trip", value: vehicles.filter((v) => v.status === "on_trip").length, fill: "#3b82f6" },
    { name: "In Shop", value: vehicles.filter((v) => v.status === "in_shop").length, fill: "#f97316" },
    { name: "Retired", value: vehicles.filter((v) => v.status === "retired").length, fill: "#9ca3af" },
  ];

  const tripStatus = [
    { name: "Draft", value: trips.filter((t) => t.status === "draft").length, fill: "#eab308" },
    { name: "Dispatched", value: trips.filter((t) => t.status === "dispatched").length, fill: "#3b82f6" },
    { name: "Completed", value: trips.filter((t) => t.status === "completed").length, fill: "#22c55e" },
    { name: "Cancelled", value: trips.filter((t) => t.status === "cancelled").length, fill: "#ef4444" },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const fuelByMonth = new Map<string, number>();
  fuelLogs.forEach((log) => {
    const d = new Date(log.date);
    const key = months[d.getMonth()];
    fuelByMonth.set(key, (fuelByMonth.get(key) ?? 0) + log.cost);
  });

  const maintByMonth = new Map<string, number>();
  maintenance.forEach((m) => {
    const d = new Date(m.created_at);
    const key = months[d.getMonth()];
    maintByMonth.set(key, (maintByMonth.get(key) ?? 0) + m.cost);
  });

  const expByMonth = new Map<string, number>();
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = months[d.getMonth()];
    expByMonth.set(key, (expByMonth.get(key) ?? 0) + e.amount);
  });

  const currentMonth = new Date().getMonth();
  const monthlyFuelCost = months
    .slice(0, currentMonth + 1)
    .map((m) => ({ month: m, cost: fuelByMonth.get(m) ?? 0 }));

  const monthlyOperationalCost = months
    .slice(0, currentMonth + 1)
    .map((m) => ({
      month: m,
      fuel: fuelByMonth.get(m) ?? 0,
      maintenance: maintByMonth.get(m) ?? 0,
      expenses: expByMonth.get(m) ?? 0,
    }));

  return { vehicleStatus, tripStatus, monthlyFuelCost, monthlyOperationalCost };
}

export function getDashboardStats() {
  return fetchDashboardData().then((data) => ({
    stats: computeStats(data),
    charts: computeChartData(data),
    raw: data,
  }));
}

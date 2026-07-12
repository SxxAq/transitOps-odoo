import { createClient } from "@/lib/supabase/client";
import type { Vehicle, Driver, Trip, FuelLog, MaintenanceRecord } from "@/types";

export async function getDashboardStats() {
  const supabase = createClient();

  const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("drivers").select("*"),
    supabase.from("trips").select("*"),
  ]);

  const vehicles: Vehicle[] = vehiclesRes.data ?? [];
  const drivers: Driver[] = driversRes.data ?? [];
  const trips: Trip[] = tripsRes.data ?? [];

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(
    (v) => v.status === "available" || v.status === "on_trip"
  ).length;
  const availableVehicles = vehicles.filter((v) => v.status === "available").length;
  const vehiclesOnTrip = vehicles.filter((v) => v.status === "on_trip").length;
  const vehiclesInShop = vehicles.filter((v) => v.status === "in_shop").length;
  const vehiclesRetired = vehicles.filter((v) => v.status === "retired").length;

  const totalDrivers = drivers.length;
  const driversOnDuty = drivers.filter(
    (d) => d.status === "on_trip"
  ).length;
  const driversAvailable = drivers.filter((d) => d.status === "available").length;

  const activeTrips = trips.filter((t) => t.status === "dispatched").length;
  const pendingTrips = trips.filter((t) => t.status === "draft").length;
  const completedTrips = trips.filter((t) => t.status === "completed").length;
  const cancelledTrips = trips.filter((t) => t.status === "cancelled").length;
  const totalTrips = trips.length;

  const fleetUtilization =
    totalVehicles === 0 ? 0 : Math.round((activeVehicles / totalVehicles) * 100);

  return {
    totalVehicles,
    activeVehicles,
    availableVehicles,
    vehiclesOnTrip,
    vehiclesInShop,
    vehiclesRetired,
    totalDrivers,
    driversOnDuty,
    driversAvailable,
    activeTrips,
    pendingTrips,
    completedTrips,
    cancelledTrips,
    totalTrips,
    fleetUtilization,
  };
}

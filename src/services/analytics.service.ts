import { createClient } from "@/lib/supabase/client";
import type { Vehicle, Driver, Trip, FuelLog, MaintenanceRecord, Expense } from "@/types";

export interface VehicleBreakdown {
  vehicleId: string;
  regNumber: string;
  model: string;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  trips: number;
  distance: number;
  fuelUsed: number;
  efficiency: number;
}

export interface AnalyticsData {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
  expenses: Expense[];
  fuelEfficiency: number;
  operationalCost: number;
  fleetUtilization: number;
  vehicleROI: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalExpenseCost: number;
  totalRevenue: number;
  totalDistance: number;
  totalFuelLitres: number;
  vehicleBreakdown: VehicleBreakdown[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = createClient();

  const [vehiclesRes, driversRes, tripsRes, fuelRes, maintRes, expRes] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("drivers").select("*"),
    supabase.from("trips").select("*"),
    supabase.from("fuel_logs").select("*"),
    supabase.from("maintenance").select("*"),
    supabase.from("expenses").select("*"),
  ]);

  const vehicles: Vehicle[] = (vehiclesRes.data as Vehicle[]) ?? [];
  const drivers: Driver[] = (driversRes.data as Driver[]) ?? [];
  const trips: Trip[] = (tripsRes.data as Trip[]) ?? [];
  const fuelLogs: FuelLog[] = (fuelRes.data as FuelLog[]) ?? [];
  const maintenance: MaintenanceRecord[] = (maintRes.data as MaintenanceRecord[]) ?? [];
  const expenses: Expense[] = (expRes.data as Expense[]) ?? [];

  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalExpenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;

  const totalDistance = trips
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.planned_distance, 0);
  const totalFuelLitres = fuelLogs.reduce((sum, l) => sum + l.litres, 0);

  const fuelEfficiency =
    totalFuelLitres === 0 ? 0 : Math.round((totalDistance / totalFuelLitres) * 100) / 100;

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(
    (v) => v.status === "available" || v.status === "on_trip"
  ).length;
  const fleetUtilization =
    totalVehicles === 0 ? 0 : Math.round((activeVehicles / totalVehicles) * 100);

  const totalAcquisitionCost = vehicles.reduce(
    (sum, v) => sum + v.acquisition_cost,
    0
  );
  const revenue = totalDistance * 2.5;
  const vehicleROI =
    totalAcquisitionCost === 0
      ? 0
      : Math.round(((revenue - operationalCost) / totalAcquisitionCost) * 10000) / 100;

  const vehicleBreakdown = vehicles
    .filter((v) => v.status !== "retired")
    .map((v) => {
      const vFuel = fuelLogs.filter((l) => l.vehicle_id === v.id);
      const vMaint = maintenance.filter((m) => m.vehicle_id === v.id);
      const vExp = expenses.filter((e) => e.vehicle_id === v.id);
      const vTrips = trips.filter(
        (t) => t.vehicle_id === v.id && t.status === "completed"
      );

      const fuelCost = vFuel.reduce((s, l) => s + l.cost, 0);
      const mCost = vMaint.reduce((s, m) => s + m.cost, 0);
      const eCost = vExp.reduce((s, e) => s + e.amount, 0);
      const dist = vTrips.reduce((s, t) => s + t.planned_distance, 0);
      const litres = vFuel.reduce((s, l) => s + l.litres, 0);

      return {
        vehicleId: v.id,
        regNumber: v.registration_number,
        model: v.model,
        fuelCost,
        maintenanceCost: mCost,
        expenseCost: eCost,
        totalCost: fuelCost + mCost + eCost,
        trips: vTrips.length,
        distance: dist,
        fuelUsed: litres,
        efficiency: litres === 0 ? 0 : Math.round((dist / litres) * 100) / 100,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  return {
    vehicles,
    drivers,
    trips,
    fuelLogs,
    maintenance,
    expenses,
    fuelEfficiency,
    operationalCost,
    fleetUtilization,
    vehicleROI,
    totalFuelCost,
    totalMaintenanceCost,
    totalExpenseCost,
    totalRevenue: revenue,
    totalDistance,
    totalFuelLitres,
    vehicleBreakdown,
  };
}

export function downloadAllCSV(data: AnalyticsData) {
  const lines: string[] = [];

  lines.push("TransitOps Analytics Report");
  lines.push(`Generated,${new Date().toLocaleDateString()}`);
  lines.push("");

  lines.push("=== KPI Summary ===");
  lines.push("Metric,Value");
  lines.push(`Total Vehicles,${data.vehicles.length}`);
  lines.push(`Total Drivers,${data.drivers.length}`);
  lines.push(`Total Trips,${data.trips.length}`);
  lines.push(`Completed Trips,${data.trips.filter((t) => t.status === "completed").length}`);
  lines.push(`Fuel Efficiency,${data.fuelEfficiency} km/L`);
  lines.push(`Fleet Utilization,${data.fleetUtilization}%`);
  lines.push(`Operational Cost,₹${data.operationalCost.toFixed(2)}`);
  lines.push(`Vehicle ROI,${data.vehicleROI}%`);
  lines.push(`Total Revenue (est),"₹${data.totalRevenue.toLocaleString()}"`);
  lines.push("");

  lines.push("=== Vehicle Breakdown ===");
  lines.push("Registration,Model,Fuel Cost,Maintenance Cost,Expense Cost,Total Cost,Trips,Distance (km),Fuel (L),Efficiency (km/L)");
  data.vehicleBreakdown.forEach((v) => {
    lines.push(
      `${v.regNumber},${v.model},₹${v.fuelCost.toFixed(2)},₹${v.maintenanceCost.toFixed(2)},₹${v.expenseCost.toFixed(2)},₹${v.totalCost.toFixed(2)},${v.trips},${v.distance},${v.fuelUsed},${v.efficiency}`
    );
  });
  lines.push("");

  lines.push("=== Driver Performance ===");
  lines.push("Name,License,Category,Score,Status,License Expiry");
  data.drivers.forEach((d) => {
    lines.push(
      `${d.name},${d.license_number},${d.license_category},${d.safety_score},${d.status},${d.license_expiry}`
    );
  });
  lines.push("");

  lines.push("=== Trip Log ===");
  lines.push("Source,Destination,Status,Distance (km),Cargo (kg),Dispatched,Completed");
  data.trips.forEach((t) => {
    lines.push(
      `${t.source},${t.destination},${t.status},${t.planned_distance},${t.cargo_weight},${t.dispatched_at ?? ""},${t.completed_at ?? ""}`
    );
  });
  lines.push("");

  lines.push("=== Expenses ===");
  lines.push("Type,Amount,Description,Date,Vehicle ID");
  data.expenses.forEach((e) => {
    lines.push(`${e.type},₹${e.amount.toFixed(2)},${e.description},${e.date},${e.vehicle_id}`);
  });
  lines.push("");

  lines.push("=== Fuel Logs ===");
  lines.push("Vehicle ID,Litres,Cost,Date");
  data.fuelLogs.forEach((f) => {
    lines.push(`${f.vehicle_id},${f.litres},₹${f.cost.toFixed(2)},${f.date}`);
  });
  lines.push("");

  lines.push("=== Maintenance Records ===");
  lines.push("Vehicle ID,Title,Description,Cost,Status");
  data.maintenance.forEach((m) => {
    lines.push(
      `${m.vehicle_id},${m.title},${m.description},₹${m.cost.toFixed(2)},${m.status}`
    );
  });

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transitops-analytics-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

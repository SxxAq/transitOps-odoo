import { createClient } from "@/lib/supabase/client";
import type { Vehicle, Trip, FuelLog, MaintenanceRecord, Expense } from "@/types";

export interface AnalyticsData {
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
  vehicleBreakdown: {
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
  }[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = createClient();

  const [vehiclesRes, tripsRes, fuelRes, maintRes, expRes] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("trips").select("*"),
    supabase.from("fuel_logs").select("*"),
    supabase.from("maintenance").select("*"),
    supabase.from("expenses").select("*"),
  ]);

  const vehicles: Vehicle[] = (vehiclesRes.data as Vehicle[]) ?? [];
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

export function generateCSV(data: AnalyticsData): string {
  const rows = [
    ["Metric", "Value"],
    ["Total Fuel Cost", `₹${data.totalFuelCost.toFixed(2)}`],
    ["Total Maintenance Cost", `₹${data.totalMaintenanceCost.toFixed(2)}`],
    ["Total Expenses", `₹${data.totalExpenseCost.toFixed(2)}`],
    ["Operational Cost", `₹${data.operationalCost.toFixed(2)}`],
    ["Fuel Efficiency (km/L)", data.fuelEfficiency.toString()],
    ["Fleet Utilization", `${data.fleetUtilization}%`],
    ["Vehicle ROI", `${data.vehicleROI}%`],
    ["Total Distance (km)", data.totalDistance.toString()],
    ["Total Fuel (L)", data.totalFuelLitres.toString()],
    [],
    ["Vehicle Breakdown"],
    [
      "Registration",
      "Model",
      "Fuel Cost",
      "Maintenance Cost",
      "Expense Cost",
      "Total Cost",
      "Trips",
      "Distance (km)",
      "Fuel (L)",
      "Efficiency (km/L)",
    ],
    ...data.vehicleBreakdown.map((v) => [
      v.regNumber,
      v.model,
      `₹${v.fuelCost.toFixed(2)}`,
      `₹${v.maintenanceCost.toFixed(2)}`,
      `₹${v.expenseCost.toFixed(2)}`,
      `₹${v.totalCost.toFixed(2)}`,
      v.trips.toString(),
      v.distance.toString(),
      v.fuelUsed.toString(),
      v.efficiency.toString(),
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

export function downloadCSV(data: AnalyticsData) {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transitops-analytics-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

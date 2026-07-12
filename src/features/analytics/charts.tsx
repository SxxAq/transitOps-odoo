"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vehicle, Driver, Trip, Expense, FuelLog, MaintenanceRecord } from "@/types";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name: any, props: any) => [string, string];

interface ChartsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
}

function countByStatus<T extends { status: string }>(items: T[], statuses: string[]) {
  return statuses.map((status) => ({
    name: status.replace("_", " "),
    value: items.filter((i) => i.status === status).length,
  }));
}

function countByMonth(items: { created_at: string }[], months = 6) {
  const now = new Date();
  const result: { month: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = items.filter((item) => {
      const created = new Date(item.created_at);
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
    }).length;
    result.push({ month: label, count });
  }
  return result;
}

function sumByMonth(items: { date: string; amount: number }[], months = 6) {
  const now = new Date();
  const result: { month: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const total = items
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      })
      .reduce((sum, item) => sum + item.amount, 0);
    result.push({ month: label, total: Math.round(total * 100) / 100 });
  }
  return result;
}

function expensesByType(expenses: Expense[]) {
  const types = ["toll", "maintenance", "miscellaneous"] as const;
  return types.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: expenses.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0),
  }));
}

function safetyDistribution(drivers: Driver[]) {
  const ranges = [
    { label: "0-29", min: 0, max: 29 },
    { label: "30-49", min: 30, max: 49 },
    { label: "50-69", min: 50, max: 69 },
    { label: "70-89", min: 70, max: 89 },
    { label: "90-100", min: 90, max: 100 },
  ];
  return ranges.map((r) => ({
    name: r.label,
    count: drivers.filter((d) => d.safety_score >= r.min && d.safety_score <= r.max).length,
  }));
}

function topVehiclesByExpense(vehicles: Vehicle[], expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    map.set(e.vehicle_id, (map.get(e.vehicle_id) || 0) + e.amount);
  });
  return vehicles
    .map((v) => ({
      name: v.registration_number,
      total: Math.round((map.get(v.id) || 0) * 100) / 100,
    }))
    .filter((v) => v.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

function maintenanceCostByVehicle(vehicles: Vehicle[], maintenance: MaintenanceRecord[]) {
  const map = new Map<string, number>();
  maintenance.forEach((m) => {
    map.set(m.vehicle_id, (map.get(m.vehicle_id) || 0) + m.cost);
  });
  return vehicles
    .map((v) => ({
      name: v.registration_number,
      cost: Math.round((map.get(v.id) || 0) * 100) / 100,
    }))
    .filter((v) => v.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8);
}

function fuelConsumptionByVehicle(vehicles: Vehicle[], fuelLogs: FuelLog[]) {
  const map = new Map<string, { litres: number; cost: number }>();
  fuelLogs.forEach((f) => {
    const existing = map.get(f.vehicle_id) || { litres: 0, cost: 0 };
    map.set(f.vehicle_id, {
      litres: existing.litres + f.litres,
      cost: existing.cost + f.cost,
    });
  });
  return vehicles
    .map((v) => ({
      name: v.registration_number,
      litres: Math.round((map.get(v.id)?.litres || 0) * 100) / 100,
      cost: Math.round((map.get(v.id)?.cost || 0) * 100) / 100,
    }))
    .filter((v) => v.litres > 0)
    .sort((a, b) => b.litres - a.litres)
    .slice(0, 8);
}

export function AnalyticsCharts({
  vehicles,
  drivers,
  trips,
  expenses,
  fuelLogs,
  maintenance,
}: ChartsProps) {
  const vehicleStatusData = countByStatus(vehicles, ["available", "on_trip", "in_shop", "retired"]);
  const tripStatusData = countByStatus(trips, ["draft", "dispatched", "completed", "cancelled"]);
  const monthlyTrips = countByMonth(trips);
  const monthlyExpenses = sumByMonth(
    expenses.map((e) => ({ date: e.date, amount: e.amount }))
  );
  const monthlyFuel = sumByMonth(
    fuelLogs.map((f) => ({ date: f.date, amount: f.cost }))
  );
  const expenseTypeData = expensesByType(expenses);
  const safetyData = safetyDistribution(drivers);
  const topExpenseVehicles = topVehiclesByExpense(vehicles, expenses);
  const maintenanceByVehicle = maintenanceCostByVehicle(vehicles, maintenance);
  const fuelByVehicle = fuelConsumptionByVehicle(vehicles, fuelLogs);

  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Vehicle & Trip Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No vehicle data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {vehicleStatusData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trip Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No trip data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tripStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {tripStatusData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Monthly Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyTrips}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={((value: number) => [`$${Number(value).toLocaleString()}`, "Expenses"]) as TooltipFormatter} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444" }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Financial Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {totalExpenseAmount === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expense data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expenseTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {expenseTypeData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={((value: number) => [`$${Number(value).toLocaleString()}`, "Amount"]) as TooltipFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Fuel Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyFuel}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={((value: number) => [`$${Number(value).toLocaleString()}`, "Fuel Cost"]) as TooltipFormatter} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b" }}
                  name="Fuel Cost"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Vehicle Costs & Driver Safety */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Vehicles by Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {topExpenseVehicles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expense data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topExpenseVehicles} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip formatter={((value: number) => [`$${Number(value).toLocaleString()}`, "Total"]) as TooltipFormatter} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Driver Safety Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No driver data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={safetyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Drivers" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Maintenance & Fuel per Vehicle */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Cost by Vehicle</CardTitle>
            <p className="text-xs text-muted-foreground">
              Total: ${totalMaintenanceCost.toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            {maintenanceByVehicle.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No maintenance data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={maintenanceByVehicle} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip formatter={((value: number) => [`$${Number(value).toLocaleString()}`, "Cost"]) as TooltipFormatter} />
                  <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} name="Maintenance Cost" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuel Consumption by Vehicle</CardTitle>
            <p className="text-xs text-muted-foreground">
              Total: ${totalFuelCost.toLocaleString()} |{" "}
              {fuelLogs.reduce((sum, f) => sum + f.litres, 0).toLocaleString()} litres
            </p>
          </CardHeader>
          <CardContent>
            {fuelByVehicle.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No fuel data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={fuelByVehicle}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="litres" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Litres" />
                  <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

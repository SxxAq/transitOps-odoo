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
import type { Vehicle, Driver, Trip, Expense, FuelLog, MaintenanceRecord } from "@/types";

const PALETTE = ["#1e40af", "#0d9488", "#d97706", "#7c3aed", "#dc2626", "#059669", "#6366f1"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name: any, props: any) => [string, string];
const inrFmt: TooltipFormatter = (v) => [`₹${Number(v).toLocaleString()}`, ""];
const inrLabelFmt: TooltipFormatter = (v, n) => [`₹${Number(v).toLocaleString()}`, String(n)];

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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function PieLabel(props: { name?: string; percent?: number }) {
  return `${props.name ?? ""} (${((props.percent ?? 0) * 100).toFixed(0)}%)`;
}

interface ChartsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceRecord[];
  vehicleBreakdown: {
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

// ====== OVERVIEW CHARTS ======

export function OverviewCharts({ vehicles, trips }: Pick<ChartsProps, "vehicles" | "trips">) {
  const vehicleStatusData = countByStatus(vehicles, ["available", "on_trip", "in_shop", "retired"]);
  const tripStatusData = countByStatus(trips, ["draft", "dispatched", "completed", "cancelled"]);
  const monthlyTrips = countByMonth(trips);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartCard title="Fleet Status" subtitle="Vehicles by current status">
        {vehicles.length === 0 ? (
          <Empty text="No vehicle data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={vehicleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={PieLabel}
                strokeWidth={0}
              >
                {vehicleStatusData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Trip Pipeline" subtitle="Trips by status">
        {trips.length === 0 ? (
          <Empty text="No trip data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={tripStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={PieLabel}
                strokeWidth={0}
              >
                {tripStatusData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="md:col-span-2">
        <ChartCard title="Monthly Trip Volume" subtitle="Trips created per month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrips}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ====== FINANCIAL CHARTS ======

export function FinancialCharts({
  expenses,
  fuelLogs,
  vehicleBreakdown,
}: Pick<ChartsProps, "expenses" | "fuelLogs" | "vehicleBreakdown">) {
  const types = ["toll", "maintenance", "miscellaneous"] as const;
  const expenseTypeData = types.map((type) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: expenses.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0),
  }));

  const monthlyExpenses = sumByMonth(
    expenses.map((e) => ({ date: e.date, amount: e.amount }))
  );
  const monthlyFuel = sumByMonth(
    fuelLogs.map((f) => ({ date: f.date, amount: f.cost }))
  );

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);

  const topExpenseVehicles = vehicleBreakdown
    .filter((v) => v.totalCost > 0)
    .slice(0, 8)
    .map((v) => ({ name: v.regNumber, total: v.totalCost }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartCard title="Expenses by Category" subtitle="Breakdown of all expenses">
        {totalExpenseAmount === 0 ? (
          <Empty text="No expense data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseTypeData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={PieLabel}
                strokeWidth={0}
              >
                {expenseTypeData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={inrLabelFmt} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Monthly Expenses"
        subtitle={`Total: ₹${totalExpenseAmount.toLocaleString()}`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyExpenses}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
            <YAxis fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
            <Tooltip formatter={inrFmt} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ fill: "#dc2626", r: 3 }}
              activeDot={{ r: 5 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Monthly Fuel Costs"
        subtitle={`Total: ₹${totalFuelCost.toLocaleString()}`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyFuel}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
            <YAxis fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
            <Tooltip formatter={inrFmt} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#d97706"
              strokeWidth={2}
              dot={{ fill: "#d97706", r: 3 }}
              activeDot={{ r: 5 }}
              name="Fuel Cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Vehicles by Cost" subtitle="Fuel + maintenance + expenses">
        {topExpenseVehicles.length === 0 ? (
          <Empty text="No cost data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topExpenseVehicles} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={90} className="text-muted-foreground" />
              <Tooltip formatter={inrFmt} />
              <Bar dataKey="total" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Total Cost" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// ====== FLEET CHARTS ======

export function FleetCharts({
  fuelLogs,
  maintenance,
  vehicleBreakdown,
}: Pick<ChartsProps, "fuelLogs" | "maintenance" | "vehicleBreakdown">) {
  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalFuelLitres = fuelLogs.reduce((sum, f) => sum + f.litres, 0);

  const maintenanceByVehicle = vehicleBreakdown
    .filter((v) => v.maintenanceCost > 0)
    .slice(0, 8)
    .map((v) => ({ name: v.regNumber, cost: v.maintenanceCost }));

  const fuelByVehicle = vehicleBreakdown
    .filter((v) => v.fuelUsed > 0)
    .slice(0, 8)
    .map((v) => ({ name: v.regNumber, litres: v.fuelUsed, cost: v.fuelCost }));

  return (
    <div className="space-y-6">
      {vehicleBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-sm font-semibold">Vehicle Performance</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Per-vehicle cost and efficiency breakdown
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Trips</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Distance</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel (L)</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Efficiency</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuel Cost</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Maint.</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Other</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {vehicleBreakdown.map((v) => (
                  <tr key={v.regNumber} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium">{v.regNumber}</div>
                      <div className="text-xs text-muted-foreground">{v.model}</div>
                    </td>
                    <td className="px-6 py-3 text-right">{v.trips}</td>
                    <td className="px-6 py-3 text-right">{v.distance.toLocaleString()} km</td>
                    <td className="px-6 py-3 text-right">{v.fuelUsed} L</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                          v.efficiency > 10
                            ? "bg-emerald-500/10 text-emerald-600"
                            : v.efficiency > 5
                            ? "bg-amber-500/10 text-amber-600"
                            : v.efficiency === 0
                            ? "bg-muted text-muted-foreground"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {v.efficiency} km/L
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">₹{v.fuelCost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">₹{v.maintenanceCost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">₹{v.expenseCost.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-semibold">
                      ₹{v.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Maintenance by Vehicle"
          subtitle={`Total: ₹${totalMaintenanceCost.toLocaleString()}`}
        >
          {maintenanceByVehicle.length === 0 ? (
            <Empty text="No maintenance data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={maintenanceByVehicle} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} width={90} className="text-muted-foreground" />
                <Tooltip formatter={inrFmt} />
                <Bar dataKey="cost" fill="#dc2626" radius={[0, 4, 4, 0]} name="Maintenance Cost" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Fuel Consumption"
          subtitle={`${totalFuelLitres.toLocaleString()}L total · ₹${totalFuelCost.toLocaleString()} cost`}
        >
          {fuelByVehicle.length === 0 ? (
            <Empty text="No fuel data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={fuelByVehicle}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="litres" fill="#1e40af" radius={[4, 4, 0, 0]} name="Litres" />
                <Bar dataKey="cost" fill="#d97706" radius={[4, 4, 0, 0]} name="Cost (₹)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ====== DRIVER CHARTS ======

export function DriverCharts({ drivers }: Pick<ChartsProps, "drivers">) {
  const ranges = [
    { label: "0-29", min: 0, max: 29, color: "#dc2626" },
    { label: "30-49", min: 30, max: 49, color: "#d97706" },
    { label: "50-69", min: 50, max: 69, color: "#eab308" },
    { label: "70-89", min: 70, max: 89, color: "#059669" },
    { label: "90-100", min: 90, max: 100, color: "#1e40af" },
  ];

  const safetyData = ranges.map((r) => ({
    name: r.label,
    count: drivers.filter((d) => d.safety_score >= r.min && d.safety_score <= r.max).length,
    fill: r.color,
  }));

  const avgScore =
    drivers.length === 0
      ? 0
      : Math.round(drivers.reduce((sum, d) => sum + d.safety_score, 0) / drivers.length);

  return (
    <div className="space-y-6">
      {drivers.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-sm font-semibold">Driver Roster</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {drivers.length} drivers · Average safety score: {avgScore}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">License</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {drivers
                  .sort((a, b) => a.safety_score - b.safety_score)
                  .map((d) => {
                    const expired = new Date(d.license_expiry) < new Date();
                    return (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-medium">{d.name}</td>
                        <td className="px-6 py-3 text-muted-foreground">{d.license_number}</td>
                        <td className="px-6 py-3 text-muted-foreground">{d.license_category}</td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                              d.safety_score >= 90
                                ? "bg-emerald-500/10 text-emerald-600"
                                : d.safety_score >= 70
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {d.safety_score}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                              d.status === "available"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : d.status === "on_trip"
                                ? "bg-blue-500/10 text-blue-600"
                                : d.status === "suspended"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {d.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className={`px-6 py-3 ${expired ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                          {new Date(d.license_expiry).toLocaleDateString()}
                          {expired && " (Expired)"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Safety Score Distribution"
          subtitle={`Average: ${avgScore} across ${drivers.length} drivers`}
        >
          {drivers.length === 0 ? (
            <Empty text="No driver data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={safetyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Drivers">
                  {safetyData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Driver Status" subtitle="Active vs inactive drivers">
          {drivers.length === 0 ? (
            <Empty text="No driver data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={countByStatus(drivers, ["available", "on_trip", "off_duty", "suspended"])}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={PieLabel}
                  strokeWidth={0}
                >
                  {countByStatus(drivers, ["available", "on_trip", "off_duty", "suspended"]).map(
                    (_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

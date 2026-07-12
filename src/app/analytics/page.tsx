"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsData,
  downloadCSV,
  type AnalyticsData,
} from "@/services/analytics.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  IndianRupee,
  TrendingUp,
  Percent,
  Download,
  BarChart3,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Fleet performance and financial analytics.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-3 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Fleet performance and financial analytics.
          </p>
        </div>
        <Button
          onClick={() => downloadCSV(data)}
          className="gap-2 rounded-xl"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Fuel Efficiency"
          value={`${data.fuelEfficiency} km/L`}
          icon={<Fuel className="h-5 w-5" />}
          color="text-blue-500"
          subtitle={`${data.totalFuelLitres}L total fuel`}
        />
        <AnalyticsCard
          title="Operational Cost"
          value={`₹${data.operationalCost.toLocaleString()}`}
          icon={<IndianRupee className="h-5 w-5" />}
          color="text-orange-500"
          subtitle={`₹${data.totalFuelCost.toFixed(0)} fuel + ₹${data.totalMaintenanceCost.toFixed(0)} maint`}
        />
        <AnalyticsCard
          title="Fleet Utilization"
          value={`${data.fleetUtilization}%`}
          icon={<Percent className="h-5 w-5" />}
          color="text-emerald-500"
        />
        <AnalyticsCard
          title="Vehicle ROI"
          value={`${data.vehicleROI}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-purple-500"
          subtitle={`₹${data.totalRevenue.toLocaleString()} est. revenue`}
        />
      </div>

      {/* Vehicle Cost Breakdown Chart */}
      {data.vehicleBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Cost per Vehicle
          </h3>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.vehicleBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="regNumber" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`]}
                />
                <Legend />
                <Bar dataKey="fuelCost" name="Fuel" fill="#3b82f6" stackId="a" />
                <Bar dataKey="maintenanceCost" name="Maintenance" fill="#f97316" stackId="a" />
                <Bar dataKey="expenseCost" name="Expenses" fill="#a855f7" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vehicle Efficiency Table */}
      {data.vehicleBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Vehicle Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Trips</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Distance</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Fuel (L)</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Efficiency</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicleBreakdown.map((v) => (
                  <tr key={v.vehicleId} className="border-t hover:bg-muted/30">
                    <td className="px-6 py-3">
                      <div className="font-medium">{v.regNumber}</div>
                      <div className="text-xs text-muted-foreground">{v.model}</div>
                    </td>
                    <td className="px-6 py-3 text-right">{v.trips}</td>
                    <td className="px-6 py-3 text-right">{v.distance.toLocaleString()} km</td>
                    <td className="px-6 py-3 text-right">{v.fuelUsed} L</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          v.efficiency > 10
                            ? "bg-green-100 text-green-700"
                            : v.efficiency > 5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {v.efficiency} km/L
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      ₹{v.totalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={`rounded-xl p-2.5 bg-accent/40 border border-border/30 group-hover:scale-110 transition-transform duration-300 ${color}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground font-medium">{subtitle}</p>
      )}
    </div>
  );
}

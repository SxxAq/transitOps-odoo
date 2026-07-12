"use client";

import { useEffect, useState } from "react";
import {
  getDashboardStats,
  type DashboardStats,
  type ChartData,
} from "@/services/dashboard.service";
import {
  VehicleStatusChart,
  TripStatusChart,
  FuelCostChart,
  OperationalCostChart,
} from "@/components/charts/charts";
import {
  Truck,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((result) => {
        setStats(result.stats);
        setCharts(result.charts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your fleet operations.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-3 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your fleet operations.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Vehicles"
          value={stats.totalVehicles}
          icon={<Truck className="h-5 w-5" />}
          color="text-primary"
        />
        <KPICard
          title="Active Trips"
          value={stats.activeTrips}
          icon={<MapPin className="h-5 w-5" />}
          color="text-blue-500"
          subtitle={`${stats.pendingTrips} pending`}
        />
        <KPICard
          title="Drivers On Duty"
          value={stats.driversOnDuty}
          icon={<Users className="h-5 w-5" />}
          color="text-orange-500"
          subtitle={`${stats.driversAvailable} available`}
        />
        <KPICard
          title="Fleet Utilization"
          value={`${stats.fleetUtilization}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-emerald-500"
        />
      </div>

      {/* Vehicle Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Available"
          value={stats.availableVehicles}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-green-600 bg-green-50"
        />
        <StatusCard
          title="On Trip"
          value={stats.vehiclesOnTrip}
          icon={<Clock className="h-4 w-4" />}
          color="text-blue-600 bg-blue-50"
        />
        <StatusCard
          title="In Shop"
          value={stats.vehiclesInShop}
          icon={<Wrench className="h-4 w-4" />}
          color="text-orange-600 bg-orange-50"
        />
        <StatusCard
          title="Retired"
          value={stats.vehiclesRetired}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-gray-600 bg-gray-50"
        />
      </div>

      {/* Charts */}
      {charts && (
        <div className="grid gap-4 md:grid-cols-2">
          <VehicleStatusChart data={charts.vehicleStatus} />
          <TripStatusChart data={charts.tripStatus} />
          <FuelCostChart data={charts.monthlyFuelCost} />
          <OperationalCostChart data={charts.monthlyOperationalCost} />
        </div>
      )}

      {/* Summary Panels */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Trip Summary</h3>
          <div className="mt-4 space-y-3">
            <SummaryRow label="Active (Dispatched)" value={stats.activeTrips} dot="bg-blue-500" />
            <SummaryRow label="Pending (Draft)" value={stats.pendingTrips} dot="bg-yellow-500" />
            <SummaryRow label="Completed" value={stats.completedTrips} dot="bg-green-500" />
            <SummaryRow label="Cancelled" value={stats.cancelledTrips} dot="bg-red-500" />
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total Trips</span>
              <span className="font-bold text-lg">{stats.totalTrips}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Driver Status</h3>
          <div className="mt-4 space-y-3">
            <SummaryRow label="On Trip" value={stats.driversOnDuty} dot="bg-blue-500" />
            <SummaryRow label="Available" value={stats.driversAvailable} dot="bg-green-500" />
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total Drivers</span>
              <span className="font-bold text-lg">{stats.totalDrivers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={color}>{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${color}`}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

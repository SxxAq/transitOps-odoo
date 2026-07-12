"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboard.service";
import {
  Truck,
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Wrench,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
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

      {/* Trip Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Trip Summary</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Active (Dispatched)
              </span>
              <span className="font-semibold">{stats.activeTrips}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                Pending (Draft)
              </span>
              <span className="font-semibold">{stats.pendingTrips}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Completed
              </span>
              <span className="font-semibold">{stats.completedTrips}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Cancelled
              </span>
              <span className="font-semibold">{stats.cancelledTrips}</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total Trips</span>
              <span className="font-bold text-lg">{stats.totalTrips}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Driver Status</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                On Trip
              </span>
              <span className="font-semibold">{stats.driversOnDuty}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Available
              </span>
              <span className="font-semibold">{stats.driversAvailable}</span>
            </div>
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
        <div className={`${color}`}>{icon}</div>
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

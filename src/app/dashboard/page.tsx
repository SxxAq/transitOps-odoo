"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  getDashboardStats,
  computeStats,
  computeChartData,
  type DashboardStats,
  type ChartData,
  type DashboardData,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const [rawData, setRawData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  useEffect(() => {
    getDashboardStats()
      .then((result) => {
        setRawData(result.raw);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    if (!rawData) return null;

    const filteredVehicles = rawData.vehicles.filter((v) => {
      const matchesType = vehicleTypeFilter === "all" || v.type === vehicleTypeFilter;
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const matchesRegion =
        regionFilter === "all" ||
        v.region === regionFilter ||
        (regionFilter === "none" && !v.region);
      return matchesType && matchesStatus && matchesRegion;
    });

    const vehicleIds = new Set(filteredVehicles.map((v) => v.id));

    // Filter trips associated with matching vehicles
    const filteredTrips = rawData.trips.filter((t) => vehicleIds.has(t.vehicle_id));
    
    // Filter fuel logs, maintenance records, and expenses associated with matching vehicles
    const filteredFuelLogs = rawData.fuelLogs.filter((f) => vehicleIds.has(f.vehicle_id));
    const filteredMaintenance = rawData.maintenance.filter((m) => vehicleIds.has(m.vehicle_id));
    const filteredExpenses = rawData.expenses.filter((e) => vehicleIds.has(e.vehicle_id));

    // Keep all drivers, but let's filter those active on matching vehicles/trips for the "on trip" stat
    const activeDriverIds = new Set(filteredTrips.map((t) => t.driver_id));
    const filteredDrivers = rawData.drivers;

    return {
      vehicles: filteredVehicles,
      drivers: filteredDrivers,
      trips: filteredTrips,
      fuelLogs: filteredFuelLogs,
      maintenance: filteredMaintenance,
      expenses: filteredExpenses,
    };
  }, [rawData, vehicleTypeFilter, statusFilter, regionFilter]);

  const stats = useMemo(() => {
    return filteredData ? computeStats(filteredData) : null;
  }, [filteredData]);

  const charts = useMemo(() => {
    return filteredData ? computeChartData(filteredData) : null;
  }, [filteredData]);

  const vehicleTypes = useMemo(() => {
    if (!rawData) return [];
    return Array.from(new Set(rawData.vehicles.map((v) => v.type))).filter(Boolean);
  }, [rawData]);

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

      {/* Dashboard Filters */}
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Type:</Label>
          <Select value={vehicleTypeFilter} onValueChange={(v) => v !== null && setVehicleTypeFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Status:</Label>
          <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On Trip</SelectItem>
              <SelectItem value="in_shop">In Shop</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Region:</Label>
          <Select value={regionFilter} onValueChange={(v) => v !== null && setRegionFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="North">North</SelectItem>
              <SelectItem value="South">South</SelectItem>
              <SelectItem value="East">East</SelectItem>
              <SelectItem value="West">West</SelectItem>
              <SelectItem value="Central">Central</SelectItem>
              <SelectItem value="none">No Region</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        />
        <StatusCard
          title="On Trip"
          value={stats.vehiclesOnTrip}
          icon={<Clock className="h-4 w-4" />}
          color="text-blue-500 bg-blue-500/10 border-blue-500/20"
        />
        <StatusCard
          title="In Shop"
          value={stats.vehiclesInShop}
          icon={<Wrench className="h-4 w-4" />}
          color="text-amber-500 bg-amber-500/10 border-amber-500/20"
        />
        <StatusCard
          title="Retired"
          value={stats.vehiclesRetired}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-rose-500 bg-rose-500/10 border-rose-500/20"
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className={cn("rounded-xl p-2.5 bg-accent/40 text-foreground border border-border/30 group-hover:scale-110 transition-transform duration-300", color)}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground font-medium flex items-center gap-1.5">{subtitle}</p>
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
    <div className="group rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm hover:shadow-md hover:border-primary/10 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-xl p-2 border transition-transform duration-300 group-hover:scale-105", color)}>
          {icon}
        </div>
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
          <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
        </div>
      </div>
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
      <span className="text-sm flex items-center gap-2 text-muted-foreground">
        <span className={`h-2.5 w-2.5 rounded-full ${dot} shadow-sm shadow-black/10`} />
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsData,
  downloadAllCSV,
  type AnalyticsData,
} from "@/services/analytics.service";
import { OverviewCharts, FinancialCharts, FleetCharts, DriverCharts } from "@/features/analytics/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Fuel,
  IndianRupee,
  TrendingUp,
  Percent,
  Truck,
  Users,
  Route,
  Wrench,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const result = await getAnalyticsData();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : String(err);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fleet performance and financial insights.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="mt-3 h-7 w-16 rounded bg-muted" />
              <div className="mt-2 h-3 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[350px] rounded-xl border bg-card p-6 shadow-sm animate-pulse">
              <div className="h-3 w-36 rounded bg-muted" />
              <div className="mt-6 h-[250px] rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fleet performance and financial insights.</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completedTrips = data.trips.filter((t) => t.status === "completed").length;
  const tripCompletionRate =
    data.trips.length === 0 ? 0 : Math.round((completedTrips / data.trips.length) * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fleet performance and financial insights.
          </p>
        </div>
        <button
          onClick={() => downloadAllCSV(data)}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Fleet Utilization"
          value={`${data.fleetUtilization}%`}
          subtitle={`${data.vehicles.filter((v) => v.status !== "retired").length} of ${data.vehicles.length} active`}
          icon={<Percent className="h-4 w-4" />}
        />
        <KPICard
          title="Fuel Efficiency"
          value={`${data.fuelEfficiency}`}
          suffix="km/L"
          subtitle={`${data.totalFuelLitres.toLocaleString()}L consumed`}
          icon={<Fuel className="h-4 w-4" />}
        />
        <KPICard
          title="Operational Cost"
          value={`₹${data.operationalCost.toLocaleString()}`}
          subtitle="Fuel + Maintenance + Expenses"
          icon={<IndianRupee className="h-4 w-4" />}
        />
        <KPICard
          title="Trip Completion"
          value={`${tripCompletionRate}`}
          suffix="%"
          subtitle={`${completedTrips} of ${data.trips.length} trips`}
          icon={<Route className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MiniKPI label="Vehicles" value={data.vehicles.length.toString()} icon={<Truck className="h-3.5 w-3.5" />} />
        <MiniKPI label="Drivers" value={data.drivers.length.toString()} icon={<Users className="h-3.5 w-3.5" />} />
        <MiniKPI label="Distance" value={`${data.totalDistance.toLocaleString()} km`} icon={<Route className="h-3.5 w-3.5" />} />
        <MiniKPI label="Maintenance" value={`₹${data.totalMaintenanceCost.toLocaleString()}`} icon={<Wrench className="h-3.5 w-3.5" />} />
        <MiniKPI label="Revenue (est)" value={`₹${data.totalRevenue.toLocaleString()}`} icon={<TrendingUp className="h-3.5 w-3.5" />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewCharts vehicles={data.vehicles} trips={data.trips} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialCharts
            expenses={data.expenses}
            fuelLogs={data.fuelLogs}
            vehicleBreakdown={data.vehicleBreakdown}
          />
        </TabsContent>

        <TabsContent value="fleet">
          <FleetCharts
            fuelLogs={data.fuelLogs}
            maintenance={data.maintenance}
            vehicleBreakdown={data.vehicleBreakdown}
          />
        </TabsContent>

        <TabsContent value="drivers">
          <DriverCharts drivers={data.drivers} />
        </TabsContent>
      </Tabs>

      {data.vehicles.length === 0 &&
        data.drivers.length === 0 &&
        data.trips.length === 0 && (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No data yet. Add vehicles, drivers, and trips to see analytics.
            </p>
          </div>
        )}
    </div>
  );
}

function KPICard({
  title,
  value,
  suffix,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  suffix?: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

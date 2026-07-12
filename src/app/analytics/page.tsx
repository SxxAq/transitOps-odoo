"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/features/analytics/stats-cards";
import { AnalyticsCharts } from "@/features/analytics/charts";
import { getAnalyticsData, type AnalyticsData } from "@/services/analytics.service";

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
        const message =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : String(err);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Fleet performance and financial analytics.</p>
      </div>

      {loading && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading analytics...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
          Failed to load analytics: {error}
        </div>
      )}

      {data && (
        <>
          <StatsCards
            vehicles={data.vehicles}
            drivers={data.drivers}
            trips={data.trips}
            expenses={data.expenses}
          />
          <AnalyticsCharts
            vehicles={data.vehicles}
            drivers={data.drivers}
            trips={data.trips}
            expenses={data.expenses}
            fuelLogs={data.fuelLogs}
            maintenance={data.maintenance}
          />
        </>
      )}

      {!loading && !error && data && (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          {data.vehicles.length === 0 &&
            data.drivers.length === 0 &&
            data.trips.length === 0 &&
            data.expenses.length === 0 &&
            data.fuelLogs.length === 0 &&
            data.maintenance.length === 0 &&
            "No data yet. Add vehicles, drivers, trips, expenses, fuel logs, and maintenance records to see analytics."}
        </div>
      )}
    </div>
  );
}

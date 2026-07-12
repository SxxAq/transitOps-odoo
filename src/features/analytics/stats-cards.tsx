import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vehicle, Driver, Trip, Expense } from "@/types";

interface StatsCardsProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  expenses: Expense[];
}

export function StatsCards({ vehicles, drivers, trips, expenses }: StatsCardsProps) {
  const activeVehicles = vehicles.filter((v) => v.status === "on_trip").length;
  const availableDrivers = drivers.filter((d) => d.status === "available").length;
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const completedTrips = trips.filter((t) => t.status === "completed").length;
  const tripCompletionRate = trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0;

  const stats = [
    {
      title: "Total Vehicles",
      value: vehicles.length,
      subtitle: `${activeVehicles} on trip`,
      icon: "truck",
    },
    {
      title: "Total Drivers",
      value: drivers.length,
      subtitle: `${availableDrivers} available`,
      icon: "users",
    },
    {
      title: "Total Trips",
      value: trips.length,
      subtitle: `${tripCompletionRate}% completion rate`,
      icon: "route",
    },
    {
      title: "Total Expenses",
      value: `$${totalExpense.toLocaleString()}`,
      subtitle: `${expenses.length} entries`,
      icon: "receipt",
    },
  ];

  const iconPaths: Record<string, string> = {
    truck: "M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM2 4a2 2 0 0 1 2-2h9l4 4v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z",
    users: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-4 7a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z",
    route: "M3 3h18v2H3V3zm0 16h18v2H3v-2zm0-8h18v2H3v-2z",
    receipt: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2L4 2zm3 14h10m-10-4h10m-10-4h4",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={iconPaths[stat.icon]} />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";

export const roleConfig: Record<
  UserRole,
  { label: string; color: string; pages: string[]; description: string }
> = {
  fleet_manager: {
    label: "Fleet Manager",
    color: "bg-blue-100 text-blue-700",
    pages: ["dashboard", "vehicles", "drivers", "trips", "maintenance", "fuel", "expenses", "analytics", "settings"],
    description: "Full access to manage vehicles, drivers, trips, and analytics",
  },
  driver: {
    label: "Driver",
    color: "bg-green-100 text-green-700",
    pages: ["dashboard", "trips"],
    description: "View dashboard and manage your assigned trips",
  },
  safety_officer: {
    label: "Safety Officer",
    color: "bg-orange-100 text-orange-700",
    pages: ["dashboard", "drivers", "trips"],
    description: "Monitor drivers, safety scores, and active trips",
  },
  financial_analyst: {
    label: "Financial Analyst",
    color: "bg-purple-100 text-purple-700",
    pages: ["dashboard", "expenses", "fuel", "analytics"],
    description: "Track expenses, fuel costs, and financial analytics",
  },
};

export function canAccessPage(role: UserRole, page: string): boolean {
  return roleConfig[role]?.pages.includes(page) ?? false;
}

export function isFleetManager(role: UserRole): boolean {
  return role === "fleet_manager";
}

export function canManageVehicles(role: UserRole): boolean {
  return role === "fleet_manager";
}

export function canManageDrivers(role: UserRole): boolean {
  return role === "fleet_manager" || role === "safety_officer";
}

export function canDispatchTrips(role: UserRole): boolean {
  return role === "fleet_manager" || role === "driver";
}

export function canManageExpenses(role: UserRole): boolean {
  return role === "fleet_manager" || role === "financial_analyst";
}

export function canViewAnalytics(role: UserRole): boolean {
  return role === "fleet_manager" || role === "financial_analyst";
}

export function canManageTeam(role: UserRole): boolean {
  return role === "fleet_manager";
}

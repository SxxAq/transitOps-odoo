"use client";

import { Badge } from "@/components/ui/badge";
import type { VehicleStatus } from "@/types";

const statusConfig: Record<
  VehicleStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  available: { label: "Available", variant: "default" },
  on_trip: { label: "On Trip", variant: "secondary" },
  in_shop: { label: "In Shop", variant: "destructive" },
  retired: { label: "Retired", variant: "outline" },
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Vehicle } from "@/types";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

interface VehicleColumnsProps {
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
}

export function getVehicleColumns({
  onEdit,
  onDelete,
  onView,
}: VehicleColumnsProps): ColumnDef<Vehicle>[] {
  return [
    {
      accessorKey: "registration_number",
      header: "Reg. Number",
    },
    {
      accessorKey: "model",
      header: "Model",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => <span>{row.original.region ?? "—"}</span>,
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
      cell: ({ row }) => <span>{row.original.capacity} kg</span>,
    },
    {
      accessorKey: "odometer",
      header: "Odometer",
      cell: ({ row }) => (
        <span>{row.original.odometer.toLocaleString()} km</span>
      ),
    },
    {
      accessorKey: "acquisition_cost",
      header: "Cost",
      cell: ({ row }) => (
        <span>₹{row.original.acquisition_cost.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <VehicleStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onView(row.original)}
          >
            <EyeIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(row.original)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(row.original)}
          >
            <TrashIcon />
          </Button>
        </div>
      ),
    },
  ];
}

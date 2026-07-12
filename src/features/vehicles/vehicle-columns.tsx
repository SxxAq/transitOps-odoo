"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Vehicle } from "@/types";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";

interface VehicleColumnsProps {
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export function getVehicleColumns({
  onEdit,
  onDelete,
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
      accessorKey: "capacity",
      header: "Capacity",
      cell: ({ row }) => <span>{row.original.capacity} kg</span>,
    },
    {
      accessorKey: "odometer",
      header: "Odometer",
      cell: ({ row }) => <span>{row.original.odometer.toLocaleString()} km</span>,
    },
    {
      accessorKey: "acquisition_cost",
      header: "Cost",
      cell: ({ row }) => (
        <span>${row.original.acquisition_cost.toLocaleString()}</span>
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

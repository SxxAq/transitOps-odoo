"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Driver, DriverStatus } from "@/types";
import { isLicenseExpired } from "@/lib/businessRules";

const statusVariantMap: Record<DriverStatus, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  on_trip: "secondary",
  off_duty: "outline",
  suspended: "destructive",
};

interface DriverTableProps {
  data: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}

export function DriverTable({ data, onEdit, onDelete }: DriverTableProps) {
  const columns: ColumnDef<Driver, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "license_number",
      header: "License #",
    },
    {
      accessorKey: "license_category",
      header: "Category",
    },
    {
      accessorKey: "license_expiry",
      header: "License Expiry",
      cell: ({ row }) => {
        const expiry = row.original.license_expiry;
        const expired = isLicenseExpired(expiry);
        return (
          <span className={expired ? "text-destructive font-medium" : ""}>
            {new Date(expiry).toLocaleDateString()}
            {expired && " (Expired)"}
          </span>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
    },
    {
      accessorKey: "safety_score",
      header: "Safety Score",
      cell: ({ row }) => {
        const score = row.original.safety_score;
        let variant: "default" | "secondary" | "destructive" = "default";
        if (score < 50) variant = "destructive";
        else if (score < 80) variant = "secondary";
        return <Badge variant={variant}>{score}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status as DriverStatus;
        return (
          <Badge variant={statusVariantMap[status]}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          <Button variant="destructive" size="xs" onClick={() => onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No drivers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

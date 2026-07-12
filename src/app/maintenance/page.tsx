"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from "@/services/maintenance.service";
import { getVehicles, updateVehicle } from "@/services/vehicle.service";
import type { MaintenanceRecord, Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { maintenanceSchema, type MaintenanceFormData } from "@/lib/validations";
import {
  Wrench,
  Trash2,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: "",
      title: "",
      description: "",
      cost: 0,
    },
  });

  const watchedVehicleId = watch("vehicle_id");

  const fetchData = useCallback(async () => {
    try {
      const [recs, vhs] = await Promise.all([
        getMaintenanceRecords(),
        getVehicles(),
      ]);
      setRecords(recs);
      setVehicles(vhs);
    } catch (err) {
      console.error("Failed to load maintenance records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vehicleMap = vehicles.reduce(
    (acc, v) => {
      acc[v.id] = v;
      return acc;
    },
    {} as Record<string, Vehicle>
  );

  const filteredRecords = records.filter((r) => {
    if (vehicleFilter !== "all" && r.vehicle_id !== vehicleFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
  const openCount = filteredRecords.filter((r) => r.status === "open").length;
  const closedCount = filteredRecords.filter((r) => r.status === "closed").length;

  const onCreate = async (data: MaintenanceFormData) => {
    try {
      const record = await createMaintenanceRecord({
        ...data,
        description: data.description ?? "",
        status: "open",
      });

      // Business rule: vehicle status -> in_shop
      await updateVehicle(data.vehicle_id, { status: "in_shop" });
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicle_id ? { ...v, status: "in_shop" as const } : v
        )
      );

      setRecords((prev) => [record, ...prev]);
      reset();
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create maintenance record:", err);
    }
  };

  const onClose = async (record: MaintenanceRecord) => {
    try {
      await updateMaintenanceRecord(record.id, { status: "closed" });
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id ? { ...r, status: "closed" as const } : r
        )
      );

      // Business rule: restore vehicle to available (unless retired)
      const vehicle = vehicleMap[record.vehicle_id];
      if (vehicle && vehicle.status !== "retired") {
        await updateVehicle(record.vehicle_id, { status: "available" });
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === record.vehicle_id
              ? { ...v, status: "available" as const }
              : v
          )
        );
      }
    } catch (err) {
      console.error("Failed to close maintenance record:", err);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      const record = records.find((r) => r.id === deleteId);
      await deleteMaintenanceRecord(deleteId);

      // If the record was open, restore vehicle status
      if (record && record.status === "open") {
        const vehicle = vehicleMap[record.vehicle_id];
        if (vehicle && vehicle.status !== "retired") {
          await updateVehicle(record.vehicle_id, { status: "available" });
          setVehicles((prev) =>
            prev.map((v) =>
              v.id === record.vehicle_id
                ? { ...v, status: "available" as const }
                : v
            )
          );
        }
      }

      setRecords((prev) => prev.filter((r) => r.id !== deleteId));
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete maintenance record:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Track vehicle maintenance and service records.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Maintenance Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                ${totalCost.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{openCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Closed Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{closedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Vehicle:</Label>
          <Select value={vehicleFilter} onValueChange={(v) => v !== null && setVehicleFilter(v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.registration_number} - {v.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Status:</Label>
          <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Maintenance Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Cost
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const vehicle = vehicleMap[record.vehicle_id];
                  return (
                    <tr key={record.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {vehicle?.registration_number ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle?.model ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{record.title}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {record.description || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${record.cost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            record.status === "open"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {record.status === "open" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {record.status === "open" ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {record.status === "open" && (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => onClose(record)}
                              title="Close maintenance"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => {
                              setDeleteId(record.id);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>
              Record maintenance for a vehicle. The vehicle will be marked as
              &quot;In Shop&quot; and removed from dispatch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={watchedVehicleId}
                onValueChange={(v) => v !== null && setValue("vehicle_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter((v) => v.status !== "retired")
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registration_number} - {v.model}{" "}
                        {v.status === "in_shop" ? "(In Shop)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && (
                <p className="text-xs text-destructive">
                  {errors.vehicle_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Oil Change, Tire Rotation"
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                {...register("description")}
                placeholder="Additional details..."
              />
            </div>

            <div className="space-y-2">
              <Label>Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("cost", { valueAsNumber: true })}
              />
              {errors.cost && (
                <p className="text-xs text-destructive">{errors.cost.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Maintenance Record</DialogTitle>
            <DialogDescription>
              Are you sure? If this record is open, the vehicle will be restored
              to Available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

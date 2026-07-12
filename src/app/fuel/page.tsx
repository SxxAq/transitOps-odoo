"use client";

import { useEffect, useState, useCallback } from "react";
import { getFuelLogs, deleteFuelLog } from "@/services/fuel.service";
import { getVehicles } from "@/services/vehicle.service";
import type { FuelLog, Vehicle } from "@/types";
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
import { fuelLogSchema, type FuelLogFormData } from "@/lib/validations";
import { Fuel, Trash2, Plus, IndianRupee, Droplets } from "lucide-react";

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicle_id: "",
      litres: 0,
      cost: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedVehicleId = watch("vehicle_id");

  const fetchData = useCallback(async () => {
    try {
      const [logs, vhs] = await Promise.all([getFuelLogs(), getVehicles()]);
      setFuelLogs(logs);
      setVehicles(vhs);
    } catch (err) {
      console.error("Failed to load fuel logs:", err);
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

  const filteredLogs = vehicleFilter === "all"
    ? fuelLogs
    : fuelLogs.filter((l) => l.vehicle_id === vehicleFilter);

  const totalFuelCost = filteredLogs.reduce((sum, l) => sum + l.cost, 0);
  const totalLitres = filteredLogs.reduce((sum, l) => sum + l.litres, 0);

  const onCreate = async (data: FuelLogFormData) => {
    try {
      const log = await import("@/services/fuel.service").then((m) =>
        m.createFuelLog(data)
      );
      setFuelLogs((prev) => [log, ...prev]);
      reset();
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create fuel log:", err);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFuelLog(deleteId);
      setFuelLogs((prev) => prev.filter((l) => l.id !== deleteId));
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete fuel log:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fuel Logs</h1>
          <p className="text-muted-foreground">
            Track fuel consumption across your fleet.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Fuel Log
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fuel Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                ₹{totalFuelCost.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Litres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {totalLitres.toLocaleString()} L
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{filteredLogs.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Filter by Vehicle:</Label>
        <Select value={vehicleFilter} onValueChange={(v) => v !== null && setVehicleFilter(v)}>
          <SelectTrigger className="w-64">
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

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Fuel Log Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Litres
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Cost
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading fuel logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No fuel logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const vehicle = vehicleMap[log.vehicle_id];
                  return (
                    <tr key={log.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {vehicle?.registration_number ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle?.model ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">{log.litres} L</td>
                      <td className="px-4 py-3 font-medium">
                        ₹{log.cost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => {
                            setDeleteId(log.id);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
            <DialogTitle>Add Fuel Log</DialogTitle>
            <DialogDescription>
              Record a new fuel entry for a vehicle.
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
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration_number} - {v.model}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Litres</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("litres", { valueAsNumber: true })}
                />
                {errors.litres && (
                  <p className="text-xs text-destructive">
                    {errors.litres.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Cost (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("cost", { valueAsNumber: true })}
                />
                {errors.cost && (
                  <p className="text-xs text-destructive">
                    {errors.cost.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
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
                {isSubmitting ? "Adding..." : "Add Fuel Log"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Fuel Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fuel log? This action cannot
              be undone.
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

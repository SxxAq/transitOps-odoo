"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrips, createTrip, updateTrip, deleteTrip } from "@/services/trip.service";
import { getVehicles } from "@/services/vehicle.service";
import { getDrivers } from "@/services/driver.service";
import { updateVehicle } from "@/services/vehicle.service";
import { updateDriver } from "@/services/driver.service";
import {
  validateTripCreation,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from "@/lib/businessRules";
import type { Trip, Vehicle, Driver } from "@/types";
import { tripSchema, type TripFormData } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  dispatched: { label: "Dispatched", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [t, v, d] = await Promise.all([getTrips(), getVehicles(), getDrivers()]);
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    } catch (err) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d]));

  const filteredTrips = trips.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicle_id: "",
      driver_id: "",
      cargo_weight: 0,
      planned_distance: 0,
    },
  });

  const watchedVehicleId = watch("vehicle_id");
  const watchedDriverId = watch("driver_id");

  const selectedVehicle = vehicles.find((v) => v.id === watchedVehicleId);

  const onCreate = async (data: TripFormData) => {
    setError("");
    const vehicle = vehicles.find((v) => v.id === data.vehicle_id);
    const driver = drivers.find((d) => d.id === data.driver_id);

    if (!vehicle || !driver) {
      setError("Invalid vehicle or driver selected");
      return;
    }

    const validation = validateTripCreation(vehicle, driver, data.cargo_weight);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    try {
      const trip = await createTrip({
        ...data,
        status: "draft",
        fuel_used: 0,
        final_odometer: 0,
      });
      setTrips((prev) => [trip, ...prev]);
      reset();
      setCreateOpen(false);
    } catch (err) {
      console.error("Failed to create trip:", err);
      setError("Failed to create trip");
    }
  };

  const handleDispatch = async (trip: Trip) => {
    const vehicle = vehicleMap[trip.vehicle_id];
    const driver = driverMap[trip.driver_id];
    if (!vehicle || !driver) return;

    const updates = dispatchTrip(vehicle, driver);

    try {
      const [updatedTrip] = await Promise.all([
        updateTrip(trip.id, {
          status: "dispatched",
          dispatched_at: new Date().toISOString(),
        }),
        updateVehicle(trip.vehicle_id, updates.vehicleUpdate),
        updateDriver(trip.driver_id, updates.driverUpdate),
      ]);
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? updatedTrip : t)));
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === trip.vehicle_id ? { ...v, ...updates.vehicleUpdate } : v
        )
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === trip.driver_id ? { ...d, ...updates.driverUpdate } : d
        )
      );
    } catch (err) {
      console.error("Failed to dispatch trip:", err);
    }
  };

  const handleComplete = async (trip: Trip) => {
    const vehicle = vehicleMap[trip.vehicle_id];
    const driver = driverMap[trip.driver_id];
    if (!vehicle || !driver) return;

    const updates = completeTrip(vehicle, driver);

    try {
      const [updatedTrip] = await Promise.all([
        updateTrip(trip.id, {
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
        updateVehicle(trip.vehicle_id, updates.vehicleUpdate),
        updateDriver(trip.driver_id, updates.driverUpdate),
      ]);
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? updatedTrip : t)));
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === trip.vehicle_id ? { ...v, ...updates.vehicleUpdate } : v
        )
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === trip.driver_id ? { ...d, ...updates.driverUpdate } : d
        )
      );
    } catch (err) {
      console.error("Failed to complete trip:", err);
    }
  };

  const handleCancel = async (trip: Trip) => {
    const vehicle = vehicleMap[trip.vehicle_id];
    const driver = driverMap[trip.driver_id];
    if (!vehicle || !driver) return;

    const updates = cancelTrip(vehicle, driver);

    try {
      const [updatedTrip] = await Promise.all([
        updateTrip(trip.id, { status: "cancelled" }),
        updateVehicle(trip.vehicle_id, updates.vehicleUpdate),
        updateDriver(trip.driver_id, updates.driverUpdate),
      ]);
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? updatedTrip : t)));
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === trip.vehicle_id ? { ...v, ...updates.vehicleUpdate } : v
        )
      );
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === trip.driver_id ? { ...d, ...updates.driverUpdate } : d
        )
      );
    } catch (err) {
      console.error("Failed to cancel trip:", err);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTrip(deleteId);
      setTrips((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">Manage and track trips.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Trip
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Status:</Label>
        <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Route</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Driver</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cargo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Distance</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Loading trips...
                  </td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No trips found.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const vehicle = vehicleMap[trip.vehicle_id];
                  const driver = driverMap[trip.driver_id];
                  const cfg = statusConfig[trip.status];
                  return (
                    <tr key={trip.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{trip.source}</div>
                        <div className="text-xs text-muted-foreground">→ {trip.destination}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{vehicle?.registration_number ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{vehicle?.model ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{driver?.name ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{trip.cargo_weight} kg</td>
                      <td className="px-4 py-3 text-right">{trip.planned_distance} km</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {trip.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleDispatch(trip)}
                              className="h-7 px-2"
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Dispatch
                        </Button>
                          )}
                          {trip.status === "dispatched" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleComplete(trip)}
                              className="h-7 px-2"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Button>
                          )}
                          {(trip.status === "draft" || trip.status === "dispatched") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(trip)}
                              className="h-7 px-2"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          )}
                          {trip.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setDeleteId(trip.id);
                                setDeleteOpen(true);
                              }}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Trip</DialogTitle>
            <DialogDescription>
              Plan a new trip. Business rules will be validated before creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" {...register("source")} placeholder="e.g. Lahore Warehouse" />
                {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input id="destination" {...register("destination")} placeholder="e.g. Islamabad Hub" />
                {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={watchedVehicleId}
                onValueChange={(v) => v !== null && setValue("vehicle_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select available vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter((v) => v.status === "available")
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registration_number} — {v.model} (Capacity: {v.capacity}kg)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Driver</Label>
              <Select
                value={watchedDriverId}
                onValueChange={(v) => v !== null && setValue("driver_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select available driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers
                    .filter((d) => d.status === "available")
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} — License: {d.license_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.driver_id && <p className="text-xs text-destructive">{errors.driver_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo_weight">Cargo Weight (kg)</Label>
                <Input
                  id="cargo_weight"
                  type="number"
                  min={1}
                  {...register("cargo_weight", { valueAsNumber: true })}
                />
                {errors.cargo_weight && <p className="text-xs text-destructive">{errors.cargo_weight.message}</p>}
                {selectedVehicle && (
                  <p className="text-xs text-muted-foreground">
                    Max capacity: {selectedVehicle.capacity} kg
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="planned_distance">Distance (km)</Label>
                <Input
                  id="planned_distance"
                  type="number"
                  min={1}
                  {...register("planned_distance", { valueAsNumber: true })}
                />
                {errors.planned_distance && <p className="text-xs text-destructive">{errors.planned_distance.message}</p>}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone.
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

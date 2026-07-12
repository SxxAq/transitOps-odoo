"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle, VehicleStatus } from "@/types";
import type { VehicleFormData } from "@/lib/validations";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/services/vehicle.service";
import { getVehicleColumns } from "@/features/vehicles/vehicle-columns";
import { VehicleTable } from "@/features/vehicles/vehicle-table";
import { VehicleForm } from "@/features/vehicles/vehicle-form";
import { VehicleStatusBadge } from "@/features/vehicles/vehicle-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusIcon, SearchIcon, TruckIcon } from "lucide-react";

type FilterStatus = "all" | VehicleStatus;

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const data = await getVehicles();
        if (!cancelled) setVehicles(data);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        searchQuery === "" ||
        v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: vehicles.length };
    for (const v of vehicles) {
      counts[v.status] = (counts[v.status] || 0) + 1;
    }
    return counts;
  }, [vehicles]);

  const handleCreate = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleView = (vehicle: Vehicle) => {
    router.push(`/vehicles/${vehicle.id}`);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    try {
      setIsSubmitting(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, data);
      } else {
        await createVehicle(data);
      }
      setIsFormOpen(false);
      setEditingVehicle(null);
      const refreshed = await getVehicles();
      setVehicles(refreshed);
    } catch (error) {
      console.error("Failed to save vehicle:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVehicle) return;
    try {
      setIsDeleting(true);
      await deleteVehicle(deletingVehicle.id);
      setDeletingVehicle(null);
      const refreshed = await getVehicles();
      setVehicles(refreshed);
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getVehicleColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onView: handleView,
      }),
    [handleEdit, handleDelete, handleView]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage your fleet vehicles.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon className="size-4" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Vehicles</p>
          <div className="flex items-center gap-2 mt-2">
            <TruckIcon className="size-5 text-primary" />
            <span className="text-2xl font-bold">{statusCounts.all || 0}</span>
          </div>
        </div>
        <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
            <span className="text-2xl font-bold">{statusCounts.available || 0}</span>
          </div>
        </div>
        <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On Trip</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />
            <span className="text-2xl font-bold">{statusCounts.on_trip || 0}</span>
          </div>
        </div>
        <div className="group rounded-2xl border border-border/40 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Shop</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
            <span className="text-2xl font-bold">{statusCounts.in_shop || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card/45 border border-border/30 rounded-2xl p-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by reg. number, model, or type..."
            className="pl-9 rounded-xl border-border/40 bg-background/50 focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as FilterStatus)}
        >
          <SelectTrigger className="w-44 rounded-xl border-border/40 bg-background/50 focus:ring-primary">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="on_trip">On Trip</SelectItem>
            <SelectItem value="in_shop">In Shop</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Loading vehicles...
          </div>
        ) : (
          <VehicleTable columns={columns} data={filteredVehicles} />
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? "Update vehicle details below."
                : "Fill in the details to register a new vehicle."}
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            initialData={editingVehicle ?? undefined}
            existingVehicles={vehicles}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingVehicle}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingVehicle?.registration_number}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingVehicle(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

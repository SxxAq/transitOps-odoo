"use client";

import { useEffect, useState } from "react";
import { DriverTable } from "@/features/drivers/driver-table";
import { DriverFormDialog } from "@/features/drivers/driver-form-dialog";
import { DeleteDriverDialog } from "@/features/drivers/delete-driver-dialog";
import { Button } from "@/components/ui/button";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/services/driver.service";
import type { Driver } from "@/types";
import type { DriverFormData } from "@/lib/validations";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) setLoading(true);
        const data = await getDrivers();
        if (!cancelled) setDrivers(data);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          console.error("Failed to fetch drivers:", (err as { message: string }).message);
        } else {
          console.error("Failed to fetch drivers:", String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        console.error("Failed to fetch drivers:", (err as { message: string }).message);
      } else {
        console.error("Failed to fetch drivers:", String(err));
      }
    }
  };

  const handleCreate = async (data: DriverFormData) => {
    await createDriver(data);
    await refresh();
  };

  const handleEdit = async (data: DriverFormData) => {
    if (!selectedDriver) return;
    await updateDriver(selectedDriver.id, data);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteDriver(id);
    await refresh();
  };

  const openEditDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setDeleteOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedDriver(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">Manage your drivers.</p>
        </div>
        <Button onClick={openCreateDialog}>Add Driver</Button>
      </div>
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            Loading drivers...
          </div>
        ) : (
          <DriverTable
            data={drivers}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        )}
      </div>

      <DriverFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={selectedDriver ? handleEdit : handleCreate}
        driver={selectedDriver}
      />

      <DeleteDriverDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        driver={selectedDriver}
        onConfirm={handleDelete}
      />
    </div>
  );
}

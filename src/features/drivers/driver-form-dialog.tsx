"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { driverSchema, type DriverFormData } from "@/lib/validations";
import type { Driver } from "@/types";

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DriverFormData) => Promise<void>;
  driver?: Driver | null;
}

export function DriverFormDialog({
  open,
  onOpenChange,
  onSubmit,
  driver,
}: DriverFormDialogProps) {
  const isEditing = !!driver;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      license_number: "",
      license_category: "",
      license_expiry: "",
      contact: "",
      safety_score: 100,
      status: "available",
    },
  });

  useEffect(() => {
    if (open) {
      if (driver) {
        reset({
          name: driver.name,
          license_number: driver.license_number,
          license_category: driver.license_category,
          license_expiry: driver.license_expiry.split("T")[0],
          contact: driver.contact,
          safety_score: driver.safety_score,
          status: driver.status,
        });
      } else {
        reset({
          name: "",
          license_number: "",
          license_category: "",
          license_expiry: "",
          contact: "",
          safety_score: 100,
          status: "available",
        });
      }
    }
  }, [open, driver, reset]);

  const handleFormSubmit = async (data: DriverFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Driver" : "Add Driver"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update driver information below."
              : "Fill in the details to add a new driver."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} placeholder="John Doe" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input id="license_number" {...register("license_number")} placeholder="LIC-12345" />
            {errors.license_number && (
              <p className="text-xs text-destructive">{errors.license_number.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="license_category">License Category</Label>
              <Input id="license_category" {...register("license_category")} placeholder="B, C, D" />
              {errors.license_category && (
                <p className="text-xs text-destructive">{errors.license_category.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="license_expiry">License Expiry</Label>
              <Input id="license_expiry" type="date" {...register("license_expiry")} />
              {errors.license_expiry && (
                <p className="text-xs text-destructive">{errors.license_expiry.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" {...register("contact")} placeholder="+1 234 567 890" />
            {errors.contact && (
              <p className="text-xs text-destructive">{errors.contact.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="safety_score">Safety Score (0-100)</Label>
              <Input
                id="safety_score"
                type="number"
                min={0}
                max={100}
                {...register("safety_score", { valueAsNumber: true })}
              />
              {errors.safety_score && (
                <p className="text-xs text-destructive">{errors.safety_score.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="available">Available</option>
                <option value="on_trip">On Trip</option>
                <option value="off_duty">Off Duty</option>
                <option value="suspended">Suspended</option>
              </select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

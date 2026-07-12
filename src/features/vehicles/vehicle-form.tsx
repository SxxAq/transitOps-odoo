"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, type VehicleFormData } from "@/lib/validations";
import { isRegistrationUnique } from "@/lib/businessRules";
import type { Vehicle } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleFormProps {
  initialData?: Vehicle;
  existingVehicles: Vehicle[];
  onSubmit: (data: VehicleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const vehicleTypes = [
  "Truck",
  "Van",
  "Bus",
  "Trailer",
  "Tanker",
  "Flatbed",
  "Refrigerated",
  "Other",
];

const vehicleStatuses = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "in_shop", label: "In Shop" },
  { value: "retired", label: "Retired" },
];

const vehicleRegions = ["North", "South", "East", "West", "Central"];

export function VehicleForm({
  initialData,
  existingVehicles,
  onSubmit,
  onCancel,
  isLoading,
}: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData
      ? {
          registration_number: initialData.registration_number,
          model: initialData.model,
          type: initialData.type,
          capacity: initialData.capacity,
          odometer: initialData.odometer,
          acquisition_cost: initialData.acquisition_cost,
          status: initialData.status,
          region: initialData.region ?? "",
        }
      : {
          registration_number: "",
          model: "",
          type: "",
          capacity: 0,
          odometer: 0,
          acquisition_cost: 0,
          status: "available",
          region: "",
        },
  });

  const selectedType = watch("type");
  const selectedStatus = watch("status");
  const selectedRegion = watch("region");
  const regNumber = watch("registration_number");

  const regError =
    regNumber && !isRegistrationUnique(regNumber, existingVehicles, initialData?.id)
      ? "Registration number already exists"
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registration_number">Registration Number</Label>
          <Input
            id="registration_number"
            placeholder="e.g. VAN-01"
            {...register("registration_number")}
          />
          {errors.registration_number && (
            <p className="text-xs text-destructive">
              {errors.registration_number.message}
            </p>
          )}
          {regError && !errors.registration_number && (
            <p className="text-xs text-destructive">{regError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="e.g. Toyota Hilux"
            {...register("model")}
          />
          {errors.model && (
            <p className="text-xs text-destructive">{errors.model.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              if (value !== null) setValue("type", value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              if (value !== null)
                setValue("status", value as VehicleFormData["status"]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {vehicleStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity (kg)</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            {...register("capacity", { valueAsNumber: true })}
          />
          {errors.capacity && (
            <p className="text-xs text-destructive">{errors.capacity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="odometer">Odometer (km)</Label>
          <Input
            id="odometer"
            type="number"
            min={0}
            {...register("odometer", { valueAsNumber: true })}
          />
          {errors.odometer && (
            <p className="text-xs text-destructive">
              {errors.odometer.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquisition_cost">Acquisition Cost (₹)</Label>
          <Input
            id="acquisition_cost"
            type="number"
            min={0}
            {...register("acquisition_cost", { valueAsNumber: true })}
          />
          {errors.acquisition_cost && (
            <p className="text-xs text-destructive">
              {errors.acquisition_cost.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Region</Label>
          <Select
            value={selectedRegion || ""}
            onValueChange={(value) => {
              setValue("region", value || null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (No Region)</SelectItem>
              {vehicleRegions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.region && (
            <p className="text-xs text-destructive">{errors.region.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !!regError}
        >
          {isLoading
            ? "Saving..."
            : initialData
              ? "Update Vehicle"
              : "Add Vehicle"}
        </Button>
      </div>
    </form>
  );
}

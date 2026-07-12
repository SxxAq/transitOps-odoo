import { z } from "zod";

export const vehicleSchema = z.object({
  registration_number: z.string().min(1, "Registration number is required"),
  model: z.string().min(1, "Model is required"),
  type: z.string().min(1, "Type is required"),
  capacity: z.number().positive("Capacity must be positive"),
  odometer: z.number().min(0, "Odometer cannot be negative"),
  acquisition_cost: z.number().min(0, "Cost cannot be negative"),
  status: z.enum(["available", "on_trip", "in_shop", "retired"]),
});

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  license_number: z.string().min(1, "License number is required"),
  license_category: z.string().min(1, "License category is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  contact: z.string().min(1, "Contact is required"),
  safety_score: z.number().min(0).max(100),
  status: z.enum(["available", "on_trip", "off_duty", "suspended"]),
});

export const tripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  driver_id: z.string().min(1, "Driver is required"),
  cargo_weight: z.number().positive("Cargo weight must be positive"),
  planned_distance: z.number().positive("Distance must be positive"),
});

export const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  cost: z.number().min(0, "Cost cannot be negative"),
});

export const fuelLogSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  litres: z.number().positive("Litres must be positive"),
  cost: z.number().min(0, "Cost cannot be negative"),
  date: z.string().min(1, "Date is required"),
});

export const expenseSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  trip_id: z.string().nullable().optional(),
  type: z.enum(["toll", "maintenance", "miscellaneous"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string(),
  date: z.string().min(1, "Date is required"),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type DriverFormData = z.infer<typeof driverSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;
export type FuelLogFormData = z.infer<typeof fuelLogSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;

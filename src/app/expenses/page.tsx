"use client";

import { useEffect, useState, useCallback } from "react";
import { getExpenses, createExpense, deleteExpense } from "@/services/expense.service";
import { getVehicles } from "@/services/vehicle.service";
import type { Expense, Vehicle } from "@/types";
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
import { expenseSchema, type ExpenseFormData } from "@/lib/validations";
import { Receipt, Trash2, Plus, IndianRupee, Wrench, CreditCard } from "lucide-react";

const expenseTypeLabels: Record<string, string> = {
  toll: "Toll",
  maintenance: "Maintenance",
  miscellaneous: "Miscellaneous",
};

const expenseTypeColors: Record<string, string> = {
  toll: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  miscellaneous: "bg-purple-100 text-purple-700",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicle_id: "",
      trip_id: null,
      type: "toll",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedVehicleId = watch("vehicle_id");
  const watchedType = watch("type");

  const fetchData = useCallback(async () => {
    try {
      const [exps, vhs] = await Promise.all([getExpenses(), getVehicles()]);
      setExpenses(exps);
      setVehicles(vhs);
    } catch (err) {
      console.error("Failed to load expenses:", err);
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

  const filteredExpenses = expenses.filter((e) => {
    if (vehicleFilter !== "all" && e.vehicle_id !== vehicleFilter) return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const tollTotal = filteredExpenses
    .filter((e) => e.type === "toll")
    .reduce((sum, e) => sum + e.amount, 0);
  const maintenanceTotal = filteredExpenses
    .filter((e) => e.type === "maintenance")
    .reduce((sum, e) => sum + e.amount, 0);
  const miscTotal = filteredExpenses
    .filter((e) => e.type === "miscellaneous")
    .reduce((sum, e) => sum + e.amount, 0);

  const onCreate = async (data: ExpenseFormData) => {
    try {
      const expense = await createExpense({
        vehicle_id: data.vehicle_id,
        trip_id: data.trip_id ?? null,
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
      });
      setExpenses((prev) => [expense, ...prev]);
      reset();
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create expense:", err);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId);
      setExpenses((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track operational expenses across your fleet.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                ₹{totalExpenses.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tolls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">
                ₹{tollTotal.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">
                ₹{maintenanceTotal.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Miscellaneous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">
                ₹{miscTotal.toLocaleString()}
              </span>
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
          <Label className="text-sm font-medium">Type:</Label>
          <Select value={typeFilter} onValueChange={(v) => v !== null && setTypeFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="toll">Toll</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Expense Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Amount
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
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const vehicle = vehicleMap[expense.vehicle_id];
                  return (
                    <tr key={expense.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {vehicle?.registration_number ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle?.model ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${expenseTypeColors[expense.type]}`}
                        >
                          {expenseTypeLabels[expense.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ₹{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => {
                            setDeleteId(expense.id);
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
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a new operational expense.
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

            <div className="space-y-2">
              <Label>Expense Type</Label>
              <Select
                value={watchedType}
                onValueChange={(v) => v !== null && setValue("type", v as "toll" | "maintenance" | "miscellaneous")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toll">Toll</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="e.g. Highway toll" />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>
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
                {isSubmitting ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
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

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Driver } from "@/types";

interface DeleteDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  onConfirm: (id: string) => Promise<void>;
}

export function DeleteDriverDialog({
  open,
  onOpenChange,
  driver,
  onConfirm,
}: DeleteDriverDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!driver) return;
    try {
      setError(null);
      setDeleting(true);
      await onConfirm(driver.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Driver</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{driver?.name}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

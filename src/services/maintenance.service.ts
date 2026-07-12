import { createClient } from "@/lib/supabase/client";
import type { MaintenanceRecord } from "@/types";

export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("maintenance").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("maintenance").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createMaintenanceRecord(record: Omit<MaintenanceRecord, "id" | "created_at">): Promise<MaintenanceRecord> {
  const supabase = createClient();
  const { data, error } = await supabase.from("maintenance").insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
  const supabase = createClient();
  const { data, error } = await supabase.from("maintenance").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMaintenanceRecord(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("maintenance").delete().eq("id", id);
  if (error) throw error;
}

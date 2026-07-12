import { supabase } from "@/lib/supabase";
import type { FuelLog } from "@/types";

export async function getFuelLogs(): Promise<FuelLog[]> {
  const { data, error } = await supabase.from("fuel_logs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFuelLog(log: Omit<FuelLog, "id" | "created_at">): Promise<FuelLog> {
  const { data, error } = await supabase.from("fuel_logs").insert(log).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFuelLog(id: string): Promise<void> {
  const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
  if (error) throw error;
}

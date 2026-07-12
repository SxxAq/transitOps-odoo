import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/types";

export async function getDrivers(): Promise<Driver[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDriver(id: string): Promise<Driver | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("drivers").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createDriver(driver: Omit<Driver, "id" | "created_at">): Promise<Driver> {
  const supabase = createClient();
  const { data, error } = await supabase.from("drivers").insert(driver).select().single();
  if (error) throw error;
  return data;
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
  const supabase = createClient();
  const { data, error } = await supabase.from("drivers").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDriver(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) throw error;
}

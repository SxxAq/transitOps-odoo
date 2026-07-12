import { supabase } from "@/lib/supabase";
import type { Trip } from "@/types";

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createTrip(trip: Omit<Trip, "id" | "created_at" | "dispatched_at" | "completed_at">): Promise<Trip> {
  const { data, error } = await supabase.from("trips").insert(trip).select().single();
  if (error) throw error;
  return data;
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

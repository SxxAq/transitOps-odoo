import { createClient } from "@/lib/supabase/client";
import type { Expense } from "@/types";

export async function getExpenses(): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExpense(expense: Omit<Expense, "id" | "created_at">): Promise<Expense> {
  const supabase = createClient();
  const { data, error } = await supabase.from("expenses").insert(expense).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

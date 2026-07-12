import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  // Don't use .single() — it returns 406 when row doesn't exist
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .limit(1);

  if (error || !data || data.length === 0) {
    // Profile doesn't exist — get email from auth and create it
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert({ id: userId, email: user.email ?? "" }, { onConflict: "id" });

      if (!insertError) {
        return { id: userId, email: user.email ?? "", full_name: "", role: null, created_at: new Date().toISOString() };
      }
    }
    return null;
  }

  return data[0] as Profile;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  return getProfile(userId);
}

import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function ensureProfile() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (existing) return existing;

  const { data } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email, display_name: user.email?.split("@")[0] ?? "Trader" })
    .select()
    .single();

  return data;
}

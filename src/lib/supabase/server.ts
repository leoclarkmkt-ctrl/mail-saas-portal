import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

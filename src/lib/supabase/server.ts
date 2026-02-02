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

export function createServerSupabaseAnonClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon environment variables.");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false }
  });
}

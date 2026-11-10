import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _admin: SupabaseClient<Database> | null = null;
let _public: SupabaseClient<Database> | null = null;

/** Service-role client: bypasses RLS. Server-only, for writes and subscriber data. */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
  _admin = createClient<Database>(url, key, { auth: { persistSession: false } });
  return _admin;
}

/** Anon client: read-only access to public brief data through RLS. */
export function getSupabasePublic(): SupabaseClient<Database> {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  _public = createClient<Database>(url, key, { auth: { persistSession: false } });
  return _public;
}

import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

/** Shared Supabase env check - when false, app runs in local collaboration mode (no cloud DB). */
export function isSupabaseConfigured() {
  return isSupabaseEnvConfigured();
}

// Dev-user identity lives in @/lib/auth/session — do not redefine it here.

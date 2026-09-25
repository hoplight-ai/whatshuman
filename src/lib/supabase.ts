import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

// Only create a real client when env is set. Otherwise export a proxy that throws
// only if any method is actually called — module import stays safe.
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "hoai_auth",
      },
    })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
          );
        },
      },
    ) as unknown as SupabaseClient);


// Schema types matching the existing public.phrases table
export type SourceType = "human" | "ai";
export type Register = "academic" | "business" | "journalism" | "marketing" | "creative" | "casual" | "other";

export interface Phrase {
  id: string;
  text: string;
  word_count: number;
  source_type: SourceType;
  register: Register | null;
  human_source: string | null;
  human_source_url: string | null;
  human_era: string | null;
  ai_model_internal: string | null;
  ai_prompt_id: string | null;
  tell_density: number | null;
  tells_present: string[] | string | null;
  approved: boolean;
}

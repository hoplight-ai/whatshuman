import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";

// React hook returning the current Supabase auth user (or null) and a loading flag.
// Sets up the onAuthStateChange listener BEFORE calling getSession to avoid races.
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}

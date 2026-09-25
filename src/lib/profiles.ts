import { supabase } from "./supabase";

export interface UserProfile {
  user_id: string;
  username: string;
  marketing_opt_in: boolean;
  total_correct: number;
  total_played: number;
  best_streak: number;
}

// LocalStorage key holding the chosen username + marketing flag while the user
// completes the magic-link round-trip. Cleared once the profile row is created.
const PENDING_KEY = "hoai_pending_signup";

export interface PendingSignup {
  username: string;
  marketing_opt_in: boolean;
}

export function setPendingSignup(p: PendingSignup) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function getPendingSignup(): PendingSignup | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (typeof parsed.username !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSignup() {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, username, marketing_opt_in, total_correct, total_played, best_streak")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[fetchProfile] failed:", error);
    return null;
  }
  return (data as UserProfile | null) ?? null;
}

// Username: 2-20 chars, alphanumeric + underscore.
const USERNAME_RE = /^[A-Za-z0-9_]{2,20}$/;

export function isValidUsername(u: string): boolean {
  return USERNAME_RE.test(u);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id")
    .ilike("username", username)
    .limit(1);
  if (error) {
    console.error("[isUsernameAvailable] failed:", error);
    // Be conservative: if we can't check, allow submission and let DB unique constraint catch it.
    return true;
  }
  return (data ?? []).length === 0;
}

// Insert the profile row on first authenticated load. Idempotent — if a row
// already exists for this user_id, returns the existing row.
export async function ensureProfile(
  userId: string,
  pending: PendingSignup,
): Promise<{ profile: UserProfile | null; created: boolean; error: string | null }> {
  const existing = await fetchProfile(userId);
  if (existing) return { profile: existing, created: false, error: null };

  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      username: pending.username,
      marketing_opt_in: pending.marketing_opt_in,
    })
    .select("user_id, username, marketing_opt_in, total_correct, total_played, best_streak")
    .single();
  if (error) {
    console.error("[ensureProfile] insert failed:", error);
    return { profile: null, created: false, error: error.message };
  }
  return { profile: data as UserProfile, created: true, error: null };
}

// Increment per-round stats. Reads current row, computes new values, writes back.
// We do this client-side because Postgres function setup is out of scope here.
export async function applyRoundStats(
  userId: string,
  roundCorrect: number,
  roundPlayed: number,
  roundMaxStreak: number,
): Promise<void> {
  const profile = await fetchProfile(userId);
  if (!profile) return;
  const next = {
    total_correct: profile.total_correct + roundCorrect,
    total_played: profile.total_played + roundPlayed,
    best_streak: Math.max(profile.best_streak, roundMaxStreak),
  };
  const { error } = await supabase.from("user_profiles").update(next).eq("user_id", userId);
  if (error) {
    console.error("[applyRoundStats] update failed:", error);
  }
}

// Backfill sessions.user_id for the currently-active session (and any past
// anonymous session id stored in localStorage). Best-effort.
export async function attachSessionToUser(sessionId: string, userId: string): Promise<void> {
  if (!sessionId) return;
  const { error } = await supabase
    .from("sessions")
    .update({ user_id: userId })
    .eq("id", sessionId)
    .is("user_id", null);
  if (error) {
    console.error("[attachSessionToUser] update failed:", error);
  }
}

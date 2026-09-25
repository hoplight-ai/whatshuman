import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isValidUsername, isUsernameAvailable, setPendingSignup } from "@/lib/profiles";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Stage = "form" | "sending" | "sent";

export function SignupModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [optIn, setOptIn] = useState(false); // default UNCHECKED
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidUsername(cleanUsername)) {
      setError("Username must be 2-20 characters: letters, numbers, underscore.");
      return;
    }

    setStage("sending");
    try {
      const available = await isUsernameAvailable(cleanUsername);
      if (!available) {
        setError("That username is already taken.");
        setStage("form");
        return;
      }

      // Stash the chosen username + opt-in so the post-magic-link callback
      // can create the profile row once the user is authenticated.
      setPendingSignup({ username: cleanUsername, marketing_opt_in: optIn });

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin + "/?postauth=1",
        },
      });
      if (otpErr) {
        setError(otpErr.message);
        setStage("form");
        return;
      }
      setStage("sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setStage("form");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Save your score"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl text-foreground">Save your score</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll email you a magic link — no password.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {stage === "sent" ? (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
            Check your email for a magic link. Open it on this device to finish saving your score.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={stage === "sending"}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={stage === "sending"}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                placeholder="readsharp"
                minLength={2}
                maxLength={20}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                2–20 characters. Letters, numbers, and underscores. Locked once set.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 px-3 py-3">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                disabled={stage === "sending"}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">
                Email me when new phrase packs drop and what we're learning about AI writing.
              </span>
            </label>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={stage === "sending"}
              className="w-full rounded-xl border border-foreground bg-foreground px-4 py-3 text-base font-medium text-background hover:opacity-90 disabled:opacity-60"
            >
              {stage === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

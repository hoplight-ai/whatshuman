import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/lib/auth";
import { fetchProfile, type UserProfile } from "@/lib/profiles";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Human or AI?" },
      { name: "description", content: "See who's reading sharpest. Top players ranked by accuracy and volume." },
      { property: "og:title", content: "Leaderboard — Human or AI?" },
      { property: "og:description", content: "See who's reading sharpest." },
    ],
  }),
  component: LeaderboardPage,
});

interface LeaderboardRow {
  rank: number;
  username: string;
  accuracy: number;
  total_played: number;
  best_streak: number;
  total_correct: number;
  user_id: string;
}

const QUALIFY_PLAYS = 50;

function LeaderboardPage() {
  const { user, loading: authLoading } = useAuthUser();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Read the leaderboard view: it already filters/orders by score and only
      // includes qualified players (>= QUALIFY_PLAYS). Pull a generous slice so
      // we can pin the user's row even if they're outside the top 10.
      const { data, error: viewErr } = await supabase
        .from("leaderboard")
        .select("rank, username, accuracy, total_played, best_streak, total_correct, user_id")
        .order("rank", { ascending: true })
        .limit(500);
      if (cancelled) return;
      if (viewErr) {
        setError(viewErr.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as LeaderboardRow[]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfile(user.id).then((p) => setProfile(p));
  }, [user]);

  const top10 = rows?.slice(0, 10) ?? [];
  const myRow = rows?.find((r) => user && r.user_id === user.id) ?? null;
  const myInTop10 = !!(myRow && top10.some((r) => r.user_id === myRow.user_id));
  const qualified = !!myRow;
  const playsToGo =
    profile && profile.total_played < QUALIFY_PLAYS ? QUALIFY_PLAYS - profile.total_played : 0;

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <ThemeToggle />
      <div className="mx-auto max-w-2xl px-6 py-10 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-foreground">Leaderboard</h1>
          <Link
            to="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to game
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Ranked by accuracy and volume. Minimum {QUALIFY_PLAYS} plays to qualify.
        </p>

        {error && (
          <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Couldn't load leaderboard: {error}
          </div>
        )}

        {rows === null && !error && (
          <div className="mt-10 text-center text-sm text-muted-foreground">Loading…</div>
        )}

        {rows !== null && rows.length === 0 && !error && (
          <div className="mt-10 rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
            No qualified players yet. Be the first.
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="border-l border-border px-3 py-2 text-left font-medium">Player</th>
                  <th className="border-l border-border px-3 py-2 text-right font-medium">Accuracy</th>
                  <th className="border-l border-border px-3 py-2 text-right font-medium">Plays</th>
                  <th className="border-l border-border px-3 py-2 text-right font-medium">Streak</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((r, i) => (
                  <Row key={r.user_id} row={r} zebra={i % 2 === 1} highlight={user?.id === r.user_id} />
                ))}
                {myRow && !myInTop10 && (
                  <>
                    <tr>
                      <td colSpan={5} className="border-t border-border bg-muted/30 px-3 py-1 text-center text-xs text-muted-foreground">
                        … your rank …
                      </td>
                    </tr>
                    <Row row={myRow} zebra={false} highlight />
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!authLoading && !qualified && (
          <div className="mt-6 rounded-xl border border-border bg-card/60 p-4 text-center text-sm text-muted-foreground">
            {!user ? (
              <>
                Sign up and play {QUALIFY_PLAYS} phrases to qualify for the leaderboard.
              </>
            ) : playsToGo > 0 ? (
              <>
                Play {playsToGo} more {playsToGo === 1 ? "phrase" : "phrases"} to qualify for the leaderboard.
              </>
            ) : (
              <>You're qualified — your row will appear after the next refresh.</>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ row, zebra, highlight }: { row: LeaderboardRow; zebra: boolean; highlight: boolean }) {
  const base = highlight ? "bg-cyan-500/10" : zebra ? "bg-muted/30" : "";
  const rankWeight = highlight ? "font-semibold text-cyan-700 dark:text-cyan-300" : "text-foreground";
  return (
    <tr className={`border-t border-border ${base}`}>
      <td className={`px-3 py-2 ${rankWeight}`}>{row.rank}</td>
      <td className="border-l border-border px-3 py-2 text-foreground">
        {row.username}
        {highlight && <span className="ml-2 text-xs text-cyan-700 dark:text-cyan-300">you</span>}
      </td>
      <td className="border-l border-border px-3 py-2 text-right text-foreground">{Math.round(row.accuracy)}%</td>
      <td className="border-l border-border px-3 py-2 text-right text-foreground">{row.total_played}</td>
      <td className="border-l border-border px-3 py-2 text-right text-foreground">{row.best_streak}</td>
    </tr>
  );
}

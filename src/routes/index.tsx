import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Onboarding, type OnboardingResult } from "@/components/onboarding";
import { PhraseCard } from "@/components/phrase-card";
import { EndScreen, type VoteLog } from "@/components/end-screen";
import type { Phrase, SourceType } from "@/lib/supabase";
import { supabaseConfigured } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import { fetchRoundPhrases, recordVote, recordVoteExplanation, upsertSession, ROUND_LENGTH, nextRoundLength } from "@/lib/game";
import { useAuthUser, signOut } from "@/lib/auth";
import { applyRoundStats, attachSessionToUser, ensureProfile, fetchProfile, getPendingSignup, clearPendingSignup, type UserProfile } from "@/lib/profiles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Human or AI? — A perception game for the LLM era" },
      {
        name: "description",
        content: "Can you tell human writing from AI writing? Vote on 30 short phrases and see how you compare.",
      },
      { property: "og:title", content: "Human or AI?" },
      { property: "og:description", content: "Can you tell the difference?" },
    ],
  }),
  component: Index,
});

type Stage = "loading" | "onboarding" | "playing" | "done" | "error";

const ONBOARD_KEY = "hoai_onboarded";

function Index() {
  const [stage, setStage] = useState<Stage>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<VoteLog[]>([]);
  const [voteWarning, setVoteWarning] = useState<string | null>(null);
  const [voteSaved, setVoteSaved] = useState<boolean>(true);
  const [roundLength, setRoundLength] = useState<number>(ROUND_LENGTH);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [brokenStreak, setBrokenStreak] = useState<number | null>(null);
  const [lastVoteId, setLastVoteId] = useState<string | null>(null);
  const [prevAccuracy, setPrevAccuracy] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const lastStatsRoundRef = useRef<number>(0);
  const postAuthHandledRef = useRef<boolean>(false);
  const attemptedVotesRef = useRef<Set<string>>(new Set());

  // Post-magic-link bootstrap: when ?postauth=1 is present and we have a user,
  // create the profile row from the pending signup blob and redirect to /leaderboard.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("postauth") !== "1") return;
    if (!user || postAuthHandledRef.current) return;
    postAuthHandledRef.current = true;
    (async () => {
      const pending = getPendingSignup();
      if (pending) {
        const res = await ensureProfile(user.id, pending);
        if (res.error) {
          console.error("[postauth] ensureProfile error:", res.error);
        }
        clearPendingSignup();
      }
      try {
        await attachSessionToUser(getSessionId(), user.id);
      } catch (e) {
        console.error("[postauth] attachSessionToUser failed:", e);
      }
      url.searchParams.delete("postauth");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      navigate({ to: "/leaderboard" });
    })();
  }, [user, navigate]);

  // Keep profile in sync with auth state.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    fetchProfile(user.id).then((p) => setProfile(p));
  }, [user]);

  // Push stats to user_profiles exactly once per finished round.
  useEffect(() => {
    if (stage !== "done") return;
    if (!user) return;
    if (lastStatsRoundRef.current === roundNumber) return;
    lastStatsRoundRef.current = roundNumber;
    const correct = votes.filter((v) => v.correct).length;
    const played = votes.length;
    (async () => {
      await applyRoundStats(user.id, correct, played, maxStreak);
      const p = await fetchProfile(user.id);
      setProfile(p);
    })();
  }, [stage, user, roundNumber, votes, maxStreak]);

  // While authenticated, transparently attach the active session to this user.
  useEffect(() => {
    if (!user) return;
    attachSessionToUser(getSessionId(), user.id).catch(() => {});
  }, [user]);

  // Boot
  useEffect(() => {
    if (!supabaseConfigured) {
      setErrorMsg(
        "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
      );
      setStage("error");
      return;
    }
    const onboarded = typeof window !== "undefined" && window.localStorage.getItem(ONBOARD_KEY);
    if (onboarded) startRound(ROUND_LENGTH, 1);
    else setStage("onboarding");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRound(length: number, roundNum: number, prevSeenIds: string[] = []) {
    setStage("loading");
    try {
      const sid = getSessionId();
      try {
        await upsertSession({ id: sid });
      } catch (e) {
        // Session insert failure is fatal — votes can't be recorded without it.
        const msg = e instanceof Error ? e.message : "Failed to create session.";
        setErrorMsg(`Couldn't create your session: ${msg}`);
        setStage("error");
        return;
      }

      const list = await fetchRoundPhrases(prevSeenIds, length);
      if (list.length === 0) {
        setErrorMsg("No approved phrases available.");
        setStage("error");
        return;
      }
      setPhrases(list);
      setRoundLength(length);
      setRoundNumber(roundNum);
      setIdx(0);
      setVotes([]);
      setVoteWarning(null);
      setVoteSaved(true);
      setStreak(0);
      setMaxStreak(0);
      setBrokenStreak(null);
      setLastVoteId(null);
      attemptedVotesRef.current = new Set();
      setStage("playing");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load phrases.");
      setStage("error");
    }
  }

  async function handleOnboardingDone(r: OnboardingResult) {
    window.localStorage.setItem(ONBOARD_KEY, "1");
    try {
      const sid = getSessionId();
      await upsertSession({ id: sid, age_bucket: r.age_bucket, primary_register: r.primary_register });
    } catch {
      // Demographics write is non-blocking; startRound will retry the base session row.
    }
    startRound(ROUND_LENGTH, 1);
  }

  async function handleVote(vote: SourceType, correct: boolean) {
    const phrase = phrases[idx];
    if (!phrase) return;
    const sid = getSessionId();
    const voteKey = `${sid}:${phrase.id}`;
    if (attemptedVotesRef.current.has(voteKey)) {
      console.debug("[handleVote] duplicate vote attempt suppressed:", voteKey);
      return;
    }
    attemptedVotesRef.current.add(voteKey);
    setVotes((prev) => [...prev, { phrase, vote, correct }]);
    // Update streak: increment on correct, capture broken streak on wrong
    if (correct) {
      setStreak((s) => {
        const next = s + 1;
        setMaxStreak((m) => (next > m ? next : m));
        return next;
      });
      setBrokenStreak(null);
    } else {
      setStreak((s) => {
        setBrokenStreak(s); // PhraseCard only shows it if >= 5
        return 0;
      });
    }
    setVoteSaved(false);
    setVoteWarning(null);
    setLastVoteId(null);
    try {
      const voteId = await recordVote({
        session_id: sid,
        phrase_id: phrase.id,
        vote,
        was_correct: correct,
      });
      setLastVoteId(voteId);
      setVoteSaved(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setVoteWarning(`Couldn't save your vote (${msg}).`);
    }
  }

  async function handleSaveExplanation(clickedIndices: number[], qualitative: string) {
    if (!lastVoteId) return;
    await recordVoteExplanation({
      vote_id: lastVoteId,
      clicked_word_indices: clickedIndices,
      qualitative_text: qualitative.trim() ? qualitative.trim().slice(0, 500) : null,
    });
  }

  function handleAdvance() {
    if (idx + 1 >= phrases.length) {
      setStage("done");
    } else {
      setIdx((i) => i + 1);
      setVoteWarning(null);
      setVoteSaved(true);
    }
  }

  function dismissWarning() {
    setVoteWarning(null);
    setVoteSaved(true); // user acknowledged — allow advance
  }

  function handlePlayAgain() {
    const seen = votes.map((v) => v.phrase.id);
    const finishedAccuracy =
      votes.length === 0 ? 0 : Math.round((votes.filter((v) => v.correct).length / votes.length) * 100);
    setPrevAccuracy(finishedAccuracy);
    startRound(nextRoundLength(roundLength), roundNumber + 1, seen);
  }

  // Running accuracy reflects all votes cast so far in this round
  const accuracy =
    votes.length === 0 ? 0 : Math.round((votes.filter((v) => v.correct).length / votes.length) * 100);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <ThemeToggle />

      {/* Header nav: Leaderboard link + auth state. Sits below ThemeToggle (top-right). */}
      <div className="fixed left-4 top-4 z-40 flex items-center gap-3 text-xs">
        {user && (
          <Link
            to="/leaderboard"
            className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-foreground backdrop-blur hover:bg-accent"
          >
            Leaderboard
          </Link>
        )}
        {user && profile && (
          <span className="hidden text-muted-foreground sm:inline">
            {profile.username}
          </span>
        )}
        {user && (
          <button
            onClick={() => signOut()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            Sign out
          </button>
        )}
      </div>

      {stage === "loading" && (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      )}

      {stage === "error" && (
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-2xl text-foreground">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      )}

      {stage === "onboarding" && <Onboarding onDone={handleOnboardingDone} />}

      {stage === "playing" && phrases[idx] && (
        <PhraseCard
          phrase={phrases[idx]}
          index={idx}
          total={phrases.length}
          accuracySoFar={accuracy}
          streak={streak}
          brokenStreak={brokenStreak}
          onVote={handleVote}
          onAdvance={handleAdvance}
          canAdvance={voteSaved}
          warning={voteWarning}
          onDismissWarning={dismissWarning}
          onSaveExplanation={handleSaveExplanation}
        />
      )}

      {stage === "done" && (
        <EndScreen
          votes={votes}
          maxStreak={maxStreak}
          nextRoundNumber={roundNumber + 1}
          nextRoundLength={nextRoundLength(roundLength)}
          isMaxRound={roundLength >= 30}
          onPlayAgain={handlePlayAgain}
          prevAccuracy={prevAccuracy}
          roundNumber={roundNumber}
          isAuthenticated={!!user}
        />
      )}
    </main>
  );
}

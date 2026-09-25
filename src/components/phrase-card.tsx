import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { Phrase, SourceType } from "@/lib/supabase";
import { getCommunitySplit, getTopClickedWordIndices, type CommunitySplit } from "@/lib/game";
import { lookupTell } from "@/lib/tells";

interface Props {
  phrase: Phrase;
  index: number; // 0-based
  total: number;
  accuracySoFar: number; // 0..100
  streak: number;
  brokenStreak?: number | null; // shows "Streak broken (was N)" when set and N >= 5
  onVote: (vote: SourceType, correct: boolean) => void;
  onAdvance: () => void;
  canAdvance?: boolean;
  warning?: string | null;
  onDismissWarning?: () => void;
  onSaveExplanation?: (clickedIndices: number[], qualitative: string) => Promise<void> | void;
}

export function PhraseCard({
  phrase,
  index,
  total,
  accuracySoFar,
  streak,
  brokenStreak = null,
  onVote,
  onAdvance,
  canAdvance = true,
  warning = null,
  onDismissWarning,
  onSaveExplanation,
}: Props) {
  const [vote, setVote] = useState<SourceType | null>(null);
  const [split, setSplit] = useState<CommunitySplit | null>(null);
  const [showBroken, setShowBroken] = useState(false);
  const [clickedWords, setClickedWords] = useState<Set<number>>(new Set());
  const [qualitative, setQualitative] = useState("");
  const [savingExplanation, setSavingExplanation] = useState(false);
  const [topClicked, setTopClicked] = useState<Set<number>>(new Set());

  // Reset when phrase changes
  useEffect(() => {
    setVote(null);
    setSplit(null);
    setClickedWords(new Set());
    setQualitative("");
    setSavingExplanation(false);
    setTopClicked(new Set());
  }, [phrase.id]);

  // "Streak broken (was N)" — show on entry of a new card, fade after 1.5s
  useEffect(() => {
    if (brokenStreak && brokenStreak >= 5) {
      setShowBroken(true);
      const t = setTimeout(() => setShowBroken(false), 1500);
      return () => clearTimeout(t);
    }
    setShowBroken(false);
  }, [phrase.id, brokenStreak]);

  const correct = vote !== null && vote === phrase.source_type;

  async function handleVote(v: SourceType) {
    if (vote !== null) return;
    setVote(v);
    const isCorrect = v === phrase.source_type;
    onVote(v, isCorrect);

    if (isCorrect) celebrate();

    try {
      const s = await getCommunitySplit(phrase.id);
      setSplit(s);
    } catch {
      setSplit({ human_pct: 50, ai_pct: 50, total: 0 });
    }

    // Teach-back: only for wrong guesses on AI phrases
    if (!isCorrect && phrase.source_type === "ai") {
      const top = await getTopClickedWordIndices(phrase.id);
      setTopClicked(top);
    }
  }

  return (
    <div key={phrase.id} className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-8 fade-in">
      {/* Top stat bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-4">
          <span>
            Accuracy <span className="text-foreground font-medium">{accuracySoFar}%</span>
          </span>
          <span>
            Streak{" "}
            <span
              className={`font-medium ${
                streak >= 3 ? "text-success animate-pulse" : "text-foreground"
              }`}
            >
              {streak}
            </span>
          </span>
        </div>
      </div>

      {/* Streak broken banner */}
      <div className="h-5 mt-2">
        {showBroken && brokenStreak && (
          <p className="text-center text-xs font-medium text-muted-foreground fade-in animate-fade-out">
            Streak broken (was {brokenStreak})
          </p>
        )}
      </div>

      {/* Card */}
      <div className="mt-6 flex flex-1 items-center">
        <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-[28px]">
          &ldquo;{phrase.text}&rdquo;
        </p>
      </div>

      {/* Reveal area */}
      {vote !== null && (
        <div className="mb-6 fade-in">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                correct ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {correct ? "Correct" : "Wrong"}
            </span>
            <span className="text-sm text-muted-foreground">
              Actually {phrase.source_type === "human" ? "Human" : "AI"}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <SplitBar label="Human" pct={split?.human_pct ?? 50} color="human" />
            <SplitBar label="AI" pct={split?.ai_pct ?? 50} color="ai" />
            <p className="pt-1 text-xs text-muted-foreground">
              {split && split.total > 0
                ? `${split.total} ${split.total === 1 ? "vote" : "votes"} from prior players`
                : "You're among the first to vote on this one."}
            </p>
          </div>
        </div>
      )}

      {/* Click-to-explain (correct guesses only) */}
      {vote !== null && correct && (
        <div className="mb-6 fade-in">
          <p className="mb-2 text-sm font-medium text-foreground">
            What gave it away?
          </p>
          <p className="font-serif text-lg leading-relaxed text-foreground">
            {phrase.text.split(/(\s+)/).map((token, i) => {
              if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
              // Compute word index (only count non-whitespace tokens)
              const wordIndex = phrase.text
                .split(/(\s+)/)
                .slice(0, i)
                .filter((t) => !/^\s+$/.test(t)).length;
              const isClicked = clickedWords.has(wordIndex);
              return (
                <span
                  key={i}
                  onClick={() => {
                    setClickedWords((prev) => {
                      const next = new Set(prev);
                      if (next.has(wordIndex)) next.delete(wordIndex);
                      else next.add(wordIndex);
                      return next;
                    });
                  }}
                  className={`cursor-pointer rounded px-0.5 transition-colors ${
                    isClicked ? "bg-success/30 text-foreground" : "hover:bg-muted"
                  }`}
                >
                  {token}
                </span>
              );
            })}
          </p>
          <div className="mt-4">
            <textarea
              id="qualitative"
              aria-label="What gave it away, in your own words (optional)"
              value={qualitative}
              onChange={(e) => setQualitative(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-background p-2 text-sm text-foreground focus:border-foreground focus:outline-none"
              placeholder="Tap the words above, or say it here (optional)"
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{qualitative.length}/500</p>
          </div>
        </div>
      )}

      {/* Teach-back (wrong guess on AI phrase only) */}
      {vote !== null && !correct && phrase.source_type === "ai" && (() => {
        const tellsList: string[] = normalizeTellsPresent(phrase.tells_present);
        return (
        <div className="mb-6 fade-in rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What you missed
          </p>
          <p className="font-serif text-lg leading-relaxed text-foreground">
            {phrase.text.split(/(\s+)/).map((token, i) => {
              if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
              const wordIndex = phrase.text
                .split(/(\s+)/)
                .slice(0, i)
                .filter((t) => !/^\s+$/.test(t)).length;
              const isHot = topClicked.has(wordIndex);
              return (
                <span
                  key={i}
                  className={
                    isHot
                      ? "rounded px-0.5 bg-amber-200/60 text-foreground dark:bg-amber-400/30"
                      : ""
                  }
                >
                  {token}
                </span>
              );
            })}
          </p>
          {topClicked.size === 0 && (
            <p className="mt-2 text-[11px] italic text-muted-foreground">
              Not enough player data yet to highlight tipoff words.
            </p>
          )}

          {tellsList.length > 0 && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {tellsList.slice(0, 3).map((tellId) => {
                const t = lookupTell(tellId);
                return (
                  <div key={tellId}>
                    <p className="text-xs font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.short}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        );
      })()}


      {warning && (
        <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive fade-in">
          <p className="font-medium">{warning}</p>
          <button
            onClick={onDismissWarning}
            className="mt-1 underline underline-offset-2 hover:opacity-80"
          >
            Dismiss & continue
          </button>
        </div>
      )}

      {/* Buttons */}
      {vote === null ? (
        <div className="grid grid-cols-2 gap-3">
          <VoteButton label="Human" onClick={() => handleVote("human")} disabled={false} highlight="none" tone="human" />
          <VoteButton label="AI" onClick={() => handleVote("ai")} disabled={false} highlight="none" tone="ai" />
        </div>
      ) : correct && onSaveExplanation ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAdvance}
            disabled={!canAdvance || savingExplanation}
            className="rounded-xl border border-border bg-background px-4 py-4 text-base font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={async () => {
              if (!canAdvance || savingExplanation) return;
              setSavingExplanation(true);
              try {
                await onSaveExplanation(Array.from(clickedWords).sort((a, b) => a - b), qualitative);
              } catch {
                // swallowed — recordVoteExplanation already logs and never throws
              }
              onAdvance();
            }}
            disabled={!canAdvance || savingExplanation}
            className="rounded-xl border border-foreground bg-foreground/90 px-4 py-4 text-base font-semibold text-background hover:bg-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingExplanation ? "Saving…" : "Save & continue"}
          </button>
        </div>
      ) : (
        <button
          onClick={onAdvance}
          disabled={!canAdvance}
          className="rounded-xl border border-foreground bg-foreground px-4 py-5 text-lg font-semibold text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!canAdvance
            ? "Saving…"
            : !correct && phrase.source_type === "ai"
              ? index + 1 >= total
                ? "Got it — see results"
                : "Got it"
              : index + 1 >= total
                ? "See results"
                : "Next phrase"}
        </button>
      )}
    </div>
  );
}

// Postgres text[] usually arrives as a JS array via PostgREST, but if the
// column is text (or in some edge cases) it can come back as the literal
// string "{T49,T58}". Normalize both shapes to a clean string[].
function normalizeTellsPresent(input: string[] | string | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === "string" && s.length > 0);
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    // Postgres array literal: {T49,T58} or {"T49","T58"}
    const stripped = trimmed.replace(/^\{|\}$/g, "");
    if (!stripped) return [];
    return stripped
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter((s) => s.length > 0);
  }
  return [];
}

function celebrate() {
  const defaults = {
    spread: 70,
    startVelocity: 35,
    ticks: 120,
    gravity: 0.9,
    scalar: 0.9,
    disableForReducedMotion: true,
    colors: ["#10b981", "#34d399", "#a7f3d0", "#ffffff"],
  };
  confetti({
    ...defaults,
    particleCount: 60,
    origin: { x: 0.25, y: 0.7 },
    angle: 70,
  });
  confetti({
    ...defaults,
    particleCount: 60,
    origin: { x: 0.75, y: 0.7 },
    angle: 110,
  });
}

function SplitBar({ label, pct, color }: { label: string; pct: number; color: "human" | "ai" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color === "human" ? "var(--human)" : "var(--ai)",
          }}
        />
      </div>
    </div>
  );
}

function VoteButton({
  label,
  onClick,
  disabled,
  highlight,
  tone,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  highlight: "none" | "correct" | "wrong" | "answer";
  tone: "human" | "ai";
}) {
  let cls =
    "rounded-xl border border-border bg-card px-4 py-5 text-lg font-semibold text-card-foreground transition-colors";
  if (highlight === "correct" || highlight === "answer") {
    cls = "rounded-xl border-2 border-transparent bg-success px-4 py-5 text-lg font-semibold text-success-foreground";
  } else if (highlight === "wrong") {
    cls =
      "rounded-xl border-2 border-transparent bg-destructive px-4 py-5 text-lg font-semibold text-destructive-foreground";
  } else if (!disabled) {
    cls += tone === "human" ? " hover:bg-accent" : " hover:bg-accent";
  } else {
    cls += " opacity-60";
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {label}
    </button>
  );
}
